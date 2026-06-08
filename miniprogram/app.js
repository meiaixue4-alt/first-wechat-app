const { CLOUD_ENV_ID } = require('./config/constants')

App({
  onLaunch() {
    // 初始化云开发
    if (wx.cloud && CLOUD_ENV_ID) {
      wx.cloud.init({ env: CLOUD_ENV_ID, traceUser: true })
    }

    // 设备标识（离线可用，作为匿名用户 ID 的兜底）
    this._ensureDeviceId()

    // 尝试通过 wx.login 获取 openid
    wx.login({
      success: (res) => {
        if (res.code) {
          this.globalData.loginCode = res.code
          // 若有云函数 login，在此调用换取 openid
          if (wx.cloud) {
            wx.cloud.callFunction({
              name: 'login',
              success: (cfRes) => {
                if (cfRes.result && cfRes.result.openid) {
                  this.globalData.openid = cfRes.result.openid
                }
              },
              fail: () => {}
            })
          }
        }
      },
      fail: () => {}
    })
  },

  _ensureDeviceId() {
    try {
      let deviceId = wx.getStorageSync('_kepu_device_id')
      if (!deviceId) {
        deviceId = 'd_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
        wx.setStorageSync('_kepu_device_id', deviceId)
      }
      this.globalData.deviceId = deviceId
    } catch (_) {
      this.globalData.deviceId = 'd_anonymous'
    }
  },

  getUserId() {
    return this.globalData.openid || this.globalData.deviceId || 'anonymous'
  },

  globalData: {
    userInfo: null,
    openid: null,
    deviceId: null,
    loginCode: null
  }
})
