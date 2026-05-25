/** 云开发环境 ID（在微信开发者工具中开通云开发后替换此值） */
const CLOUD_ENV_ID = 'cloudbase-d5ggzcdgyda4dbd8f'

/** 五大分类配置 */
const CATEGORIES = [
  { key: 'material',    id: '01', name: '材质安全' },
  { key: 'food',        id: '02', name: '食品真相' },
  { key: 'skincare',    id: '03', name: '护肤真言' },
  { key: 'agri-industry', id: '04', name: '农产加工' },
  { key: 'health',      id: '05', name: '健康辟谣' }
]

/** 分类 key → 编号+名称 的映射 */
const CATEGORY_MAP = {}
CATEGORIES.forEach(c => {
  CATEGORY_MAP[c.key] = { id: c.id, name: c.name }
})

/** 身份选项（质疑弹窗用） */
const IDENTITY_OPTIONS = [
  { value: 'student',      label: '相关专业学生' },
  { value: 'practitioner', label: '行业从业者' },
  { value: 'researcher',   label: '学术研究者' },
  { value: 'layperson',    label: '只是懂这个的普通人' }
]

/** 分页大小 */
const PAGE_SIZE = 20

/** 今日日期字符串 */
function getTodayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

module.exports = {
  CLOUD_ENV_ID,
  CATEGORIES,
  CATEGORY_MAP,
  IDENTITY_OPTIONS,
  PAGE_SIZE,
  getTodayStr
}
