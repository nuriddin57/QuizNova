import { useTranslation } from 'react-i18next'

const TopicSelect = ({ topics = [], value = '', onChange, label }) => {
  const { t } = useTranslation()

  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label || t('academy.topic')}
      <select value={value} onChange={(event) => onChange?.(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5">
        <option value="">{t('academy.selectTopic')}</option>
        {topics.map((topic) => (
          <option key={topic.id} value={topic.id}>
            {topic.unit_name ? `${topic.unit_name} · ${topic.name}` : topic.name}
          </option>
        ))}
      </select>
    </label>
  )
}

export default TopicSelect
