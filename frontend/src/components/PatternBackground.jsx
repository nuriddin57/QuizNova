const blobs = [
  { className: 'absolute -top-24 -left-10 h-64 w-64 rounded-full bg-primary-300/35 blur-3xl dark:bg-primary-500/20' },
  { className: 'absolute top-40 -right-24 h-72 w-72 rounded-full bg-accent-blue/35 blur-[90px] dark:bg-accent-blue/15' },
  { className: 'absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary-200/35 blur-[120px] dark:bg-primary-400/10' },
]

const PatternBackground = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-primary-50/40 to-accent-blue/10 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20" />
    <div className="blooket-grid absolute inset-0 dark:opacity-25" />
    {blobs.map((blob, idx) => (
      <div key={idx} className={blob.className} />
    ))}
    <div className="pattern-dot absolute inset-y-0 right-10 hidden h-40 w-40 rounded-3xl bg-white/10 blur-[1px] lg:block dark:bg-white/5" />
  </div>
)

export default PatternBackground
