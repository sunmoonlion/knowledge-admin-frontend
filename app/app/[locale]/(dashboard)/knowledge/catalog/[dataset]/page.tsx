import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { DatasetPanel } from '@/features/catalog'
import { requireAnyRole } from '@/lib/server/auth-session'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('catalog.dataset')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// 一个数据集的结构。只给 knowledge 管理员。
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; dataset: string }>
}) {
  const { locale, dataset } = await params
  await requireAnyRole(locale, ['admin'])
  const t = await getTranslations('catalog.dataset')
  return (
    <div>
      <div className="admin-page-heading">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
      </div>
      <DatasetPanel dataset={decodeURIComponent(dataset)} />
    </div>
  )
}
