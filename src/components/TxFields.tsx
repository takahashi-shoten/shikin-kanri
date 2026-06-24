import type { Category, BankName, Direction } from '../types';
import { CATEGORIES, BANKS } from '../types';

export type Draft = {
  date: string;
  category: Category;
  amount: string; // 入力中は文字列で保持
  direction: Direction;
  bankName?: BankName;
  memo: string;
};

/** 区分から方向を導出（その他は呼び出し側で切替可能） */
export function directionOf(cat: Category): Direction {
  return cat === '銀行入金' || cat === '売上入金' ? 'in' : 'out';
}

export function isBankCategory(cat: Category): boolean {
  return cat === '銀行引出' || cat === '銀行入金';
}

type Props = {
  draft: Draft;
  onChange: (d: Draft) => void;
};

export function TxFields({ draft, onChange }: Props) {
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });

  const onCategory = (category: Category) => {
    set({
      category,
      direction: directionOf(category),
      bankName: isBankCategory(category) ? draft.bankName ?? BANKS[0] : undefined,
    });
  };

  return (
    <>
      <label className="field">
        <span>日付</span>
        <input
          type="date"
          value={draft.date}
          onChange={(e) => set({ date: e.target.value })}
        />
      </label>

      <label className="field">
        <span>区分</span>
        <select
          value={draft.category}
          onChange={(e) => onCategory(e.target.value as Category)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      {isBankCategory(draft.category) && (
        <label className="field">
          <span>銀行</span>
          <select
            value={draft.bankName ?? BANKS[0]}
            onChange={(e) => set({ bankName: e.target.value as BankName })}
          >
            {BANKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="field">
        <span>金額（円）</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={draft.amount}
          onChange={(e) => set({ amount: e.target.value })}
        />
      </label>

      {draft.category === 'その他' && (
        <label className="field">
          <span>入金 / 支出</span>
          <select
            value={draft.direction}
            onChange={(e) => set({ direction: e.target.value as Direction })}
          >
            <option value="out">支出</option>
            <option value="in">入金</option>
          </select>
        </label>
      )}

      <label className="field">
        <span>メモ</span>
        <textarea
          value={draft.memo}
          onChange={(e) => set({ memo: e.target.value })}
          placeholder="店名・内容など"
        />
      </label>
    </>
  );
}
