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
      <div className="bg-green-50 rounded-2xl p-6 text-center">
        <svg className="w-12 h-12 mx-auto text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-green-700 font-medium">{t('session.answered')}</p>
        <p className="text-green-600 text-sm mt-1">{t('session.waitingForAnswer')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('session.answerPlaceholder')}
          className="w-full resize-none border-0 focus:ring-0 text-gray-800 placeholder-gray-400 text-base p-0 min-h-[120px] outline-none"
          rows={4}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleTextSubmit}
            disabled={!text.trim()}
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl active:bg-indigo-700 transition-colors disabled:opacity-40"
          >
            {t('session.send')}
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gray-50 px-3 text-sm text-gray-400">lub</span>
        </div>
      </div>

      <MediaCapture onCaptured={handleMediaCaptured} />
    </div>
  );
}
