import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

interface Props {
  onCaptured: (url: string) => void;
  disabled?: boolean;
}

export default function MediaCapture({ onCaptured, disabled }: Props) {
  const { t } = useTranslation();
  const photoRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onCaptured(res.data.url);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <div>
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <button
        onClick={() => photoRef.current?.click()}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-white text-warm-600 border border-paper-border font-medium rounded-xl active:bg-warm-50 transition-all disabled:opacity-30"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {t('session.photo')}
      </button>
    </div>
  );
}
