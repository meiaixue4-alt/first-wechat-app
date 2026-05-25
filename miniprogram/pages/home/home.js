const { getTodayStr, CATEGORY_MAP } = require('../../config/constants')
const tipRepo = require('../../repo/tipRepo')
const storageRepo = require('../../repo/storageRepo')

Page({
  data: {
    todayDate: '',
    tips: [],
    categoryMap: CATEGORY_MAP,
    loading: true,
    showDispute: false,
    disputeTipId: ''
  },

  onLoad() {
    this.setData({ todayDate: getTodayStr() })
    this.loadTips()
  },

  onShow() {
    if (!this.data.loading) {
      this.refreshFavStatus()
    }
  },

  async loadTips() {
    const tips = await tipRepo.getTodayTips()
    const enriched = tips.map(t => ({
      ...t,
      isFavorited: storageRepo.isFavorite(t.id),
      usefulDone: storageRepo.hasUserFeedback(t.id, 'useful'),
      notInterestedDone: storageRepo.hasUserFeedback(t.id, 'not-interested')
    }))
    this.setData({ tips: enriched, loading: false })
  },

  refreshFavStatus() {
    const tips = this.data.tips.map(t => ({
      ...t,
      isFavorited: storageRepo.isFavorite(t.id)
    }))
    this.setData({ tips })
  },

  onCardTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  },

  onUseful(e) {
    const id = e.currentTarget.dataset.id
    storageRepo.addFeedback({ tipId: id, type: 'useful', userId: '' })
    const tips = this.data.tips.map(t => {
      if (t.id === id) { t.usefulCount += 1; t.usefulDone = true }
      return t
    })
    this.setData({ tips })
    wx.showToast({ title: '感谢反馈', icon: 'none', duration: 1500 })
  },

  onNotInterested(e) {
    const id = e.currentTarget.dataset.id
    storageRepo.addFeedback({ tipId: id, type: 'not-interested', userId: '' })
    const tips = this.data.tips.map(t => {
      if (t.id === id) { t.notInterestedDone = true }
      return t
    })
    this.setData({ tips })
    wx.showToast({ title: '已记录，将减少此类推荐', icon: 'none', duration: 1500 })
  },

  onDispute(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ showDispute: true, disputeTipId: id })
  },

  onDisputeCancel() {
    this.setData({ showDispute: false, disputeTipId: '' })
  },

  onDisputeSubmit(e) {
    const { tipId, reason, identity } = e.detail
    storageRepo.addFeedback({
      tipId,
      type: 'dispute',
      userId: '',
      disputeReason: reason,
      identity
    })
    this.setData({ showDispute: false, disputeTipId: '' })
    wx.showToast({ title: '感谢反馈，我们会认真核实', icon: 'none', duration: 2000 })
  },

  onToggleFav(e) {
    const id = e.currentTarget.dataset.id
    const isFav = storageRepo.isFavorite(id)
    if (isFav) {
      storageRepo.removeFavorite(id)
    } else {
      storageRepo.addFavorite(id)
    }
    this.refreshFavStatus()
    wx.showToast({ title: isFav ? '已取消收藏' : '已收藏', icon: 'none', duration: 1200 })
  }
})
