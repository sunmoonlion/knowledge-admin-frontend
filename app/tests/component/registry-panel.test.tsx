import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RegistryPanel } from '@/features/registry'
import messages from '@/messages/zh-CN.json'

// 样例：knowledge 后端的测试把管理接口的真实返回录下来的
const fixtures = join(process.cwd(), 'preview/fixtures')
let scenario = 'full'
let broken = false
let asked: string[] = []
function sample(path: string) {
  const dir = join(fixtures, scenario)
  const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as {
    responses: { path: string; status: number; file: string }[]
  }
  const found = manifest.responses.find((each) => each.path === path)
  return found ? { status: found.status, text: readFileSync(join(dir, found.file), 'utf8') } : null
}

beforeEach(() => {
  scenario = 'full'
  broken = false
  asked = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init: RequestInit = {}) => {
      expect(init.method ?? 'GET').toBe('GET') // 登记表只有读
      asked.push(String(input))
      const found = broken ? null : sample(String(input))
      return new Response(found?.text ?? JSON.stringify({ detail: 'unavailable' }), {
        status: found?.status ?? 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

function page() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <NextIntlClientProvider locale="zh-CN" messages={messages} timeZone="Asia/Shanghai">
      <QueryClientProvider client={client}>
        <RegistryPanel />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  )
}

describe('数据集登记', () => {
  it('每个数据集一行：现行版本、登记时间、大小与校验值、存放位置、取回来没有', async () => {
    page()
    const table = await screen.findByRole('table', { name: '数据集登记' })
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(2)
    const airport = within(rows[0])
    expect(airport.getByText('上海机场 财务报表')).toBeInTheDocument()
    expect(airport.getByText('600009 · sh600009-financials')).toBeInTheDocument()
    expect(airport.getByText('sh600009-financials-9fd91db79529e208')).toBeInTheDocument()
    expect(airport.getByText('1994-12-31 至 2026-06-30')).toBeInTheDocument()
    expect(airport.getByText('2026年9月30日 10:30')).toBeInTheDocument()
    expect(airport.getByText('service:info-backend')).toBeInTheDocument()
    expect(airport.getByText('148.0 KB')).toBeInTheDocument()
    expect(airport.getByText(/^校验值 [0-9a-f]{12}…$/)).toBeInTheDocument()
    expect(
      airport.getByText(
        's3://development-info-originals/info/securities/code=600009/datasets/sh600009-financials-9fd91db79529e208/sh600009-financials.sqlite',
      ),
    ).toBeInTheDocument()
    expect(airport.getByText('已取回，校验过')).toBeInTheDocument()
    expect(within(rows[1]).getByText('还没取回（第一次查到它时取）')).toBeInTheDocument()
    // 只读：除了「版本历史」没有别的按钮
    expect(screen.getAllByRole('button').map((each) => each.textContent)).toEqual([
      '版本历史（2）',
      '版本历史（1）',
    ])
  })

  it('点开版本历史：现行的在前，被取代的写明什么时候（F-KNOW-12）', async () => {
    page()
    fireEvent.click(await screen.findByRole('button', { name: '版本历史（2）' }))
    const history = await screen.findByRole('table', { name: '上海机场 财务报表的版本' })
    const rows = within(history).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(2)
    expect(within(rows[0]).getByText('现行')).toBeInTheDocument()
    expect(within(rows[0]).getByText('sh600009-financials-9fd91db79529e208')).toBeInTheDocument()
    expect(within(rows[1]).getByText('被取代')).toBeInTheDocument()
    expect(within(rows[1]).getByText('sh600009-financials-39a395bfa6f16b67')).toBeInTheDocument()
    expect(within(rows[1]).getByText('2026年9月27日 10:30')).toBeInTheDocument()
    expect(within(rows[1]).getByText('还没取回（第一次查到它时取）')).toBeInTheDocument()
    expect(asked).toEqual([
      '/api/admin/v1/knowledge/datasets',
      '/api/admin/v1/knowledge/datasets/sh600009-financials/versions',
    ])
    // 再点一下收起来
    fireEvent.click(screen.getByRole('button', { name: '版本历史（2）' }))
    expect(screen.queryByRole('table', { name: '上海机场 财务报表的版本' })).toBeNull()
  })

  it('多数据集没打开：说明原因，不画一张空表', async () => {
    scenario = 'off'
    page()
    expect(await screen.findByRole('status')).toHaveTextContent('多数据集没有打开')
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('取不到：说没有取到，不装作登记表是空的', async () => {
    broken = true
    page()
    expect(await screen.findByRole('alert')).toHaveTextContent('没有取到，请稍后再试。')
    expect(screen.queryByText('还没有数据集登记进来。')).toBeNull()
  })
})
