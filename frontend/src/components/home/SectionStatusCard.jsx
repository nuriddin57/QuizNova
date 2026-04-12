import Card from '../Card'
import LoadingSkeleton from '../LoadingSkeleton'

const SectionStatusCard = ({ title, body, action = null, loading = false, className = '' }) => (
  <Card className={className} hover={false}>
    {loading ? (
      <div className="space-y-4">
        <LoadingSkeleton className="h-4 w-32" />
        <LoadingSkeleton className="h-8 w-3/4" />
        <LoadingSkeleton lines={3} />
      </div>
    ) : (
      <>
        <h3 className="text-xl font-display font-semibold text-slate-900">{title}</h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{body}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </>
    )}
  </Card>
)

export default SectionStatusCard

