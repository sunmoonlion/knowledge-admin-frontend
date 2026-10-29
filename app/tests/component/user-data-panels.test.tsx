// 管理端看用户资料（features/user-data）：禁用、清除写明原因、只有 admin 有按钮。
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MaterialsPanel, UsagePanel } from '@/features/user-data'
import messages from '@/messages/zh-CN.json'

const MATERIAL = {
  material_id: '1c1b81a8-433c-4e89-9917-98a0630af48e',
  owner: 'alice',
  name: '违规.pdf',
  content_origin: 'upload',
  license: 'self',
  doc_type: null,
  description_status: 'unconfirmed',
  vocab_version: 2,
  current_version: 1,
  created_at: '2026-10-29T08:00:00+00:00',
  deleted_at: null,
  disabled_at: null,
}

function json(body: unknown, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function page(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <NextIntlClientProvider locale="zh-CN" messages={messages} timeZone="Asia/Shanghai">
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </NextIntlClientProvider>,
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('user data panels', () => {
  it('lists usage per user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        json({
          quota_bytes: 1024 ** 3,
          users: [{ subject: 'alice', bytes_used: 1024 ** 2, materials: 3 }],
        }),
      ),
    )
    page(<UsagePanel />)
    expect(await screen.findByText('alice')).toBeInTheDocument()
    expect(screen.getByText('1.0 MB')).toBeInTheDocument()
  })

  it('disables with a reason and the CSRF token', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, init })
        if (url.includes('/deletions')) return json([])
        if (url.includes('/disable')) return new Response(null, { status: 204 })
        return json([MATERIAL])
      }),
    )
    vi.stubGlobal('confirm', () => true)
    page(<MaterialsPanel csrfToken={'c'.repeat(32)} canDispose />)
    fireEvent.click(await screen.findByRole('button', { name: '违规.pdf' }))
    expect(calls[0].url).toBe('/api/admin/v1/user-data/materials?disabled=true')
    const disable = await screen.findByRole('button', { name: '禁用' })
    expect(disable).toBeDisabled()
    fireEvent.change(screen.getByLabelText('原因（必填，最多 80 字）'), {
      target: { value: '违规内容' },
    })
    fireEvent.click(disable)
    await waitFor(() => expect(calls.some((c) => c.url.endsWith('/disable'))).toBe(true))
    const sent = calls.find((c) => c.url.endsWith('/disable'))
    expect(JSON.parse(String(sent?.init?.body))).toEqual({ reason: '违规内容' })
    expect((sent?.init?.headers as Record<string, string>)['X-CSRF-Token']).toBe('c'.repeat(32))
  })

  it('operators see no dispose buttons', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => (url.includes('/deletions') ? json([]) : json([MATERIAL]))),
    )
    page(<MaterialsPanel csrfToken={'c'.repeat(32)} canDispose={false} />)
    fireEvent.click(await screen.findByRole('button', { name: '违规.pdf' }))
    expect(await screen.findByText('禁用、清除只有 admin 能做。')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '禁用' })).not.toBeInTheDocument()
  })
})
