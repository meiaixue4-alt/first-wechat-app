const storageRepo = require('../../repo/storageRepo')

const ADMIN_TAP_COUNT = 5
const ADMIN_TAP_WINDOW = 3000

Page({
  data: {
    favoriteCount: 0,
    disputeCount: 0
  },

  _adminTapCount: 0,
  _adminTapTimer: null,

  onShow() {
    this.setData({
      favoriteCount: storageRepo.getFavoriteCount(),
      disputeCount: storageRepo.getDisputeCount()
    })
  },

  goFavorites() {
    wx.navigateTo({ url: '/pages/favorites/favorites' })
  },

  goHistory() {
    wx.navigateTo({ url: '/pages/history/history' })
  },

  goMyFeedback() {
    wx.navigateTo({ url: '/pages/my-feedback/my-feedback' })
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  goStatic(e) {
    const type = e.currentTarget.dataset.type
    wx.navigateTo({ url: '/pages/static/static?type=' + type })
  },

  onVersionTap() {
    this._adminTapCount++
    if (this._adminTapCount === 1) {
      this._adminTapTimer = setTimeout(() => {
        this._adminTapCount = 0
      }, ADMIN_TAP_WINDOW)
    }
    if (this._adminTapCount >= ADMIN_TAP_COUNT) {
      clearTimeout(this._adminTapTimer)
      this._adminTapCount = 0
      wx.navigateTo({ url: '/pages/admin/admin' })
    }
  }
})
