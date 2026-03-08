import { useTranslation } from 'react-i18next'

const SubjectFilterBar = ({
  fields = [],
  semesters = [],
  value = {},
  onChange,
}) => {
  const { t } = useTranslation()
  const update = (key) => (event) => onChange?.({ ...value, [key]: event.target.value })

  return (
    <div className="grid gap-3 rounded-[28px] border border-slate-200 bg-white/95 p-4 md:grid-cols-4">
      <input
        value={value.q || ''}
        onChange={update('q')}
        placeholder={t('academy.searchSubjectPlaceholder')}
        className="rounded-2xl border border-slate-200 px-4 py-2.5"
      />
      <select value={value.field_id || ''} onChange={update('field_id')} className="rounded-2xl border border-slate-200 px-4 py-2.5">
        <option value="">{t('academy.allFields')}</option>
        {fields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
      </select>
      <select value={value.semester || ''} onChange={update('semester')} className="rounded-2xl border border-slate-200 px-4 py-2.5">
        <option value="">{t('academy.allSemesters')}</option>
        {semesters.map((semester) => <option key={semester} value={semester}>{semester}</option>)}
      </select>
      <select value={value.is_active ?? ''} onChange={update('is_active')} className="rounded-2xl border border-slate-200 px-4 py-2.5">
        <option value="">{t('academy.anyStatus')}</option>
        <option value="true">{t('academy.active')}</option>
        <option value="false">{t('academy.inactive')}</option>
      </select>
    </div>
  )
}

export default SubjectFilterBar
