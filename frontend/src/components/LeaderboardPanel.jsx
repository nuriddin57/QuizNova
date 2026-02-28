const sortRows = (rows = []) =>
  [...rows].sort((a, b) => {
    if ((b.score ?? 0) !== (a.score ?? 0)) return (b.score ?? 0) - (a.score ?? 0)
    return String(a.name || '').localeCompare(String(b.name || ''), 'en', { sensitivity: 'base' })
  })

const normalize = (item) => ({
  id: item?.id ?? item?.player_id ?? null,
  name: String(item?.name ?? item?.nickname ?? 'Guest').trim() || 'Guest',
  score: Number(item?.score ?? 0) || 0,
})

const keyOf = (entry) => `${entry.id ?? 'anon'}::${String(entry.name || '').toLowerCase()}`

export default function LeaderboardPanel({ players = [], leaderboard = [] }) {
  const source = leaderboard.length ? leaderboard : players
  const merged = new Map()
  source.map(normalize).forEach((entry) => merged.set(keyOf(entry), entry))
  const sorted = sortRows([...merged.values()])
  const topRows = sorted.slice(0, 10)
  const remaining = Math.max(0, sorted.length - topRows.length)

  return (
    <div className="frost-card rounded-[20px] p-6">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Yetakchilar jadvali</h3>

      {!sorted.length ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">Hali o'yinchi yo'q</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-[56px,1fr,96px] bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <span>Rank</span>
            <span>Nick</span>
            <span className="text-right">Score</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topRows.map((row, index) => (
              <div key={keyOf(row)} className="grid grid-cols-[56px,1fr,96px] px-4 py-3 text-sm">
                <span className="font-semibold text-slate-500 dark:text-slate-300">#{index + 1}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</span>
                <span className="text-right font-semibold text-indigo-600 dark:text-primary-400">{row.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {remaining > 0 && <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-300">va yana {remaining} ta</p>}
    </div>
  )
}
