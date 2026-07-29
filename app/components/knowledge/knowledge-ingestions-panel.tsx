'use client'

import { useTranslations } from 'next-intl'

export function KnowledgeIngestionsPanel() {
  const t = useTranslations('KnowledgeIngestions')
  return (
    <section className="mt-6 space-y-3 rounded-lg border border-border p-4">
      <h2 className="text-lg font-medium">{t('title')}</h2>
      <p className="text-sm text-muted-foreground">{t('description')}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Admin API: GET/POST /api/knowledge/ingestions*</li>
        <li>RAGFlow check: GET /api/knowledge/ragflow/config-check</li>
        <li>Internal ingest: POST /api/internal/v1/knowledge/ingestions</li>
        <li>Internal retrieval: POST /api/internal/v1/knowledge/retrievals</li>
      </ul>
    </section>
  )
}
