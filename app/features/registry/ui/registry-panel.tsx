'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { useState } from 'react'

import { useRegistry } from '../api/registry'
import { bytes, locationOf, shortHash } from '../model/registry'
import { VersionHistory } from './version-history'

// 数据集登记：每个数据集的现行版本、文件、存放位置、取回来没有；点开看版本历史。
// 只读。登记由 info 发起，回退由 info 的「重新登记」做。
export function RegistryPanel() {
  const t = useTranslations('registry')
  const format = useFormatter()
  const [open, setOpen] = useState<string | null>(null)
  const registry = useRegistry()
  const when = (at: string) =>
    format.dateTime(new Date(at), { dateStyle: 'medium', timeStyle: 'short' })
  const opened = registry.data?.datasets.find((each) => each.dataset_id === open)

  return (
    <div className="space-y-6">
      <section className="reference-card" aria-label={t('title')}>
        <p className="reference-notice">{t('readOnly')}</p>
        {registry.isPending ? <p className="crud-state">{t('loading')}</p> : null}
        {registry.isError ? (
          <p role="alert" className="crud-error">
            {t('failed')}
          </p>
        ) : null}
        {registry.data && !registry.data.enabled ? (
          <p role="status" className="crud-state">
            {t('off')}
          </p>
        ) : null}
        {registry.data?.enabled ? (
          <div className="crud-table-wrap">
            <table className="crud-table">
              <caption className="sr-only">{t('title')}</caption>
              <thead>
                <tr>
                  <th>{t('dataset')}</th>
                  <th>{t('currentVersion')}</th>
                  <th>{t('registeredAt')}</th>
                  <th>{t('file')}</th>
                  <th>{t('local')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {registry.data.datasets.map((each) => (
                  <tr key={each.dataset_id}>
                    <td>
                      {each.title}
                      <span className="text-muted-foreground block font-mono text-xs">
                        {each.security_code ? `${each.security_code} · ` : ''}
                        {each.dataset_id}
                      </span>
                    </td>
                    {each.current ? (
                      <>
                        <td>
                          <span className="font-mono text-xs">{each.current.data_version}</span>
                          <span className="text-muted-foreground block text-xs">
                            {t('periodValue', {
                              from: each.current.start_date,
                              to: each.current.end_date,
                            })}
                          </span>
                        </td>
                        <td>
                          {when(each.current.registered_at)}
                          <span className="text-muted-foreground block text-xs">
                            {each.current.registered_by}
                          </span>
                        </td>
                        <td>
                          {bytes(each.current.size_bytes)}
                          <span
                            className="text-muted-foreground block font-mono text-xs"
                            title={each.current.sha256}
                          >
                            {t('hash', { hash: shortHash(each.current.sha256) })}
                          </span>
                          <span className="text-muted-foreground block font-mono text-xs break-all">
                            {locationOf(each.current)}
                          </span>
                        </td>
                        <td>{each.current.fetched ? t('fetched') : t('notFetched')}</td>
                      </>
                    ) : (
                      <td colSpan={4}>{t('noCurrent')}</td>
                    )}
                    <td>
                      <button
                        type="button"
                        className="secondary-button"
                        aria-expanded={open === each.dataset_id}
                        onClick={() => setOpen(open === each.dataset_id ? null : each.dataset_id)}
                      >
                        {t('history', { count: each.version_count })}
                      </button>
                    </td>
                  </tr>
                ))}
                {registry.data.datasets.length === 0 ? (
                  <tr>
                    <td colSpan={6}>{t('none')}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
      {opened ? <VersionHistory dataset={opened.dataset_id} title={opened.title} /> : null}
    </div>
  )
}
