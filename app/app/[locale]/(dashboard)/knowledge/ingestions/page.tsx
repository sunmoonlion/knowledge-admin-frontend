import type { Metadata } from 'next'

import { KnowledgeIngestionsPanel } from '@/components/knowledge/knowledge-ingestions-panel'
import { requireAnyRole } from '@/lib/server/auth-session'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Knowledge ingestions',
  robots: { index: false, follow: false },
}

export default async function KnowledgeIngestionsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireAnyRole(locale, ['admin', 'operator'])
  return (
    <div>
      <div className="admin-page-heading">
        <h1 className="text-2xl font-semibold">Knowledge ingestions</h1>
        <p className="text-muted-foreground">
          Minimal Dataset/Ingestion control surface. Common Admin shell comes from the
          frozen Next Admin template; full Vue domain UI remains archived under
          docs/p0-009c-domain-keep.
        </p>
      </div>
      <KnowledgeIngestionsPanel />
    </div>
  )
}
