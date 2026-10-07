'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { useState } from 'react'

import { Link, usePathname, useRouter } from '@/i18n/navigation'

import { useDatasets } from '../api/catalog'
import { cleanQuery, paths, periodOf, situationOf } from '../model/catalog'

// 数据目录（账 56 起只在管理端）：公共库里现在有哪些数据集、各自到哪一天。
// 这里列的就是专家和代理查得到的数据。搜的词放在地址里，刷新、分享都还在。
export function CatalogPanel({ query: given }: { query: string }) {
  const t = useTranslations('catalog.list')
  const format = useFormatter()
  const router = useRouter()
  const pathname = usePathname()
  const query = cleanQuery(given)
  const [typed, setTyped] = useState(query)
  const datasets = useDatasets(query)
  const go = (q: string) => router.push(q ? paths.catalog(q) : pathname)

  return (
    <div className="space-y-6">
      <section className="reference-card">
        <form
          role="search"
          className="reference-actions items-end"
          onSubmit={(event) => {
            event.preventDefault()
            go(cleanQuery(typed))
          }}
        >
          <div className="schema-field md:w-72">
            <label htmlFor="catalog-q">{t('searchLabel')}</label>
            <input
              id="catalog-q"
              type="search"
              value={typed}
              maxLength={80}
              placeholder={t('searchPlaceholder')}
              onChange={(event) => setTyped(event.target.value)}
            />
          </div>
          <button type="submit" className="primary-button">
            {t('search')}
          </button>
          {query ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setTyped('')
                go('')
              }}
            >
              {t('clear')}
            </button>
          ) : null}
        </form>
        <p className="reference-notice">{t('structureOnly')}</p>
      </section>

      <section className="reference-card" aria-label={t('title')}>
        {datasets.isPending ? <p className="crud-state">{t('loading')}</p> : null}
        {datasets.isError ? (
          <p role="alert" className="crud-error">
            {t('failed')}
          </p>
        ) : null}
        {datasets.data ? (
          situationOf(datasets.data, query) === 'not-found' ? (
            <div className="crud-empty">
              <p className="font-medium">{t('notFound', { query })}</p>
              <p className="text-muted-foreground mt-1 text-sm">{t('notFoundHint')}</p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">
                {query
                  ? t('found', { count: datasets.data.datasets.length, total: datasets.data.total })
                  : t('count', { count: datasets.data.total })}
              </p>
              <div className="crud-table-wrap">
                <table className="crud-table">
                  <caption className="sr-only">{t('title')}</caption>
                  <thead>
                    <tr>
                      <th>{t('code')}</th>
                      <th>{t('dataset')}</th>
                      <th>{t('periodHeading')}</th>
                      <th>{t('updatedHeading')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasets.data.datasets.map((entry) => {
                      const period = periodOf(entry)
                      return (
                        <tr key={entry.dataset}>
                          <td className="font-mono">{entry.security_code ?? '—'}</td>
                          <td>
                            <Link href={paths.dataset(entry.dataset)} className="font-medium">
                              {entry.title}
                            </Link>
                            {entry.default ? (
                              <span className="status-badge ml-2">{t('default')}</span>
                            ) : null}
                            <span className="text-muted-foreground block font-mono text-xs">
                              {entry.data_version}
                            </span>
                          </td>
                          <td>{period ? t('period', period) : t('periodUnknown')}</td>
                          <td>
                            {entry.updated_at
                              ? format.dateTime(new Date(entry.updated_at), {
                                  dateStyle: 'medium',
                                })
                              : t('builtIn')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {situationOf(datasets.data, query) === 'default-only' ? (
                <p role="status" className="crud-state">
                  {datasets.data.registry_enabled ? t('noneRegistered') : t('registryOff')}
                </p>
              ) : null}
            </>
          )
        ) : null}
      </section>
    </div>
  )
}
