import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import VoiceRecorder from './VoiceRecorder';

const MAX_CHARS = 500;

interface Props {
  onSubmit: (answerType: 'text' | 'photo' | 'video' | 'voice', text?: string, mediaUrl?: string) => void;
  disabled?: boolean;
}

export default function AnswerForm({ onSubmit, disabled }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleTextSubmit = () => {
    if (!text.trim() || text.trim().length > MAX_CHARS) return;
    onSubmit('text', text.trim());
    setSubmitted(true);
  };

  const handleVoiceRecorded = (url: string) => {
    onSubmit('voice', undefined, url);
    setSubmitted(true);
  };

  if (submitted || disabled) {
    return (
      <div className="bg-sage-50 border border-sage-200 rounded-2xl p-6 text-center animate-slide-up">
        <svg className="w-12 h-12 mx-auto text-sage-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sage-700 font-medium">{t('session.answered')}</p>
        <p className="text-sage-500 text-sm mt-1">{t('session.waitingForAnswer')}</p>
      </div>
    );
  }

  const charCount = text.length;
  const charColor = charCount > 480 ? 'text-rose-500' : charCount > 400 ? 'text-amber-500' : 'text-warm-400';

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="card-paper rounded-2xl p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          placeholder={t('session.answerPlaceholder')}
          className="w-full resize-none bg-transparent border-0 focus:ring-0 text-warm-800 placeholder-warm-400 text-base p-0 min-h-[120px] outline-none"
          rows={4}
          maxLength={MAX_CHARS}
        />
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs ${charColor}`}>{charCount}/{MAX_CHARS}</span>
          <button
            onClick={handleTextSubmit}
            disabled={!text.trim()}
            className="px-6 py-2.5 bg-sage-500 hover:bg-sage-600 text-white font-medium rounded-xl active:scale-95 transition-all disabled:opacity-30 shadow-sm"
          >
            {t('session.send')}
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-paper-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-paper px-3 text-sm text-warm-400">{t('session.or')}</span>
        </div>
      </div>

      <VoiceRecorder onRecorded={handleVoiceRecorded} />
    </div>
  );
}
