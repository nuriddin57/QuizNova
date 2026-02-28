import { useEffect, useState } from 'react';

interface TimerProps {
  duration: number;
  onExpire: () => void;
  onTick?: (timeLeft: number) => void;
}

export default function Timer({ duration, onExpire, onTick }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (timeLeft <= 0) { onExpire(); return; }
    const t = setTimeout(() => {
      const next = timeLeft - 1;
      setTimeLeft(next);
      onTick?.(next);
    }, 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const pct = (timeLeft / duration) * 100;
  const color = timeLeft > 10 ? 'bg-green-500' : timeLeft > 5 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`text-5xl font-extrabold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-purple-700'}`}>
        {timeLeft}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div className={`h-3 rounded-full transition-all duration-1000 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
