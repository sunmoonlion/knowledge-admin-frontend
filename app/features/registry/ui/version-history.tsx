'use client'

import { useFormatter, useTranslations } from 'next-intl'

import { useVersions } from '../api/registry'
import { bytes, isCurrent, locationOf } from '../model/registry'

// 一个数据集的各个版本：哪个是现行的，哪些被取代了、什么时候。
export function VersionHistory({ dataset, title }: { dataset: string; title: string }) {
  const t = useTranslations('registry')
  const format = useFormatter()
  const versions = useVersions(dataset)
  const when = (at: string) =>
    format.dateTime(new Date(at), { dateStyle: 'medium', timeStyle: 'short' })
  const heading = t('historyOf', { title })

  return (
    <section className="reference-card" aria-label={heading}>
      <h2 className="text-lg font-semibold">{heading}</h2>
      <p className="text-muted-foreground font-mono text-xs">{dataset}</p>
      {versions.isPending ? <p className="crud-state">{t('loading')}</p> : null}
      {versions.isError ? (
        <p role="alert" className="crud-error">
          {t('failed')}
        </p>
      ) : null}
      {versions.data ? (
        <div className="crud-table-wrap">
          <table className="crud-table">
            <caption className="sr-only">{heading}</caption>
            <thead>
              <tr>
                <th>{t('version')}</th>
                <th>{t('status')}</th>
                <th>{t('registeredAt')}</th>
                <th>{t('period')}</th>
                <th>{t('file')}</th>
                <th>{t('local')}</th>
              </tr>
            </thead>
            <tbody>
              {versions.data.versions.map((version) => (
                <tr key={version.data_version}>
                  <td className="font-mono text-xs">{version.data_version}</td>
                  <td>
                    {isCurrent(version) ? (
                      <strong>{t('current')}</strong>
                    ) : (
                      <>
                        {t('superseded')}
                        {version.superseded_at ? (
                          <span className="text-muted-foreground block text-xs">
                            {when(version.superseded_at)}
                          </span>
                        ) : null}
                      </>
                    )}
                  </td>
                  <td>
                    {when(version.registered_at)}
                    <span className="text-muted-foreground block text-xs">
                      {version.registered_by}
                    </span>
                  </td>
                  <td>{t('periodValue', { from: version.start_date, to: version.end_date })}</td>
                  <td>
                    {bytes(version.size_bytes)}
                    <span className="text-muted-foreground block font-mono text-xs break-all">
                      {version.sha256}
                    </span>
                    <span className="text-muted-foreground block font-mono text-xs break-all">
                      {locationOf(version)}
                    </span>
                  </td>
                  <td>{version.fetched ? t('fetched') : t('notFetched')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
