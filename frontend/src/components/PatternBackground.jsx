const blobs = [
  { className: 'absolute -top-32 -left-20 hidden h-72 w-72 rounded-full bg-primary-400/28 blur-[115px] animate-floatySlow dark:block' },
  { className: 'absolute top-16 -right-20 hidden h-80 w-80 rounded-full bg-accent-cyan/24 blur-[120px] animate-floaty dark:block' },
  { className: 'absolute bottom-0 left-1/2 hidden h-[32rem] w-[32rem] -translate-x-1/2 translate-y-1/2 rounded-full bg-accent-blue/20 blur-[160px] dark:block' },
]

const PatternBackground = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 hidden dark:block starfield-layer opacity-60" />
    <div className="absolute inset-0 hidden dark:block starfield-layer-fast opacity-45" />
    <div className="absolute inset-0 hidden dark:block neon-grid opacity-40" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(124,58,237,0.08),transparent_34%),radial-gradient(circle_at_82%_2%,rgba(37,99,235,0.07),transparent_28%),linear-gradient(180deg,rgba(248,249,252,0.9),rgba(238,242,247,0.95))] dark:bg-[radial-gradient(circle_at_50%_-20%,rgba(34,211,238,0.16),transparent_48%),linear-gradient(180deg,rgba(2,6,14,0.2),rgba(2,6,14,0.85))]" />
    {blobs.map((blob, idx) => (
      <div key={idx} className={blob.className} />
    ))}
  </div>
)

export default PatternBackground
