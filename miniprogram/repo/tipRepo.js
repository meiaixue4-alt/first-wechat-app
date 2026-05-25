const { CATEGORY_MAP, PAGE_SIZE, getTodayStr } = require('../config/constants')
const mockTips = require('../data/mock-tips')

/* ========== 本地缓存层（优先云 → 缓存 → Mock） ========== */

const CACHE_KEYS = {
  TODAY: 'cache_tips_today',
  TIP: (id) => 'cache_tip_' + id,
  CATEGORY: (cat, page) => 'cache_tips_cat_' + cat + '_p' + page,
  SEARCH: (kw, page) => 'cache_tips_search_' + encodeURIComponent(kw) + '_p' + page,
  ALL: (page) => 'cache_tips_all_p' + page
}

const CACHE_TTL = {
  today: 60 * 60 * 1000,       // 当日 tips 缓存 1 小时
  tip: 24 * 60 * 60 * 1000,    // 单条 tip 缓存 24 小时
  list: 30 * 60 * 1000         // 列表缓存 30 分钟
}

function cacheGet(key) {
  try {
    const raw = wx.getStorageSync(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return { data: parsed.data, time: parsed.time }
  } catch (_) { return null }
}

function cacheSet(key, data) {
  try {
    wx.setStorageSync(key, JSON.stringify({ data, time: Date.now() }))
  } catch (_) { /* 存储满则静默失败 */ }
}

function cacheDel(key) {
  try { wx.removeStorageSync(key) } catch (_) {}
}

function cacheValid(cached, ttl) {
  return cached && (Date.now() - cached.time) < ttl
}

/** 清空所有 tip 相关缓存（导入新数据后调用） */
function clearAllCache() {
  try {
    const info = wx.getStorageInfoSync()
    for (const key of info.keys) {
      if (key.startsWith('cache_tips_')) wx.removeStorageSync(key)
    }
  } catch (_) {}
}

/* ==================== 数据库 ==================== */

function getDb() {
  try {
    return wx.cloud ? wx.cloud.database() : null
  } catch (_) {
    return null
  }
}

/** 从 mock 数据获取当日 tips（降级方案） */
function getTodayTipsMock() {
  const today = getTodayStr()
  const tips = mockTips.filter(t => t.date === today)
  if (tips.length === 5) return tips

  const latestByCategory = {}
  mockTips.forEach(t => {
    if (!latestByCategory[t.category] || t.date > latestByCategory[t.category].date) {
      latestByCategory[t.category] = t
    }
  })
  return Object.values(latestByCategory)
}

/** 从 mock 按 ID 获取单条 */
function getByIdMock(id) {
  return mockTips.find(t => t.id === id)
}

/** 从 mock 按分类筛选 */
function getByCategoryMock(category, page, pageSize) {
  const size = pageSize || PAGE_SIZE
  let filtered = mockTips.filter(t => t.category === category)
  filtered.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))

  const total = filtered.length
  const start = (page - 1) * size
  return { list: filtered.slice(start, start + size), total, hasMore: start + size < total }
}

/** 从 mock 搜索 */
function searchMock(keyword, page, pageSize) {
  const size = pageSize || PAGE_SIZE
  const kw = keyword.toLowerCase()
  let filtered = mockTips.filter(t =>
    t.title.toLowerCase().includes(kw) || t.body.toLowerCase().includes(kw)
  )
  filtered.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))

  const total = filtered.length
  const start = (page - 1) * size
  return { list: filtered.slice(start, start + size), total, hasMore: start + size < total }
}

/** 从 mock 获取全部 */
function getAllMock(page, pageSize) {
  const size = pageSize || PAGE_SIZE
  const sorted = [...mockTips].sort((a, b) =>
    b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
  )
  const total = sorted.length
  const start = (page - 1) * size
  return { list: sorted.slice(start, start + size), total, hasMore: start + size < total }
}

// ==================== 对外异步接口 ====================

async function getTodayTips() {
  const db = getDb()
  if (db) {
    try {
      const today = getTodayStr()
      const res = await db.collection('tips').where({ date: today }).limit(5).get()
      let tips = null
      if (res.data && res.data.length === 5) {
        tips = res.data
      } else {
        // 当日不足5条，取每分类最新
        const categories = Object.keys(CATEGORY_MAP)
        const latest = []
        for (const cat of categories) {
          const r = await db.collection('tips')
            .where({ category: cat })
            .orderBy('date', 'desc')
            .limit(1).get()
          if (r.data && r.data.length) latest.push(r.data[0])
        }
        if (latest.length) tips = latest
      }
      if (tips) {
        cacheSet(CACHE_KEYS.TODAY, tips)
        return tips
      }
    } catch (_) {}
  }
  // 云失败 → 尝试缓存
  const cached = cacheGet(CACHE_KEYS.TODAY)
  if (cacheValid(cached, CACHE_TTL.today)) return cached.data
  // 缓存也无效 → Mock 降级
  return getTodayTipsMock()
}

async function getById(id) {
  const db = getDb()
  if (db) {
    try {
      const res = await db.collection('tips').doc(id).get()
      if (res.data) {
        cacheSet(CACHE_KEYS.TIP(id), res.data)
        return res.data
      }
    } catch (_) {}
  }
  // 尝试缓存
  const cached = cacheGet(CACHE_KEYS.TIP(id))
  if (cacheValid(cached, CACHE_TTL.tip)) return cached.data
  // Mock 降级
  return getByIdMock(id)
}

