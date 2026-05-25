const { IDENTITY_OPTIONS } = require('../../config/constants')
const tipRepo = require('../../repo/tipRepo')
const storageRepo = require('../../repo/storageRepo')

Page({
  data: {
    list: []
  },

  async onShow() {
    const disputes = storageRepo.getMyDisputes()
    const results = await Promise.all(disputes.map(d => tipRepo.getById(d.tipId)))
    const list = disputes.map((d, i) => {
      const tip = results[i]
      let identityLabel = ''
      if (d.identity) {
        const opt = IDENTITY_OPTIONS.find(o => o.value === d.identity)
        identityLabel = opt ? opt.label : d.identity
      }
      const isoDate = d.createdAt ? d.createdAt.slice(0, 10) : ''
      return {
        ...d,
        tipTitle: tip ? tip.title : '(已删除)',
        identityLabel,
        createdAt: isoDate
      }
    }).reverse()
    this.setData({ list })
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  }
})
