import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MediaCapture from './MediaCapture';

interface Props {
  onSubmit: (answerType: 'text' | 'photo' | 'video', text?: string, mediaUrl?: string) => void;
  disabled?: boolean;
}

export default function AnswerForm({ onSubmit, disabled }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleTextSubmit = () => {
    if (!text.trim()) return;
    onSubmit('text', text.trim());
    setSubmitted(true);
  };

  const handleMediaCaptured = (url: string, type: 'photo' | 'video') => {
    onSubmit(type, undefined, url);
    setSubmitted(true);
  };

  if (submitted || disabled) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center animate-slide-up">
        <svg className="w-12 h-12 mx-auto text-emerald-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-emerald-300 font-medium">{t('session.answered')}</p>
        <p className="text-emerald-400/60 text-sm mt-1">{t('session.waitingForAnswer')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-4 border border-zinc-800">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('session.answerPlaceholder')}
          className="w-full resize-none bg-transparent border-0 focus:ring-0 text-zinc-200 placeholder-zinc-600 text-base p-0 min-h-[120px] outline-none"
          rows={4}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleTextSubmit}
            disabled={!text.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium rounded-xl active:scale-95 transition-all disabled:opacity-30 shadow-lg shadow-violet-500/20"
          >
            {t('session.send')}
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-zinc-950 px-3 text-sm text-zinc-600">{t('session.or')}</span>
        </div>
      </div>

      <MediaCapture onCaptured={handleMediaCaptured} />
    </div>
  );
}
