import { useMemo, useState } from 'react';
import type { Transaction } from '../types';
import { yen } from '../utils/format';
import { TxFields } from '../components/TxFields';
import type { Draft } from '../components/TxFields';

type Props = {
  transactions: Transaction[];
  onUpdate: (id: string, patch: Partial<Transaction>) => void;
  onRemove: (id: string) => void;
};

export function TransactionList({ transactions, onUpdate, onRemove }: Props) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() }; // m: 0-11
  });
  const [editing, setEditing] = useState<Transaction | null>(null);

  const ym = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}`;

  const list = useMemo(
    () =>
      transactions
        .filter((t) => t.date.startsWith(ym))
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [transactions, ym]
  );

  const move = (delta: number) => {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };
  const goCurrent = () => {
    const d = new Date();
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  const signed = (t: Transaction) =>
    t.direction === 'out' && t.category !== '銀行引出' ? -t.amount : t.amount;

  return (
    <div>
      <div className="month-nav">
        <button onClick={() => move(-1)}>← 前月</button>
        <span className="label" onClick={goCurrent}>
          {cursor.y}年{cursor.m + 1}月
        </span>
        <button onClick={() => move(1)}>次月 →</button>
      </div>

      {list.length === 0 && <div className="muted" style={{ textAlign: 'center', padding: 30 }}>記録がありません</div>}

      {list.map((t) => {
        const v = signed(t);
        return (
          <div key={t.id} className="tx" onClick={() => setEditing(t)}>
            <div className="tx-main">
              <div className="tx-cat">{t.category}</div>
              <div className="tx-sub">
                {t.date.slice(5).replace('-', '/')}
                {t.bankName ? ` ・${t.bankName}` : ''}
                {t.memo ? ` ・${t.memo}` : ''}
              </div>
            </div>
            <div className={`tx-amt ${v >= 0 ? 'in' : 'out'}`}>
              {v >= 0 ? '+' : ''}
              {yen(v)}
            </div>
          </div>
        );
      })}

      {editing && (
        <EditModal
          tx={editing}
          onClose={() => setEditing(null)}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      )}
    </div>
  );
}

function EditModal({
  tx,
  onClose,
  onUpdate,
  onRemove,
}: {
  tx: Transaction;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Transaction>) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>({
    date: tx.date,
    category: tx.category,
    amount: String(tx.amount),
    direction: tx.direction,
    bankName: tx.bankName,
    memo: tx.memo,
  });
  const [confirmDel, setConfirmDel] = useState(false);

  const save = () => {
    const amount = Number(draft.amount);
    if (!amount || amount <= 0) {
      alert('金額を入力してください');
      return;
    }
    onUpdate(tx.id, {
      date: draft.date,
      category: draft.category,
      amount,
      direction: draft.direction,
      bankName: draft.bankName,
      memo: draft.memo,
    });
    onClose();
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {!confirmDel ? (
          <>
            <h3>記録を編集</h3>
            <TxFields draft={draft} onChange={setDraft} />
            <button className="btn btn-primary" onClick={save}>
              保存する
            </button>
            <div style={{ height: 10 }} />
            <div className="row">
              <button className="btn btn-sub" onClick={onClose}>
                キャンセル
              </button>
              <button className="btn btn-danger" onClick={() => setConfirmDel(true)}>
                削除
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>削除しますか？</h3>
            <p className="muted" style={{ marginBottom: 16 }}>
              {tx.date} / {tx.category} / {yen(tx.amount)}
              <br />
              この操作は取り消せません。
            </p>
            <div className="row">
              <button className="btn btn-sub" onClick={() => setConfirmDel(false)}>
                やめる
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  onRemove(tx.id);
                  onClose();
                }}
              >
                削除する
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
