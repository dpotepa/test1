import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

interface Props {
  onRecorded: (url: string) => void;
  disabled?: boolean;
}

const MAX_SECONDS = 60;

export default function VoiceRecorder({ onRecorded, disabled }: Props) {
  const { t } = useTranslation();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);

        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        await uploadAudio(blob);
      };

      mediaRecorder.start(100);
      setRecording(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s + 1 >= MAX_SECONDS) {
            mediaRecorder.stop();
            setRecording(false);
            return MAX_SECONDS;
          }
          return s + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const uploadAudio = async (blob: Blob) => {
    setUploading(true);
    try {
      const ext = blob.type.includes('webm') ? 'webm' : blob.type.includes('mp4') ? 'm4a' : 'ogg';
      const formData = new FormData();
      formData.append('file', blob, `voice.${ext}`);
      const res = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onRecorded(res.data.url);
    } catch (err) {
      console.error('Voice upload failed:', err);
    }
    setUploading(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (uploading) {
    return (
      <div className="flex items-center justify-center gap-3 py-4">
        <div className="w-5 h-5 border-2 border-sage-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-warm-500 text-sm">{t('session.uploading')}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {recording ? (
        <button
          onClick={stopRecording}
          className="flex-1 flex items-center justify-center gap-3 py-3.5 bg-rose-50 text-rose-500 border border-rose-200 font-medium rounded-xl active:bg-rose-100 transition-all"
        >
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
          <span>{formatTime(seconds)} / {formatTime(MAX_SECONDS)}</span>
          <span className="text-xs opacity-60">{t('session.stopRecording')}</span>
        </button>
      ) : (
        <button
          onClick={startRecording}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white text-warm-600 border border-paper-border font-medium rounded-xl active:bg-warm-50 transition-all disabled:opacity-30"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
          {t('session.recordVoice')}
        </button>
      )}
    </div>
  );
}
