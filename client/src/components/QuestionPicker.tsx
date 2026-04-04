import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import QuestionCard from './QuestionCard';

interface Props {
  sessionId: number;
  onPick: (questionId: number) => void;
  mode?: string;
}

type PickMode = 'random3' | 'category' | 'fullRandom';

export default function QuestionPicker({ sessionId, onPick, mode = 'duo' }: Props) {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickMode, setPickMode] = useState<PickMode | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDepth, setSelectedDepth] = useState<number | null>(null);

  useEffect(() => {
    api.get('/questions/categories').then(res => setCategories(res.data));
  }, []);

  const loadQuestions = async (category?: string, depth?: number) => {
    setLoading(true);
    try {
      const params: any = { sessionId, count: 3, mode };
      if (category) params.category = category;
      if (depth) params.depth = depth;
      const res = await api.get('/questions/random', { params });
      setQuestions(res.data);
    } catch (err) {
      console.error('Failed to load questions:', err);
    }
    setLoading(false);
  };

  const handleFullRandom = async () => {
    setLoading(true);
    try {
      const params: any = { sessionId, count: 1, mode };
      const res = await api.get('/questions/random', { params });
      if (res.data.length > 0) {
        onPick(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load question:', err);
    }
    setLoading(false);
  };

  const handleCategoryPick = (slug: string) => {
    setSelectedCategory(slug);
    loadQuestions(slug, selectedDepth || undefined);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-6 h-6 border-2 border-sage-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // Step 1: Choose pick mode
  if (!pickMode) {
    return (
      <div className="space-y-3 animate-slide-up">
        <h2 className="text-lg font-semibold text-warm-700 mb-1">{t('session.pickQuestion')}</h2>

        <button
          onClick={() => { setPickMode('random3'); loadQuestions(); }}
          className="w-full card-paper rounded-xl p-4 text-left active:scale-[0.98] transition-all hover:shadow-md"
        >
          <p className="font-medium text-warm-700">{t('session.show3Random')}</p>
          <p className="text-xs text-warm-400 mt-1">{t('session.show3RandomDesc')}</p>
        </button>

        <button
          onClick={() => setPickMode('category')}
          className="w-full card-paper rounded-xl p-4 text-left active:scale-[0.98] transition-all hover:shadow-md"
        >
          <p className="font-medium text-warm-700">{t('session.pickCategory')}</p>
          <p className="text-xs text-warm-400 mt-1">{t('session.pickCategoryDesc')}</p>
        </button>

        <button
          onClick={handleFullRandom}
          className="w-full card-paper rounded-xl p-4 text-left active:scale-[0.98] transition-all hover:shadow-md"
        >
          <p className="font-medium text-warm-700">{t('session.randomQuestion')}</p>
          <p className="text-xs text-warm-400 mt-1">{t('session.randomQuestionDesc')}</p>
        </button>
      </div>
    );
  }

  // Step 2a: Category picker
  if (pickMode === 'category' && !selectedCategory) {
    return (
      <div className="space-y-3 animate-slide-up">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => setPickMode(null)} className="text-warm-400 p-1 rounded hover:bg-white/50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-lg font-semibold text-warm-700">{t('session.pickCategory')}</h2>
        </div>

        {/* Depth filter */}
        <div className="flex gap-2 mb-2">
          {[1, 2, 3].map(d => (
            <button
              key={d}
              onClick={() => setSelectedDepth(selectedDepth === d ? null : d)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${
                selectedDepth === d
                  ? d === 1 ? 'bg-sage-50 text-sage-600 border-sage-200' : d === 2 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-500 border-rose-200'
                  : 'bg-white text-warm-500 border-paper-border hover:border-warm-300'
              }`}
            >
              {t(`session.depth.${d}`)}
            </button>
          ))}
        </div>

        <div className="space-y-2 stagger-children">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryPick(cat.slug)}
              className="w-full card-paper rounded-xl p-4 text-left active:scale-[0.98] transition-all hover:shadow-md"
            >
              <p className="font-medium text-warm-700">{cat.name}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2b/3: Show questions
  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center gap-2">
        <button onClick={() => { setPickMode(null); setSelectedCategory(null); setSelectedDepth(null); setQuestions([]); }} className="text-warm-400 p-1 rounded hover:bg-white/50">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-lg font-semibold text-warm-700">{t('session.pickQuestion')}</h2>
      </div>
      <div className="space-y-3 stagger-children">
        {questions.map((q) => (
          <QuestionCard key={q.id} question={q} onPick={onPick} />
        ))}
      </div>
      <button
        onClick={() => loadQuestions(selectedCategory || undefined, selectedDepth || undefined)}
        className="w-full py-3 text-sage-600 font-medium text-sm rounded-xl border border-dashed border-warm-300 active:bg-sage-50 transition-colors"
      >
        {t('session.newQuestions')}
      </button>
    </div>
  );
}
