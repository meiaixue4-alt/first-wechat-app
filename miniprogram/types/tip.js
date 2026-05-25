/**
 * Tip 数据结构（JSDoc 类型定义）
 *
 * @typedef {Object} Tip
 * @property {string} id
 * @property {'material'|'food'|'skincare'|'agri-industry'|'health'} category
 * @property {string} date - "YYYY-MM-DD"
 * @property {string} title - 一句话结论（≤15字）
 * @property {string} summary - 卡片上的2-3句简短解释
 * @property {string} body - 详情页完整正文
 * @property {string} image - 配图路径
 * @property {string[]} references - 参考文献列表
 * @property {number} usefulCount
 * @property {string} createdAt - ISO datetime
 */

/**
 * UserFeedback 数据结构
 *
 * @typedef {Object} UserFeedback
 * @property {string} id
 * @property {string} tipId
 * @property {string} userId
 * @property {'useful'|'not-interested'|'dispute'} type
 * @property {string} [disputeReason]
 * @property {string} [disputeAttachment]
 * @property {'student'|'practitioner'|'researcher'|'layperson'|null} [identity]
 * @property {string} createdAt
 */

/**
 * UserFavorite 数据结构
 *
 * @typedef {Object} UserFavorite
 * @property {string} userId
 * @property {string} tipId
 * @property {string} createdAt
 */

module.exports = {}
