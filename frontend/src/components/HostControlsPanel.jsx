import { useTranslation } from 'react-i18next'

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
      ? 'border-rose-200 text-rose-700 dark:border-rose-300/45 dark:text-rose-300'
      : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200'
  const disabledClass = enabled ? '' : 'cursor-not-allowed opacity-60'
  return `rounded-xl border bg-white px-4 py-3 text-sm font-semibold transition ${toneClass} ${disabledClass} dark:bg-white/10`
}

export default function HostControlsPanel({ isHost, phase, wsStatus, onStart, onNext, onEnd }) {
  const { t } = useTranslation()
  if (!isHost) return null

  const startEnabled = isActionEnabled({ action: 'start', phase, isHost, wsStatus })
  const nextEnabled = isActionEnabled({ action: 'next', phase, isHost, wsStatus })
  const endEnabled = isActionEnabled({ action: 'end', phase, isHost, wsStatus })

  return (
    <div className="frost-card rounded-[20px] p-6">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('game.hostControls')}</h3>
      {wsStatus !== 'connected' ? <p className="mt-2 text-xs font-semibold text-rose-500">{t('game.wsDisconnected')}</p> : null}
      <div className="mt-4 flex flex-col gap-3">
        <button onClick={onStart} disabled={!startEnabled} className={btnClass(startEnabled)}>
          {t('game.start')}
        </button>
        <button onClick={onNext} disabled={!nextEnabled} className={btnClass(nextEnabled)}>
          {t('game.next')}
        </button>
        <button onClick={onEnd} disabled={!endEnabled} className={btnClass(endEnabled, 'danger')}>
          {t('game.endGame')}
        </button>
      </div>
    </div>
  )
}
