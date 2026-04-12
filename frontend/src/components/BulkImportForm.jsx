import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import PrimaryButton from './PrimaryButton'

const BulkImportForm = ({ subjects = [], topics = [], modules = [], loading = false, onSubmit }) => {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    subject_ref: '',
    topic_ref: '',
    module_ref: '',
    format: 'json',
    preview: true,
    content: '[]',
    file: null,
  })

  const update = (key) => (event) => {
    const value =
      event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.type === 'file'
        ? event.target.files?.[0] || null
        : event.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const submit = (event) => {
    event.preventDefault()
    onSubmit?.({
      ...form,
      subject_ref: Number(form.subject_ref),
      topic_ref: form.topic_ref ? Number(form.topic_ref) : null,
      module_ref: form.module_ref ? Number(form.module_ref) : null,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-[28px] border border-slate-200 bg-white/95 p-5">
      <div className="grid gap-3 md:grid-cols-4">
        <select value={form.subject_ref} onChange={update('subject_ref')} className="rounded-2xl border border-slate-200 px-4 py-2.5">
          <option value="">{t('academy.selectSubject')}</option>
          {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>)}
        </select>
        <select value={form.topic_ref} onChange={update('topic_ref')} className="rounded-2xl border border-slate-200 px-4 py-2.5">
          <option value="">{t('academy.selectTopic')}</option>
          {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
        </select>
        <select value={form.module_ref} onChange={update('module_ref')} className="rounded-2xl border border-slate-200 px-4 py-2.5">
          <option value="">{t('academy.selectModule')}</option>
          {modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
        </select>
        <select value={form.format} onChange={update('format')} className="rounded-2xl border border-slate-200 px-4 py-2.5">
          <option value="json">{t('academy.formats.json')}</option>
          <option value="csv">{t('academy.formats.csv')}</option>
          <option value="excel">{t('academy.formats.excel')}</option>
        </select>
      </div>
      <input type="file" accept=".json,.csv,.xlsx,.xls" onChange={update('file')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
      {!form.file ? (
        <textarea value={form.content} onChange={update('content')} rows={10} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm" />
      ) : null}
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <input type="checkbox" checked={form.preview} onChange={update('preview')} />
        {t('academy.previewOnly')}
      </label>
      <PrimaryButton type="submit" disabled={loading}>{loading ? t('academy.processing') : t('academy.runImport')}</PrimaryButton>
    </form>
  )
}

export default BulkImportForm