async function getByCategory(category, page, pageSize) {
  const size = pageSize || PAGE_SIZE
  const db = getDb()
  if (db) {
    try {
      const res = await db.collection('tips')
        .where({ category })
        .orderBy('date', 'desc')
        .skip((page - 1) * size)
        .limit(size)
        .get()
      const totalRes = await db.collection('tips').where({ category }).count()
      const result = { list: res.data || [], total: totalRes.total, hasMore: (page - 1) * size + (res.data || []).length < totalRes.total }
      cacheSet(CACHE_KEYS.CATEGORY(category, page), result)
      return result
    } catch (_) {}
  }
  const cached = cacheGet(CACHE_KEYS.CATEGORY(category, page))
  if (cacheValid(cached, CACHE_TTL.list)) return cached.data
  return getByCategoryMock(category, page, size)
}

async function search(keyword, page, pageSize) {
  const size = pageSize || PAGE_SIZE
  const db = getDb()
  if (db && keyword.trim()) {
    try {
      const re = db.RegExp({ regexp: keyword, options: 'i' })
      const res = await db.collection('tips')
        .where(db.command.or([{ title: re }, { body: re }]))
        .orderBy('date', 'desc')
        .skip((page - 1) * size)
        .limit(size)
        .get()
      const totalRes = await db.collection('tips')
        .where(db.command.or([{ title: re }, { body: re }]))
        .count()
      const result = { list: res.data || [], total: totalRes.total, hasMore: (page - 1) * size + (res.data || []).length < totalRes.total }
      cacheSet(CACHE_KEYS.SEARCH(keyword, page), result)
      return result
    } catch (_) {}
  }
  const cached = cacheGet(CACHE_KEYS.SEARCH(keyword, page))
  if (cacheValid(cached, CACHE_TTL.list)) return cached.data
  return searchMock(keyword, page, size)
}

async function getAll(page, pageSize) {
  const size = pageSize || PAGE_SIZE
  const db = getDb()
  if (db) {
    try {
      const res = await db.collection('tips')
        .orderBy('date', 'desc')
        .skip((page - 1) * size)
        .limit(size)
        .get()
      const totalRes = await db.collection('tips').count()
      const result = { list: res.data || [], total: totalRes.total, hasMore: (page - 1) * size + (res.data || []).length < totalRes.total }
      cacheSet(CACHE_KEYS.ALL(page), result)
      return result
    } catch (_) {}
  }
  const cached = cacheGet(CACHE_KEYS.ALL(page))
  if (cacheValid(cached, CACHE_TTL.list)) return cached.data
  return getAllMock(page, size)
}

/** 获取云数据库中所有 tip 的 id 集合（用于导入去重，仅管理端） */
async function getExistingIds() {
  const db = getDb()
  if (!db) return new Set()
  try {
    const MAX_LIMIT = 100
    const ids = new Set()
    let cursor = null

    do {
      const query = db.collection('tips').field({ id: true }).limit(MAX_LIMIT)
      const res = cursor ? await query.skip(cursor).get() : await query.get()
      for (const item of res.data) {
        if (item.id) ids.add(item.id)
      }
      cursor = res.data.length === MAX_LIMIT ? (cursor || 0) + MAX_LIMIT : null
    } while (cursor)

    return ids
  } catch (_) {
    return new Set()
  }
}

/** 清除云数据库中 id 重复的文档，每个 id 只保留最早创建的一条 */
async function removeDuplicates() {
  const db = getDb()
  if (!db) return { ok: false, error: '云开发未初始化', removed: 0 }

  try {
    const MAX_LIMIT = 100
    let allTips = []
    let cursor = null

    do {
      const query = db.collection('tips').field({ id: true, _id: true, createdAt: true }).limit(MAX_LIMIT)
      const res = cursor ? await query.skip(cursor).get() : await query.get()
      allTips = allTips.concat(res.data)
      cursor = res.data.length === MAX_LIMIT ? (cursor || 0) + MAX_LIMIT : null
    } while (cursor)

    const groups = {}
    for (const t of allTips) {
      if (!t.id) continue
      if (!groups[t.id]) groups[t.id] = []
      groups[t.id].push(t)
    }

    let removed = 0
    for (const [id, docs] of Object.entries(groups)) {
      if (docs.length <= 1) continue
      docs.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
      for (let i = 1; i < docs.length; i++) {
        try {
          await db.collection('tips').doc(docs[i]._id).remove()
          removed++
        } catch (_) {}
      }
    }

    return { ok: true, removed }
  } catch (e) {
    return { ok: false, error: e.message, removed: 0 }
  }
}

/** 新增 tip 到云数据库（仅管理端使用，无降级） */
async function addTip(tip) {
  const db = getDb()
  if (!db) return { ok: false, error: '云开发未初始化' }
  try {
    await db.collection('tips').add({ data: tip })
    clearAllCache()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

/** 更新 tip（仅管理端） */
async function updateTip(id, data) {
  const db = getDb()
  if (!db) return { ok: false, error: '云开发未初始化' }
  try {
    await db.collection('tips').doc(id).update({ data })
    clearAllCache()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

module.exports = {
  getTodayTips,
  getById,
  getByCategory,
  search,
  getAll,
  addTip,
  updateTip,
  getExistingIds,
  removeDuplicates,
  clearAllCache
}
