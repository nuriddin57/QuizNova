interface QuestionCardProps {
  question: { text: string; options: string[] };
  selectedAnswer?: number;
  correctAnswer?: number;
  onAnswer?: (index: number) => void;
  disabled?: boolean;
}

const COLORS = [
  'from-red-500 to-rose-600',
  'from-blue-500 to-indigo-600',
  'from-green-500 to-emerald-600',
  'from-yellow-500 to-orange-500',
];
const LABELS = ['A', 'B', 'C', 'D'];

export default function QuestionCard({ question, selectedAnswer, correctAnswer, onAnswer, disabled }: QuestionCardProps) {
  return (
    <div className="space-y-4">
      <div className="card text-center text-xl font-bold text-gray-800 min-h-[80px] flex items-center justify-center">
        {question.text}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {question.options.map((opt, i) => {
          let extra = '';
          if (correctAnswer !== undefined) {
            if (i === correctAnswer) extra = 'ring-4 ring-green-400 brightness-110';
            else if (i === selectedAnswer && i !== correctAnswer) extra = 'opacity-50';
          }
          const isSelected = selectedAnswer === i;
          return (
            <button
              key={i}
              onClick={() => !disabled && onAnswer?.(i)}
              disabled={disabled}
              className={`bg-gradient-to-br ${COLORS[i]} text-white font-bold rounded-xl p-4 text-left flex items-center gap-3 transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed shadow-md ${isSelected ? 'ring-4 ring-white scale-105' : ''} ${extra}`}
            >
              <span className="text-2xl font-black bg-white/20 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">{LABELS[i]}</span>
              <span className="text-sm">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
