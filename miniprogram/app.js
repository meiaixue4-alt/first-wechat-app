const { CLOUD_ENV_ID } = require('./config/constants')

App({
  onLaunch() {
    // 初始化云开发
    if (wx.cloud && CLOUD_ENV_ID) {
      wx.cloud.init({ env: CLOUD_ENV_ID, traceUser: true })
    }

    wx.login({
      success: () => {},
      fail: () => {}
    })
  },

  globalData: {
    userInfo: null,
    openid: null
  }
})
