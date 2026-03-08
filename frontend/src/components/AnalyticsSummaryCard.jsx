const AnalyticsSummaryCard = ({ title, value, tone = 'primary' }) => {
  const toneClasses =
    tone === 'success'
      ? 'from-emerald-500 to-teal-500'
      : tone === 'danger'
      ? 'from-rose-500 to-orange-500'
      : 'from-primary-500 to-blue-500'

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5">
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${toneClasses}`} />
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

export default AnalyticsSummaryCard
