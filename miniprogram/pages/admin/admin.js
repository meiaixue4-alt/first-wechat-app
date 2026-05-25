const { CATEGORIES, CATEGORY_MAP, getTodayStr } = require('../../config/constants')
const tipRepo = require('../../repo/tipRepo')
const mockTips = require('../../data/mock-tips')

const ADMIN_PASSWORD = 'zhiwu2026'
const PAGE_SIZE = 20

Page({
  data: {
    unlocked: false,
    pwd: '',
    pwdErr: false,

    categoryNames: CATEGORIES.map(c => c.name),
    categoryMap: CATEGORY_MAP,
    categoryIdx: 0,

    form: {
      date: getTodayStr(),
      title: '',
      summary: '',
      body: '',
      image: '',
      referencesText: '',
      usefulCount: 0
    },

    editId: '',
    submitting: false,
    tips: [],
    total: 0,
    page: 1,
    hasMore: false,
    loadingMore: false,
    importing: false,
    importProgress: '',

    // 云连接状态: unknown | connected | disconnected
    cloudStatus: 'unknown',
    cloudStatusText: ''
  },

  onUnlock() {
    if (this.data.pwd === ADMIN_PASSWORD) {
      this.setData({ unlocked: true, pwdErr: false })
      this.checkCloudStatus()
      this.loadTips()
    } else {
      this.setData({ pwdErr: true })
    }
  },

  onPwdInput(e) {
    this.setData({ pwd: e.detail.value, pwdErr: false })
  },

  /** 检测云开发连接状态 */
  async checkCloudStatus() {
    const db = wx.cloud ? wx.cloud.database() : null
    if (!db) {
      this.setData({ cloudStatus: 'disconnected', cloudStatusText: '未连接（使用本地Mock）' })
      return
    }
    try {
      await db.collection('tips').limit(1).get()
      this.setData({ cloudStatus: 'connected', cloudStatusText: '已连接' })
    } catch (_) {
      this.setData({ cloudStatus: 'disconnected', cloudStatusText: '未连接（请开通云开发）' })
    }
  },

  async loadTips() {
    const { list, total, hasMore } = await tipRepo.getAll(1, PAGE_SIZE)
    this.setData({ tips: list, total, hasMore, page: 1 })
  },

  async onLoadMore() {
    if (this.data.loadingMore || !this.data.hasMore) return
    this.setData({ loadingMore: true })
    const page = this.data.page + 1
    const { list, hasMore } = await tipRepo.getAll(page, PAGE_SIZE)
    this.setData({
      tips: [...this.data.tips, ...list],
      page,
      hasMore,
      loadingMore: false
    })
  },

  onCategoryChange(e) {
    this.setData({ categoryIdx: parseInt(e.detail.value) })
  },

  onDateChange(e) {
    this.setData({ 'form.date': e.detail.value })
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },

  async onSubmit() {
    const f = this.data.form
    if (!f.title.trim()) {
      wx.showToast({ title: '标题不能为空', icon: 'none' })
      return
    }
    if (!f.body.trim()) {
      wx.showToast({ title: '正文不能为空', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    const category = CATEGORIES[this.data.categoryIdx].key
    const references = f.referencesText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)

    const tipData = {
      category,
      date: f.date,
      title: f.title.trim(),
      summary: f.summary.trim(),
      body: f.body.trim(),
      image: f.image.trim(),
      references,
      usefulCount: parseInt(f.usefulCount) || 0,
      createdAt: new Date().toISOString()
    }

    let res
    if (this.data.editId) {
      res = await tipRepo.updateTip(this.data.editId, tipData)
    } else {
      tipData.id = 'tip_' + Date.now()
      res = await tipRepo.addTip(tipData)
    }

    this.setData({ submitting: false })

    if (res.ok) {
      wx.showToast({ title: this.data.editId ? '已更新' : '已新增', icon: 'success' })
      this.resetForm()
      this.loadTips()
    } else {
      wx.showToast({ title: '操作失败: ' + (res.error || '未知错误'), icon: 'none' })
    }
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id
    const tip = this.data.tips.find(t => t._id === id)
    if (!tip) return

    const catIdx = CATEGORIES.findIndex(c => c.key === tip.category)
    this.setData({
      editId: id,
      categoryIdx: catIdx >= 0 ? catIdx : 0,
      form: {
        date: tip.date,
        title: tip.title,
        summary: tip.summary,
        body: tip.body,
        image: tip.image || '',
        referencesText: (tip.references || []).join('\n'),
        usefulCount: tip.usefulCount || 0
      }
    })
    wx.pageScrollTo({ scrollTop: 0 })
  },

  onCancelEdit() {
    this.setData({ editId: '' })
    this.resetForm()
  },

  async onImportMock() {
    this.setData({ importing: true, importProgress: '' })

    const existingIds = await tipRepo.getExistingIds()
    const newTips = mockTips.filter(t => !existingIds.has(t.id))

    if (newTips.length === 0) {
      this.setData({ importing: false })
      wx.showToast({ title: '没有新数据需要导入（已全部在云数据库中）', icon: 'none', duration: 2500 })
      return
    }

    const total = newTips.length
    let success = 0
    let fail = 0

    wx.showLoading({ title: `导入中 0 / ${total}`, mask: true })

    for (let i = 0; i < total; i++) {
      const tip = newTips[i]
      const res = await tipRepo.addTip({
        id: tip.id,
        category: tip.category,
        date: tip.date,
        title: tip.title,
        summary: tip.summary,
        body: tip.body,
        image: tip.image || '',
        references: tip.references || [],
        usefulCount: tip.usefulCount || 0,
        createdAt: tip.createdAt
      })
      if (res.ok) success++; else fail++

      // 每 10 条更新一次进度
      if ((i + 1) % 10 === 0 || i === total - 1) {
        wx.showLoading({ title: `导入中 ${i + 1} / ${total}`, mask: true })
      }
    }

    wx.hideLoading()
    this.setData({ importing: false })

    const skipped = mockTips.length - total
    let msg = `成功 ${success} 条`
    if (skipped > 0) msg += `，跳过 ${skipped} 条（已存在）`
    if (fail > 0) msg += `，失败 ${fail} 条`
    wx.showToast({ title: msg, icon: 'none', duration: 3000 })

    // 重新加载列表 + 刷新云状态
    this.loadTips()
    this.checkCloudStatus()
  },

  async onRemoveDuplicates() {
    this.setData({ importing: true })
    const res = await tipRepo.removeDuplicates()
    this.setData({ importing: false })
    if (res.ok) {
      wx.showToast({ title: `已清除 ${res.removed} 条重复数据`, icon: 'success', duration: 2000 })
    } else {
      wx.showToast({ title: '清除失败: ' + (res.error || '未知错误'), icon: 'none' })
    }
    if (res.removed > 0) this.loadTips()
  },

  onClearCache() {
    tipRepo.clearAllCache()
    wx.showToast({ title: '缓存已清除，下次访问将重新拉取', icon: 'success', duration: 2000 })
  },

  resetForm() {
    this.setData({
      editId: '',
      categoryIdx: 0,
      form: {
        date: getTodayStr(),
        title: '',
        summary: '',
        body: '',
        image: '',
        referencesText: '',
        usefulCount: 0
      }
    })
  }
})
