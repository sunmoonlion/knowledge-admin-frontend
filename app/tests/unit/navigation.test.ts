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
    // 数据集登记只给 knowledge 管理员
    expect(filterNavigationByRoles(['admin']).map((item) => item.key)).toContain(
      'knowledge-datasets',
    )
    expect(filterNavigationByRoles(['operator']).map((item) => item.key)).not.toContain(
      'knowledge-datasets',
    )
    expect(findNavigationItem('/zh-CN/knowledge/datasets')?.key).toBe('knowledge-datasets')
    // 数据目录也只给 knowledge 管理员（账 56）；数据集页算在目录这一项下
    expect(filterNavigationByRoles(['admin']).map((item) => item.key)).toContain(
      'knowledge-catalog',
    )
    expect(filterNavigationByRoles(['operator']).map((item) => item.key)).not.toContain(
      'knowledge-catalog',
    )
    expect(findNavigationItem('/zh-CN/knowledge/catalog')?.key).toBe('knowledge-catalog')
    expect(findNavigationItem('/zh-CN/knowledge/catalog/sh600009-financials')?.key).toBe(
      'knowledge-catalog',
    )
  })
})
