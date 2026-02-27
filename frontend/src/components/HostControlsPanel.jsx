const isActionEnabled = ({ action, phase, isHost, wsStatus }) => {
  if (!isHost) return false
  if (wsStatus !== 'connected') return false
  if (phase === 'finished') return false
  if (action === 'start') return phase === 'lobby'
  if (action === 'next') return phase === 'question'
  if (action === 'end') return phase === 'lobby' || phase === 'question'
  return false
}

const btnClass = (enabled, tone = 'neutral') => {
  const toneClass =
    tone === 'danger'
      ? 'border-rose-200 text-rose-600'
      : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200'
  const disabledClass = enabled ? '' : 'cursor-not-allowed opacity-60'
  return `rounded-2xl border px-4 py-3 text-sm font-semibold ${toneClass} ${disabledClass}`
}

export default function HostControlsPanel({ isHost, phase, wsStatus, onStart, onNext, onEnd }) {
  if (!isHost) return null

  const startEnabled = isActionEnabled({ action: 'start', phase, isHost, wsStatus })
  const nextEnabled = isActionEnabled({ action: 'next', phase, isHost, wsStatus })
  const endEnabled = isActionEnabled({ action: 'end', phase, isHost, wsStatus })

  return (
    <div className="rounded-[32px] bg-white p-6 shadow-card dark:bg-slate-900">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Xost boshqaruv elementlari</h3>
      {wsStatus !== 'connected' ? (
        <p className="mt-2 text-xs font-semibold text-rose-500">WS uzildi</p>
      ) : null}
      <div className="mt-4 flex flex-col gap-3">
        <button onClick={onStart} disabled={!startEnabled} className={btnClass(startEnabled)}>
          Start
        </button>
        <button onClick={onNext} disabled={!nextEnabled} className={btnClass(nextEnabled)}>
          Next
        </button>
        <button onClick={onEnd} disabled={!endEnabled} className={btnClass(endEnabled, 'danger')}>
          End
        </button>
      </div>
    </div>
  )
}
