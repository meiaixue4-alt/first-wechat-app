/** Storage key 常量 */
const KEYS = {
  FAVORITES: 'kepu_favorites',
  HISTORY: 'kepu_history',
  FEEDBACK: 'kepu_feedback',
  DISPUTES: 'kepu_disputes'
}

/** 生成简易唯一 ID */
function genId() {
  return 'f_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)
}

/* ========== 收藏 ========== */

function getFavorites() {
  try {
    return wx.getStorageSync(KEYS.FAVORITES) || []
  } catch (e) {
    return []
  }
}

function addFavorite(tipId) {
  const list = getFavorites()
  if (!list.find(f => f.tipId === tipId)) {
    list.unshift({ tipId, createdAt: new Date().toISOString() })
    wx.setStorageSync(KEYS.FAVORITES, list)
  }
}

function removeFavorite(tipId) {
  const list = getFavorites().filter(f => f.tipId !== tipId)
  wx.setStorageSync(KEYS.FAVORITES, list)
}

function isFavorite(tipId) {
  return getFavorites().some(f => f.tipId === tipId)
}

/* ========== 反馈状态查询 ========== */

function hasUserFeedback(tipId, type) {
  return getFeedback().some(f => f.tipId === tipId && f.type === type)
}

function getFavoriteCount() {
  return getFavorites().length
}

/* ========== 浏览历史 ========== */

function getHistory() {
  try {
    return wx.getStorageSync(KEYS.HISTORY) || []
  } catch (e) {
    return []
  }
}

function addHistory(tipId) {
  const list = getHistory().filter(h => h.tipId !== tipId)
  list.unshift({ tipId, createdAt: new Date().toISOString() })
  // 最多保留 100 条
  if (list.length > 100) list.pop()
  wx.setStorageSync(KEYS.HISTORY, list)
}

/* ========== 反馈（有用/不感兴趣/质疑） ========== */

function getFeedback() {
  try {
    return wx.getStorageSync(KEYS.FEEDBACK) || []
  } catch (e) {
    return []
  }
}

function addFeedback(feedback) {
  const record = {
    id: genId(),
    ...feedback,
    createdAt: new Date().toISOString()
  }
  const list = getFeedback()
  // 同一用户对同一 tip 的同类型反馈不重复记录
  const exists = list.find(f => f.tipId === record.tipId && f.type === record.type && f.userId === record.userId)
  if (!exists) {
    list.unshift(record)
    wx.setStorageSync(KEYS.FEEDBACK, list)
  }
  return record
}

function getMyDisputes() {
  return getFeedback().filter(f => f.type === 'dispute')
}

function getDisputeCount() {
  return getMyDisputes().length
}

module.exports = {
  KEYS,
  genId,
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
  getFavoriteCount,
  getHistory,
  addHistory,
  getFeedback,
  addFeedback,
  getMyDisputes,
  getDisputeCount,
  hasUserFeedback
}
