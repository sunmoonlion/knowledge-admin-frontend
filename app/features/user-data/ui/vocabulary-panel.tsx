'use client'

import { useTranslations } from 'next-intl'

import { useVocabulary } from '../api/user-data'
import { byVersion, typeName } from '../model/user-data'

// 词表维护（0044 第四节、0049 第二节）：词表在代码里，带版本号；只加取值不升版本，
// 改名、删除、改词义才升，同时重新生成契约。这里看现行的类型枚举、版本，和描述按版本、
// 确认状态的分布：用旧词表的描述不参与解析，要用户重新确认。
export function VocabularyPanel() {
  const t = useTranslations('userData.vocabulary')
  const vocabulary = useVocabulary()
  const data = vocabulary.data
  return (
    <div className="space-y-6">
      {vocabulary.isPending ? <p className="crud-state">{t('loading')}</p> : null}
      {vocabulary.isError ? (
        <p role="alert" className="crud-error">
          {t('failed')}
        </p>
      ) : null}
      {data ? (
        <>
          <section className="reference-card">
            <h2>{t('current', { version: data.version })}</h2>
            <p className="reference-notice">{t('rule')}</p>
          </section>
          <section className="reference-card" aria-label={t('distribution')}>
            <h2>{t('distribution')}</h2>
            {byVersion(data).map((group) => (
              <div key={String(group.version)} className="space-y-2">
                <h3 className="font-medium">
                  {group.version === data.version
                    ? t('versionCurrent', { version: group.version ?? '?', total: group.total })
                    : t('versionOld', { version: group.version ?? '?', total: group.total })}
                </h3>
                <div className="crud-table-wrap">
                  <table className="crud-table">
                    <thead>
                      <tr>
                        <th>{t('type')}</th>
                        <th>{t('status')}</th>
                        <th>{t('count')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row) => (
                        <tr key={`${row.doc_type}-${row.status}`}>
                          <td>{typeName(data, row.doc_type) ?? t('noType')}</td>
                          <td>
                            {t.has(`statusName.${row.status}`)
                              ? t(`statusName.${row.status}`)
                              : row.status}
                          </td>
                          <td>{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>
          <section className="reference-card" aria-label={t('types')}>
            <h2>{t('types')}</h2>
            {Object.entries(data.vocabulary.doc_classes).map(([code, item]) => (
              <div key={code}>
                <h3 className="font-medium">
                  {item.name} <span className="font-mono text-xs">{code}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{item.publisher}</span>
                </h3>
                <p className="text-sm">
                  {Object.entries(data.vocabulary.doc_types)
                    .filter(([, type]) => type.class === code)
                    .map(([typeCode, type]) => `${type.name}（${typeCode}）`)
                    .join('、')}
                </p>
              </div>
            ))}
            <h3 className="font-medium">{t('topics')}</h3>
            <p className="text-sm">{Object.values(data.vocabulary.topics).join('、')}</p>
            <h3 className="font-medium">{t('industries')}</h3>
            <p className="text-sm">{data.vocabulary.industries.join('、')}</p>
          </section>
        </>
      ) : null}
    </div>
  )
}
