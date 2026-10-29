import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { MaterialsPanel } from '@/features/user-data'
import { requireAnyRole } from '@/lib/server/auth-session'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('userData.materials')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// 被禁用资料的处理（SDD 0044 第四节）
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await requireAnyRole(locale, ['admin', 'operator'])
  const t = await getTranslations('userData.materials')
  return (
    <div>
      <div className="admin-page-heading">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('lead')}</p>
      </div>
      <MaterialsPanel
        csrfToken={session.csrf_token}
        canDispose={session.user.roles.includes('admin')}
      />
    </div>
  )
}
