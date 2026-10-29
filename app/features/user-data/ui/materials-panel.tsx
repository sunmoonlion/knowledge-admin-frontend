'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { useState } from 'react'

import type { AdminMaterial } from '@/contracts/user-data'

import { useDeletions, useDispose, useMaterials } from '../api/user-data'
import { cleanReason, materialQuery } from '../model/user-data'

// 被禁用资料的处理（0044 第四节、0043 第 2.8 节）：找资料、禁用（违规处置：停一切新读取，
// 在跑的授权也撤）、依法清除（没有别人的使用权或是必须删的个人信息时真删）。每一步写明
// 原因、留删除事件。禁用、清除只有 admin 能做。
export function MaterialsPanel({
  csrfToken,
  canDispose,
}: {
  csrfToken: string
  canDispose: boolean
}) {
  const t = useTranslations('userData.materials')
  const [form, setForm] = useState({ owner: '', materialId: '', disabled: true })
  const [query, setQuery] = useState<string | null>(materialQuery(form))
  const [open, setOpen] = useState<string | null>(null)
  const materials = useMaterials(query)
  return (
    <div className="space-y-6">
      <section className="reference-card">
        <form
          role="search"
          className="reference-actions items-end"
          onSubmit={(event) => {
            event.preventDefault()
            setQuery(materialQuery(form))
          }}
        >
          <div className="schema-field md:w-64">
            <label htmlFor="ud-owner">{t('owner')}</label>
            <input
              id="ud-owner"
              value={form.owner}
              maxLength={255}
              onChange={(event) => setForm({ ...form, owner: event.target.value })}
            />
          </div>
          <div className="schema-field md:w-80">
            <label htmlFor="ud-id">{t('materialId')}</label>
            <input
              id="ud-id"
              value={form.materialId}
              maxLength={64}
              onChange={(event) => setForm({ ...form, materialId: event.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.disabled}
              onChange={(event) => setForm({ ...form, disabled: event.target.checked })}
            />
            {t('disabledOnly')}
          </label>
          <button type="submit" className="primary-button">
            {t('search')}
          </button>
        </form>
        {query === null ? <p className="reference-notice">{t('needFilter')}</p> : null}
      </section>
      <section className="reference-card" aria-label={t('title')}>
        {materials.isPending && query !== null ? (
          <p className="crud-state">{t('loading')}</p>
        ) : null}
        {materials.isError ? (
          <p role="alert" className="crud-error">
            {t('failed')}
          </p>
        ) : null}
        {materials.data && materials.data.length === 0 ? (
          <p className="crud-empty">{t('none')}</p>
        ) : null}
        {materials.data?.map((m) => (
          <MaterialRow
            key={m.material_id}
            material={m}
            open={open === m.material_id}
            onToggle={() => setOpen(open === m.material_id ? null : m.material_id)}
            csrfToken={csrfToken}
            canDispose={canDispose}
          />
        ))}
      </section>
    </div>
  )
}

function MaterialRow({
  material,
  open,
  onToggle,
  csrfToken,
  canDispose,
}: {
  material: AdminMaterial
  open: boolean
  onToggle: () => void
  csrfToken: string
  canDispose: boolean
}) {
  const t = useTranslations('userData.materials')
  const format = useFormatter()
  const deletions = useDeletions(open ? material.material_id : null)
  const dispose = useDispose(csrfToken)
  const [reason, setReason] = useState('')
  const [personalInfo, setPersonalInfo] = useState(false)
  const when = (value: string | null) =>
    value ? format.dateTime(new Date(value), { dateStyle: 'medium', timeStyle: 'short' }) : null
  const ready = cleanReason(reason).length > 0
  return (
    <article className="space-y-2 border-t py-3 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="font-medium hover:underline" onClick={onToggle}>
          {material.name}
        </button>
        <span className="font-mono text-xs">{material.material_id}</span>
        <span className="font-mono text-xs">{material.owner}</span>
        {material.disabled_at ? (
          <span className="status-badge">
            {t('disabledAt', { at: when(material.disabled_at) ?? '' })}
          </span>
        ) : null}
        {material.deleted_at ? <span className="status-badge">{t('deleted')}</span> : null}
      </div>
      <p className="text-muted-foreground text-xs">
        {[
          material.content_origin,
          material.license,
          material.doc_type ?? '—',
          material.description_status,
          `v${material.current_version}`,
        ].join(' · ')}
      </p>
      {open ? (
        <div className="space-y-3">
          <div>
            <h3 className="font-medium">{t('events')}</h3>
            {deletions.data && deletions.data.length === 0 ? (
              <p className="text-xs">{t('noEvents')}</p>
            ) : null}
            <ul className="text-xs">
              {(deletions.data ?? []).map((e) => (
                <li key={e.id}>
                  {t(`action.${e.action}`)} · {e.reason} · {t(`state.${e.state}`)}
                  {e.pending.length ? ` · ${t('pending', { list: e.pending.join('、') })}` : null}
                </li>
              ))}
            </ul>
          </div>
          {canDispose ? (
            <div className="space-y-2">
              <div className="schema-field">
                <label htmlFor={`reason-${material.material_id}`}>{t('reason')}</label>
                <input
                  id={`reason-${material.material_id}`}
                  value={reason}
                  maxLength={80}
                  onChange={(event) => setReason(event.target.value)}
                />
              </div>
              <div className="reference-actions">
                {!material.disabled_at ? (
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={!ready || dispose.disable.isPending}
                    onClick={() => {
                      if (window.confirm(t('disableConfirm')))
                        dispose.disable.mutate({
                          id: material.material_id,
                          reason: cleanReason(reason),
                        })
                    }}
                  >
                    {t('disable')}
                  </button>
                ) : null}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={personalInfo}
                    onChange={(event) => setPersonalInfo(event.target.checked)}
                  />
                  {t('personalInfo')}
                </label>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={!ready || dispose.purge.isPending}
                  onClick={() => {
                    if (window.confirm(t('purgeConfirm')))
                      dispose.purge.mutate({
                        id: material.material_id,
                        reason: cleanReason(reason),
                        personalInfo,
                      })
                  }}
                >
                  {t('purge')}
                </button>
              </div>
              {dispose.purge.data ? (
                <p role="status" className="text-xs">
                  {dispose.purge.data.purged ? t('purged') : t('relationOnly')}
                </p>
              ) : null}
              {dispose.disable.isError || dispose.purge.isError ? (
                <p role="alert" className="crud-error">
                  {t('actionFailed')}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="reference-notice">{t('adminOnly')}</p>
          )}
        </div>
      ) : null}
    </article>
  )
}
