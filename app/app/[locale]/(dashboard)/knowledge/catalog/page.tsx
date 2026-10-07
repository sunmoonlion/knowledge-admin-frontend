import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { CatalogPanel } from '@/features/catalog'
import { requireAnyRole } from '@/lib/server/auth-session'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('catalog.list')
  return { title: t('title'), robots: { index: false, follow: false } }
}

const one = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) || ''

// 数据目录：我们看公共库里有什么（账 56，PRD/apps/knowledge.md 六之二）。只给 knowledge 管理员。
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  await requireAnyRole(locale, ['admin'])
  const t = await getTranslations('catalog.list')
  return (
    <div>
      <div className="admin-page-heading">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('lead')}</p>
      </div>
      <CatalogPanel query={one(query.q)} />
    </div>
  )
}
