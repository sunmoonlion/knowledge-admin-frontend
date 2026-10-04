// 登记表的算法：不取数、不渲染。
import type { DatasetVersion } from '@/contracts/dataset-registry'

export function bytes(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

// 校验值太长：表格里只显示前 12 位，完整的放在悬停提示里
export function shortHash(sha256: string) {
  return sha256.slice(0, 12)
}

// 存放位置的写法，和 info 登记时给的一样
export function locationOf(version: Pick<DatasetVersion, 'bucket' | 'object_key'>) {
  return `s3://${version.bucket}/${version.object_key}`
}

export function isCurrent(version: Pick<DatasetVersion, 'status'>) {
  return version.status === 'active'
}
