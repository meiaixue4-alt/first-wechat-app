const { CATEGORY_MAP } = require('../../config/constants')
const tipRepo = require('../../repo/tipRepo')
const storageRepo = require('../../repo/storageRepo')

Page({
  data: {
    list: [],
    categoryMap: CATEGORY_MAP
  },

  async onShow() {
    const favs = storageRepo.getFavorites()
    const results = await Promise.all(favs.map(f => tipRepo.getById(f.tipId)))
    const list = favs
      .map((f, i) => results[i] ? { ...f, ...results[i] } : null)
      .filter(Boolean)
    this.setData({ list })
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  }
})
