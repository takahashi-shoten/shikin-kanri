import { useCallback, useEffect, useRef, useState } from 'react';

// iPhone Safari 対応のため webkitSpeechRecognition を優先
const SpeechRecognition: any =
  (typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
  null;

export type VoiceRecognition = {
  supported: boolean;
  listening: boolean;
  transcript: string; // 確定テキスト
  interim: string; // 認識途中テキスト
  start: () => void;
  stop: () => void;
  reset: () => void;
};

export function useVoiceRecognition(): VoiceRecognition {
  const supported = !!SpeechRecognition;
  const recRef = useRef<any>(null);
  // iPhone Safari は無音で勝手に停止するので、継続意思を保持して再起動する
  const wantRef = useRef(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');

  useEffect(() => {
    if (!supported) return;
    const rec = new SpeechRecognition();
    rec.lang = 'ja-JP';
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let final = '';
      let intr = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else intr += r[0].transcript;
      }
      if (final) setTranscript((prev) => prev + final);
      setInterim(intr);
    };

    rec.onerror = (e: any) => {
      // 無音エラーは無視して継続（onend で再起動される）
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      wantRef.current = false;
      setListening(false);
    };

    rec.onend = () => {
      if (wantRef.current) {
        // 継続意思があれば再起動
        try {
          rec.start();
        } catch {
          /* 連続start例外は無視 */
        }
      } else {
        setListening(false);
        setInterim('');
      }
    };

    recRef.current = rec;
    return () => {
      wantRef.current = false;
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    };
  }, [supported]);

  const start = useCallback(() => {
    if (!recRef.current) return;
    setTranscript('');
    setInterim('');
    wantRef.current = true;
    setListening(true);
    try {
      recRef.current.start();
    } catch {
      /* 既にstart済みの例外は無視 */
    }
  }, []);

  const stop = useCallback(() => {
    wantRef.current = false;
    setListening(false);
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterim('');
  }, []);

  return { supported, listening, transcript, interim, start, stop, reset };
}
