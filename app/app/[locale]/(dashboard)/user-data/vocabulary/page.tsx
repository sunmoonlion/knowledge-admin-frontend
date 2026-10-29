import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { VocabularyPanel } from '@/features/user-data'
import { requireAnyRole } from '@/lib/server/auth-session'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('userData.vocabulary')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// 词表维护（SDD 0044 第四节、0049 第二节）
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  await requireAnyRole(locale, ['admin', 'operator'])
  const t = await getTranslations('userData.vocabulary')
  return (
    <div>
      <div className="admin-page-heading">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('lead')}</p>
      </div>
      <VocabularyPanel />
    </div>
  )
}
