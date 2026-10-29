// 用户资料管理的状态与算法：不取数、不渲染。
import type { AdminVocabulary } from '@/contracts/user-data'

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`
}

export function share(used: number, quota: number) {
  return quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0
}

// 找资料的条件变成查询串；什么都没填就是 null（不去取）
export function materialQuery(form: { owner: string; materialId: string; disabled: boolean }) {
  const query = new URLSearchParams()
  if (form.owner.trim()) query.set('owner', form.owner.trim())
  if (form.materialId.trim()) query.set('material_id', form.materialId.trim())
  if (form.disabled) query.set('disabled', 'true')
  const text = query.toString()
  return text ? text : null
}

// 描述的分布：按词表版本分，当前版本的在前；旧版本的不参与解析，要用户重新确认
export function byVersion(data: AdminVocabulary) {
  const groups = new Map<
    string,
    { version: number | null; total: number; rows: AdminVocabulary['descriptions'] }
  >()
  for (const row of data.descriptions) {
    const key = String(row.vocab_version)
    const group = groups.get(key) ?? { version: row.vocab_version, total: 0, rows: [] }
    group.total += row.count
    group.rows.push(row)
    groups.set(key, group)
  }
  return [...groups.values()].sort((a, b) => (b.version ?? -1) - (a.version ?? -1))
}

export function typeName(data: AdminVocabulary, docType: string | null) {
  return docType ? (data.vocabulary.doc_types[docType]?.name ?? docType) : null
}

// 理由：后端最多收 80 个字
export function cleanReason(raw: string) {
  return raw.trim().slice(0, 80)
}

export const paths = {
  usage: '/user-data/usage',
  vocabulary: '/user-data/vocabulary',
  materials: '/user-data/materials',
}
