'use client'

import { useTranslations } from 'next-intl'

import { useUsage } from '../api/user-data'
import { formatBytes, share } from '../model/user-data'

// 用户资料的用量（0044 第四节）：各用户占了多少空间（每人 1 GB），多的在前。
export function UsagePanel() {
  const t = useTranslations('userData.usage')
  const usage = useUsage()
  return (
    <section className="reference-card" aria-label={t('title')}>
      {usage.isPending ? <p className="crud-state">{t('loading')}</p> : null}
      {usage.isError ? (
        <p role="alert" className="crud-error">
          {t('failed')}
        </p>
      ) : null}
      {usage.data ? (
        usage.data.users.length === 0 ? (
          <p className="crud-empty">{t('empty')}</p>
        ) : (
          <div className="crud-table-wrap">
            <table className="crud-table">
              <caption className="sr-only">{t('title')}</caption>
              <thead>
                <tr>
                  <th>{t('subject')}</th>
                  <th>{t('materials')}</th>
                  <th>{t('used')}</th>
                  <th>{t('share', { quota: formatBytes(usage.data.quota_bytes) })}</th>
                </tr>
              </thead>
              <tbody>
                {usage.data.users.map((row) => (
                  <tr key={row.subject}>
                    <td className="font-mono">{row.subject}</td>
                    <td>{row.materials}</td>
                    <td>{formatBytes(row.bytes_used)}</td>
                    <td>{share(row.bytes_used, usage.data.quota_bytes)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </section>
  )
}
