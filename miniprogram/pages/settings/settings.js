const { KEYS } = require('../../repo/storageRepo')

Page({
  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '将清除浏览历史和本地反馈记录，收藏不会丢失。确认清除？',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync(KEYS.HISTORY)
            wx.removeStorageSync(KEYS.FEEDBACK)
            wx.removeStorageSync(KEYS.DISPUTES)
          } catch (e) {}
          wx.showToast({ title: '已清除', icon: 'none', duration: 1500 })
        }
      }
    })
  }
})
