import { useEffect, useState } from 'react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { parseVoiceInput } from '../utils/parseVoiceInput';
import { TxFields } from '../components/TxFields';
import type { Draft } from '../components/TxFields';
import type { Transaction } from '../types';

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function emptyDraft(): Draft {
  return {
    date: todayISO(),
    category: '材料費',
    amount: '',
    direction: 'out',
    bankName: undefined,
    memo: '',
  };
}

type Props = {
  onSave: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
};

export function VoiceInput({ onSave }: Props) {
  const voice = useVoiceRecognition();
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [parsed, setParsed] = useState(false);
  const [saved, setSaved] = useState(false);

  // 確定テキストが来たら解析してフォームに反映
  useEffect(() => {
    if (!voice.transcript) return;
    const p = parseVoiceInput(voice.transcript);
    setDraft({
      date: p.date,
      category: p.category,
      amount: p.amount ? String(p.amount) : '',
      direction: p.direction,
      bankName: p.bankName,
      memo: p.memo,
    });
    setParsed(true);
  }, [voice.transcript]);

  const toggleMic = () => {
    setSaved(false);
    if (voice.listening) voice.stop();
    else {
      setParsed(false);
      voice.start();
    }
  };

  const save = () => {
    const amount = Number(draft.amount);
    if (!amount || amount <= 0) {
      alert('金額を入力してください');
      return;
    }
    onSave({
      date: draft.date,
      category: draft.category,
      amount,
      direction: draft.direction,
      bankName: draft.bankName,
      memo: draft.memo,
    });
    setDraft(emptyDraft());
    setParsed(false);
    setSaved(true);
  };

  return (
    <div className="voice-screen">
      {!voice.supported && (
        <div className="banner">
          ⚠️ この端末/ブラウザは音声入力に対応していません。「手入力」をお使いください。
          （音声入力はHTTPS環境のSafari/Chromeで動作します）
        </div>
      )}

      <button
        className={`mic-btn ${voice.listening ? 'listening' : ''}`}
        onClick={toggleMic}
        disabled={!voice.supported}
      >
        <svg
          className="mic-ico"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="2" width="6" height="11" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
        {voice.listening ? '聞いています…' : '話して入力'}
      </button>

      <div className="transcript">
        {voice.transcript}
        <span className="interim">{voice.interim}</span>
        {!voice.transcript && !voice.interim && (
          <span className="muted">
            例：「ホーマックで材料費1万2500円」「北洋銀行から10万円下ろした」
          </span>
        )}
      </div>

      {saved && <div className="banner">✅ 保存しました</div>}

      {parsed && (
        <div className="card" style={{ width: '100%' }}>
          <div className="card-title">解析結果（保存前に修正できます）</div>
          <TxFields draft={draft} onChange={setDraft} />
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={save}
        disabled={!parsed && !draft.amount}
      >
        保存する
      </button>
    </div>
  );
}
