import { useTranslation } from 'react-i18next';

interface Props {
  question: {
    id: number;
    text: string;
    depth_level: number;
    category_name: string;
  };
  onPick: (questionId: number) => void;
}

const depthColors: Record<number, string> = {
  1: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  2: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  3: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};

export default function QuestionCard({ question, onPick }: Props) {
  const { t } = useTranslation();

  return (
    <button
      onClick={() => onPick(question.id)}
      className="w-full text-left bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-5 border border-zinc-800 active:scale-[0.98] transition-all hover:border-zinc-700"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${depthColors[question.depth_level]}`}>
          {t(`session.depth.${question.depth_level}`)}
        </span>
        <span className="text-xs text-zinc-600">{question.category_name}</span>
      </div>
      <p className="text-zinc-200 text-base leading-relaxed">{question.text}</p>
    </button>
  );
}
