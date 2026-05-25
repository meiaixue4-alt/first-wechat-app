const { CATEGORY_MAP } = require('../../config/constants')
const tipRepo = require('../../repo/tipRepo')
const storageRepo = require('../../repo/storageRepo')

Page({
  data: {
    list: [],
    categoryMap: CATEGORY_MAP
  },

  async onShow() {
    const history = storageRepo.getHistory()
    const results = await Promise.all(history.map(h => tipRepo.getById(h.tipId)))
    const list = history
      .map((h, i) => {
        if (!results[i]) return null
        const d = new Date(h.createdAt)
        const timeStr = d.getMonth() + 1 + '/' + d.getDate()
        return { ...h, ...results[i], viewedAt: timeStr }
      })
      .filter(Boolean)
    this.setData({ list })
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  }
})
