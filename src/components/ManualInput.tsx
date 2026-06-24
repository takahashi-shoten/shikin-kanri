import { useState } from 'react';
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

export function ManualInput({ onSave }: Props) {
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saved, setSaved] = useState(false);

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
    setSaved(true);
  };

  return (
    <div>
      <div className="banner">音声入力がうまくいかないときはこちらで手入力できます。</div>
      {saved && <div className="banner">✅ 保存しました</div>}
      <div className="card">
        <TxFields draft={draft} onChange={(d) => { setDraft(d); setSaved(false); }} />
      </div>
      <button className="btn btn-primary" onClick={save}>
        保存する
      </button>
    </div>
  );
}
