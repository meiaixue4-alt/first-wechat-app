const { CATEGORIES, CATEGORY_MAP, PAGE_SIZE } = require('../../config/constants')
const tipRepo = require('../../repo/tipRepo')

Page({
  data: {
    categories: CATEGORIES,
    categoryMap: CATEGORY_MAP,
    activeCategory: '',
    keyword: '',
    list: [],
    page: 1,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true, page: 1 })

    let result
    const kw = this.data.keyword.trim()

    if (kw) {
      result = await tipRepo.search(kw, 1, PAGE_SIZE)
    } else if (this.data.activeCategory) {
      result = await tipRepo.getByCategory(this.data.activeCategory, 1, PAGE_SIZE)
    } else {
      result = await tipRepo.getAll(1, PAGE_SIZE)
    }

    this.setData({
      list: result.list,
      hasMore: result.hasMore,
      loading: false
    })
  },

  async loadMore() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })
    const page = this.data.page + 1
    const kw = this.data.keyword.trim()

    let result
    if (kw) {
      result = await tipRepo.search(kw, page, PAGE_SIZE)
    } else if (this.data.activeCategory) {
      result = await tipRepo.getByCategory(this.data.activeCategory, page, PAGE_SIZE)
    } else {
      result = await tipRepo.getAll(page, PAGE_SIZE)
    }

    this.setData({
      list: [...this.data.list, ...result.list],
      page,
      hasMore: result.hasMore,
      loading: false
    })
  },

  onReachBottom() {
    this.loadMore()
  },

  onCategoryTap(e) {
    const key = e.currentTarget.dataset.key
    const newCat = key === this.data.activeCategory ? '' : key
    this.setData({ activeCategory: newCat, keyword: '' }, () => {
      this.loadData()
    })
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearchConfirm() {
    if (this.data.keyword.trim()) {
      this.setData({ activeCategory: '' }, () => {
        this.loadData()
      })
    }
  },

  onClearSearch() {
    this.setData({ keyword: '' }, () => {
      this.loadData()
    })
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  }
})
