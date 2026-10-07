'use client'

import { useFormatter, useTranslations } from 'next-intl'

import type { Metric, Note, Table } from '@/contracts/catalog'
import { Link } from '@/i18n/navigation'

import { isNotFound, useDataset } from '../api/catalog'
import { columnExtras, countsOf, paths, periodOf, splitTables } from '../model/catalog'

// 一个数据集：摘要、表与列、口径、局限。只有结构，看不到任何一行的数值。
export function DatasetPanel({ dataset }: { dataset: string }) {
  const t = useTranslations('catalog.dataset')
  const format = useFormatter()
  const found = useDataset(dataset)
  const back = (
    <Link href={paths.catalog()} className="text-muted-foreground hover:text-foreground text-sm">
      ← {t('toCatalog')}
    </Link>
  )

  if (found.isPending) {
    return (
      <div className="space-y-4">
        {back}
        <p className="crud-state">{t('loading')}</p>
      </div>
    )
  }
  if (found.isError) {
    return (
      <div className="space-y-4">
        {back}
        <div role="alert" className="crud-error">
          <p>{isNotFound(found.error) ? t('notFound') : t('failed')}</p>
          {isNotFound(found.error) ? <p className="font-mono text-xs">{dataset}</p> : null}
        </div>
      </div>
    )
  }

  const data = found.data
  const period = periodOf(data)
  const tables = splitTables(data.tables)
  const counts = countsOf(data)
  return (
    <div className="space-y-6">
      {back}
      <header>
        <h2 className="text-xl font-semibold">{data.title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {data.security_code ? (
            <span className="text-foreground mr-2 font-mono">{data.security_code}</span>
          ) : null}
          {t('counts', counts)}
        </p>
      </header>

      <section className="reference-card" aria-label={t('summary')}>
        <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <Fact label={t('period')}>{period ? t('periodValue', period) : t('periodUnknown')}</Fact>
          <Fact label={t('version')}>
            <span className="font-mono text-xs break-all">{data.data_version}</span>
          </Fact>
          <Fact label={t('updated')}>
            {data.updated_at
              ? format.dateTime(new Date(data.updated_at), {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : t('builtIn')}
          </Fact>
          <Fact label={t('id')}>
            <span className="font-mono text-xs break-all">{data.dataset}</span>
          </Fact>
          {data.sources.map((note) => (
            <Fact key={note.key} label={note.label} wide>
              {note.text}
            </Fact>
          ))}
        </dl>
        <p className="reference-notice">{t('structureOnly')}</p>
      </section>

      <Section title={t('tables')} count={tables.data.length} empty={t('noTables')}>
        {tables.data.map((table) => (
          <TableCard key={table.name} table={table} />
        ))}
      </Section>

      <Section title={t('metrics')} count={data.metrics.length} empty={t('noMetrics')}>
        {data.metrics.length ? (
          <ul aria-label={t('metrics')} className="divide-y">
            {data.metrics.map((metric) => (
              <MetricRow key={metric.name} metric={metric} />
            ))}
          </ul>
        ) : null}
      </Section>

      <Section title={t('limitations')} count={data.limitations.length} empty={t('noLimitations')}>
        {data.limitations.length ? (
          <Notes notes={data.limitations} label={t('limitations')} />
        ) : null}
      </Section>

      {tables.dictionary.length ? (
        <Section title={t('dictionary')} count={tables.dictionary.length} empty="">
          <p className="text-muted-foreground text-sm">{t('dictionaryHint')}</p>
          {tables.dictionary.map((table) => (
            <TableCard key={table.name} table={table} />
          ))}
        </Section>
      ) : null}
    </div>
  )
}

function Fact({
  label,
  wide = false,
  children,
}: {
  label: string
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={wide ? 'min-w-0 sm:col-span-2' : 'min-w-0'}>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-0.5 leading-relaxed">{children}</dd>
    </div>
  )
}

function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string
  count: number
  empty: string
  children: React.ReactNode
}) {
  return (
    <section aria-label={title} className="reference-card space-y-2">
      <h3 className="text-base font-semibold">
        {title}
        <span className="text-muted-foreground ml-2 text-sm font-normal">{count}</span>
      </h3>
      {count === 0 ? <p className="text-muted-foreground text-sm">{empty}</p> : children}
    </section>
  )
}

// 一张表：名字、有几行、每一列。默认收着，点开看列
function TableCard({ table }: { table: Table }) {
  const t = useTranslations('catalog.dataset')
  const extras = columnExtras(table)
  return (
    <details className="group rounded-lg border">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden">
        <span className="text-muted-foreground text-xs transition-transform group-open:rotate-90">
          ▶
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-sm font-medium">{table.name}</span>
        <span className="text-muted-foreground shrink-0 text-sm">
          {t('tableSize', { rows: table.row_count ?? 0, columns: table.columns.length })}
        </span>
      </summary>
      <div className="crud-table-wrap border-t">
        <table className="crud-table">
          <caption className="sr-only">{t('columnsOf', { table: table.name })}</caption>
          <thead>
            <tr>
              <th>{t('column')}</th>
              {extras.labels ? <th>{t('columnLabel')}</th> : null}
              <th>{t('columnType')}</th>
              {extras.units ? <th>{t('columnUnit')}</th> : null}
            </tr>
          </thead>
          <tbody>
            {table.columns.map((column) => (
              <tr key={column.name}>
                <td className="font-mono">{column.name}</td>
                {extras.labels ? <td>{column.label ?? ''}</td> : null}
                <td className="text-muted-foreground font-mono">{column.type}</td>
                {extras.units ? (
                  <td className="text-muted-foreground">{column.unit ?? ''}</td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

// 一个口径：名字、中文名、怎么算、用到哪些表、适用范围
function MetricRow({ metric }: { metric: Metric }) {
  const t = useTranslations('catalog.dataset')
  return (
    <li className="space-y-1.5 py-3">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-medium">{metric.label ?? metric.name}</span>
        {metric.label ? (
          <span className="text-muted-foreground font-mono text-xs">{metric.name}</span>
        ) : null}
        {metric.queryable === false ? (
          <span className="status-badge">{t('notQueryable')}</span>
        ) : null}
      </p>
      {metric.description ? <p className="text-sm leading-relaxed">{metric.description}</p> : null}
      {metric.expression ? (
        <p className="bg-muted overflow-x-auto rounded-md px-2.5 py-1.5 font-mono text-xs whitespace-nowrap">
          {metric.expression}
        </p>
      ) : null}
      <p className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
        {metric.tables.length ? (
          <span>
            {t('metricTables')}
            <span className="font-mono">{metric.tables.join(', ')}</span>
          </span>
        ) : null}
        {metric.unit ? <span>{t('metricUnit', { unit: metric.unit })}</span> : null}
        {metric.time_basis ? <span>{t('metricTime', { basis: metric.time_basis })}</span> : null}
      </p>
      {metric.reason_if_not ? (
        <p className="text-muted-foreground text-sm">
          {t('metricScope', { reason: metric.reason_if_not })}
        </p>
      ) : null}
    </li>
  )
}

function Notes({ notes, label }: { notes: Note[]; label: string }) {
  return (
    <ul aria-label={label} className="divide-y">
      {notes.map((note) => (
        <li key={note.key} className="py-3">
          <p className="text-sm font-medium">{note.label}</p>
          <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">{note.text}</p>
        </li>
      ))}
    </ul>
  )
}
