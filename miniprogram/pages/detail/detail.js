const { CATEGORY_MAP } = require('../../config/constants')
const tipRepo = require('../../repo/tipRepo')
const storageRepo = require('../../repo/storageRepo')

Page({
  data: {
    tip: null,
    categoryMap: CATEGORY_MAP,
    isFav: false,
    usefulDone: false,
    showDispute: false,
    disputeTipId: ''
  },

  async onLoad(options) {
    const id = options.id
    if (!id) return

    const tip = await tipRepo.getById(id)
    if (tip) {
      this.setData({
        tip,
        isFav: storageRepo.isFavorite(id),
        usefulDone: storageRepo.hasUserFeedback(id, 'useful')
      })
      storageRepo.addHistory(id)
    }
  },

  onUseful() {
    const tip = this.data.tip
    if (!tip) return
    storageRepo.addFeedback({ tipId: tip.id, type: 'useful', userId: '' })
    tip.usefulCount += 1
    this.setData({ tip, usefulDone: true })
    wx.showToast({ title: '感谢反馈', icon: 'none', duration: 1500 })
  },

  onNotInterested() {
    const tip = this.data.tip
    if (!tip) return
    storageRepo.addFeedback({ tipId: tip.id, type: 'not-interested', userId: '' })
    wx.showToast({ title: '已记录，将减少此类推荐', icon: 'none', duration: 1500 })
  },

  onDispute() {
    const id = this.data.tip ? this.data.tip.id : ''
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

  onToggleFav() {
    const id = this.data.tip.id
    if (this.data.isFav) {
      storageRepo.removeFavorite(id)
    } else {
      storageRepo.addFavorite(id)
    }
    this.setData({ isFav: !this.data.isFav })
    wx.showToast({ title: this.data.isFav ? '已取消收藏' : '已收藏', icon: 'none', duration: 1200 })
  },

  goHome() {
    wx.switchTab({ url: '/pages/home/home' })
  },

  onShareAppMessage() {
    const tip = this.data.tip
    return {
      title: tip ? tip.title : '格物致知',
      path: '/pages/detail/detail?id=' + (tip ? tip.id : '')
    }
  }
})
