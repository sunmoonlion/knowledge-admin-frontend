import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CatalogPanel, DatasetPanel } from '@/features/catalog'
import messages from '@/messages/zh-CN.json'

const push = vi.fn()
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={`/zh-CN${href}`} {...rest}>
      {children}
    </a>
  ),
  useRouter: () => ({ push }),
  usePathname: () => '/knowledge/catalog',
}))

// 样例：knowledge 后端的测试把管理接口的真实返回录下来的（情景 catalog、catalog-default-only）
const fixtures = join(process.cwd(), 'preview/fixtures')
let scenario = 'catalog'
let asked: string[] = []
function manifestOf(name: string) {
  return JSON.parse(readFileSync(join(fixtures, name, 'manifest.json'), 'utf8')) as {
    responses: { method: string; path: string; query: string; status: number; file: string }[]
  }
}

beforeEach(() => {
  scenario = 'catalog'
  asked = []
  push.mockReset()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init: RequestInit = {}) => {
      const url = new URL(String(input), 'http://x')
      expect(init.method ?? 'GET').toBe('GET') // 数据目录只有读
      asked.push(`${url.pathname}${url.search}`)
      const query = decodeURIComponent(url.search.slice(1))
      const found = manifestOf(scenario).responses.find(
        (each) => each.path === url.pathname && each.query === query,
      )
      if (!found) {
        return new Response(JSON.stringify({ detail: 'no sample' }), { status: 500 })
      }
      return new Response(readFileSync(join(fixtures, scenario, found.file), 'utf8'), {
        status: found.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

function page(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <NextIntlClientProvider locale="zh-CN" messages={messages} timeZone="Asia/Shanghai">
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </NextIntlClientProvider>,
  )
}

describe('数据目录（管理端）', () => {
  it('每个数据集一行：代码、名字、现行版本、时间范围、更新时间（F-KNOW-08）', async () => {
    page(<CatalogPanel query="" />)
    const table = await screen.findByRole('table', { name: '数据目录' })
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(3)
    expect(screen.getByText('一共 3 个数据集')).toBeInTheDocument()
    const airport = within(rows[1])
    expect(airport.getByText('600009')).toBeInTheDocument()
    expect(airport.getByRole('link', { name: '上海机场 财务报表' })).toHaveAttribute(
      'href',
      '/zh-CN/knowledge/catalog/sh600009-financials',
    )
    expect(airport.getByText('1994-12-31 至 2026-06-30')).toBeInTheDocument()
    expect(airport.getByText('sh600009-financials-9fd91db79529e208')).toBeInTheDocument()
    expect(airport.getByText('2026年9月27日')).toBeInTheDocument()
    // 默认数据集：标出来，没有更新时间
    expect(within(rows[0]).getByText('默认')).toBeInTheDocument()
    expect(within(rows[0]).getByText('随服务自带')).toBeInTheDocument()
    expect(asked).toEqual(['/api/admin/v1/knowledge/catalog/datasets'])
  })

  it('搜：把词放进地址；「看全部」回到整份', async () => {
    page(<CatalogPanel query="600009" />)
    const table = await screen.findByRole('table', { name: '数据目录' })
    expect(within(table).getAllByRole('row').slice(1)).toHaveLength(1)
    expect(screen.getByText('找到 1 个（一共 3 个）')).toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toHaveValue('600009')
    expect(asked).toEqual(['/api/admin/v1/knowledge/catalog/datasets?q=600009'])
    fireEvent.change(screen.getByRole('searchbox', { name: '按证券代码或名字找' }), {
      target: { value: ' 机场 ' },
    })
    fireEvent.click(screen.getByRole('button', { name: '找' }))
    expect(push).toHaveBeenCalledWith('/knowledge/catalog?q=%E6%9C%BA%E5%9C%BA')
    fireEvent.click(screen.getByRole('button', { name: '看全部' }))
    expect(push).toHaveBeenCalledWith('/knowledge/catalog')
  })

  it('没有这家公司：说没有，指去 info 管理端发起采集；不给用户侧的申请入口（账 56）', async () => {
    page(<CatalogPanel query="000001" />)
    expect(await screen.findByText('没有「000001」的数据')).toBeInTheDocument()
    expect(screen.getByText(/去 info 管理端的「证券采集」发起/)).toBeInTheDocument()
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.queryByText('申请入库')).toBeNull()
  })

  it('多数据集没打开：只有默认数据集，页面不报错，说明原因（AT-KNOW-08）', async () => {
    scenario = 'catalog-default-only'
    page(<CatalogPanel query="" />)
    const table = await screen.findByRole('table', { name: '数据目录' })
    expect(within(table).getAllByRole('row').slice(1)).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent(
      '这里还没有打开公司数据的登记，现在只有默认数据集。',
    )
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('后端答不上来：说打不开，不装作没有数据', async () => {
    page(<CatalogPanel query="没录过的词" />)
    expect(await screen.findByRole('alert')).toHaveTextContent('数据目录暂时打不开，稍后再试。')
    expect(screen.queryByText(/没有「/)).toBeNull()
  })
})

describe('一个数据集（管理端）', () => {
  it('摘要、表与列、口径、局限都有；只有结构（F-KNOW-09、AT-KNOW-04）', async () => {
    page(<DatasetPanel dataset="sh600009-financials" />)
    expect(await screen.findByRole('heading', { name: '上海机场 财务报表' })).toBeInTheDocument()
    expect(screen.getByText('5 张表 · 10 个口径 · 7 条局限')).toBeInTheDocument()
    const summary = screen.getByRole('region', { name: '摘要' })
    expect(within(summary).getByText('1994-12-31 至 2026-06-30')).toBeInTheDocument()
    expect(within(summary).getByText('sh600009-financials-9fd91db79529e208')).toBeInTheDocument()
    expect(within(summary).getByText('报表数据的来源')).toBeInTheDocument()

    const tables = screen.getByRole('region', { name: '表' })
    expect(within(tables).getByText('balance_sheet')).toBeInTheDocument()
    expect(within(tables).getByText('110 行 · 35 列')).toBeInTheDocument()
    expect(within(tables).getByText('total_assets')).toBeInTheDocument()
    expect(within(tables).getByText('资产总计')).toBeInTheDocument()
    // 说明用的表不混在装数据的表里
    expect(within(tables).queryByText('field_dictionary')).toBeNull()
    expect(
      within(screen.getByRole('region', { name: '说明用的表' })).getByText('field_dictionary'),
    ).toBeInTheDocument()

    const metrics = screen.getByRole('list', { name: '口径' })
    expect(within(metrics).getAllByRole('listitem')).toHaveLength(10)
    expect(within(metrics).getByText('毛利率')).toBeInTheDocument()
    expect(
      within(metrics).getByText('(operate_income - operate_cost) / operate_income'),
    ).toBeInTheDocument()

    const limits = screen.getByRole('list', { name: '局限' })
    expect(within(limits).getAllByRole('listitem')).toHaveLength(7)
    expect(within(limits).getByText('追溯调整')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← 数据目录' })).toHaveAttribute(
      'href',
      '/zh-CN/knowledge/catalog',
    )
    // 用户侧的「申请更新」不在这里
    expect(screen.queryByText('申请更新')).toBeNull()
  })

  it('默认数据集：没有公司；没写局限就说没写；列没有中文名就不画那一栏', async () => {
    page(<DatasetPanel dataset="retail" />)
    expect(
      await screen.findByRole('heading', { name: '零售经营库（最小实例）' }),
    ).toBeInTheDocument()
    expect(screen.getByText('随服务自带，不经登记')).toBeInTheDocument()
    expect(screen.getByText('这个数据集没有写明局限。')).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: '中文名' })).toBeNull()
  })

  it('没有这个数据集：说没有，给回目录的路', async () => {
    page(<DatasetPanel dataset="sh000001-financials" />)
    expect(await screen.findByRole('alert')).toHaveTextContent('没有这个数据集')
    expect(screen.getByRole('link', { name: '← 数据目录' })).toBeInTheDocument()
  })

  it('后端答不上来：说打不开，不说成「没有这个数据集」', async () => {
    page(<DatasetPanel dataset="no-sample-for-this" />)
    expect(await screen.findByRole('alert')).toHaveTextContent('这个数据集暂时打不开，稍后再试。')
  })
})
