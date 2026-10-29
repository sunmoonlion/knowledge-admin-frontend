// 用户资料管理的状态与算法（features/user-data/model）。
import { describe, expect, it } from 'vitest'

import type { AdminVocabulary } from '@/contracts/user-data'
import {
  byVersion,
  cleanReason,
  formatBytes,
  materialQuery,
  share,
} from '@/features/user-data/model/user-data'

describe('user-data model', () => {
  it('builds the material query only when something is given', () => {
    expect(materialQuery({ owner: '', materialId: '', disabled: false })).toBeNull()
    expect(materialQuery({ owner: ' alice ', materialId: '', disabled: true })).toBe(
      'owner=alice&disabled=true',
    )
  })

  it('groups descriptions by vocabulary version, current first', () => {
    const data = {
      version: 2,
      vocabulary: { doc_types: {} },
      descriptions: [
        { vocab_version: 1, status: 'confirmed', doc_type: null, count: 3 },
        { vocab_version: 2, status: 'confirmed', doc_type: 'annual_report', count: 2 },
        { vocab_version: 2, status: 'unconfirmed', doc_type: null, count: 1 },
      ],
    } as unknown as AdminVocabulary
    expect(byVersion(data).map((g) => [g.version, g.total])).toEqual([
      [2, 3],
      [1, 3],
    ])
  })

  it('formats sizes, shares and reasons', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1024 ** 3)).toBe('1.0 GB')
    expect(share(512 * 1024 ** 2, 1024 ** 3)).toBe(50)
    expect(cleanReason(` ${'x'.repeat(100)} `)).toHaveLength(80)
  })
})
