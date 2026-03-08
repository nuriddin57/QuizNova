import { useTranslation } from 'react-i18next'

const FieldSelectDropdown = ({ fields = [], value = '', onChange, label }) => {
  const { t } = useTranslation()

  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label || t('academy.field')}
      <select
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5"
      >
        <option value="">{t('fieldSelection.selectField')}</option>
        {fields.map((field) => (
          <option key={field.id} value={field.id}>
            {field.name}
          </option>
        ))}
      </select>
    </label>
  )
}

export default FieldSelectDropdown
