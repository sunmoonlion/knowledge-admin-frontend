import { describe, expect, it } from 'vitest'
import { filterNavigationByRoles, findNavigationItem } from '@/lib/navigation'

describe('admin navigation', () => {
  it('uses the same metadata for role filtering and locale-aware route matching', () => {
    expect(filterNavigationByRoles([]).map((item) => item.key)).toEqual(['dashboard', 'settings'])
    expect(filterNavigationByRoles(['operator']).map((item) => item.key)).toContain('reference')
    expect(filterNavigationByRoles(['operator']).map((item) => item.key)).not.toContain(
      'rich-reference',
    )
    expect(filterNavigationByRoles(['admin']).map((item) => item.key)).toContain('rich-reference')
    expect(findNavigationItem('/zh-CN/reference/details')?.key).toBe('reference')
    // 旧 SQLite 数据集的数据目录与登记两页已删（decisions ⑰）
    expect(filterNavigationByRoles(['admin']).map((item) => item.key)).not.toContain(
      'knowledge-catalog',
    )
    expect(filterNavigationByRoles(['admin']).map((item) => item.key)).not.toContain(
      'knowbase-datasets',
    )
    expect(findNavigationItem('/zh-CN/knowledge/catalog')).toBeUndefined()
    expect(findNavigationItem('/zh-CN/knowledge/datasets')).toBeUndefined()
  })
})
