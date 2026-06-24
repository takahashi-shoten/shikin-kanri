import { useMemo, useState } from 'react';
import type { Transaction, Category } from '../types';
import { EXPENSE_CATEGORIES } from '../types';
import { yen } from '../utils/format';

type Props = {
  transactions: Transaction[];
};

export function Summary({ transactions }: Props) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const ym = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}`;

  const move = (delta: number) => {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const agg = useMemo(() => {
    const list = transactions.filter((t) => t.date.startsWith(ym));
    const expense: Record<string, number> = {};
    let expenseTotal = 0;
    let withdraw = 0;
    let sales = 0;
    for (const t of list) {
      if (EXPENSE_CATEGORIES.includes(t.category)) {
        expense[t.category] = (expense[t.category] ?? 0) + t.amount;
        expenseTotal += t.amount;
      } else if (t.category === '銀行引出') {
        withdraw += t.amount;
      } else if (t.category === '売上入金') {
        sales += t.amount;
      }
    }
    return { expense, expenseTotal, withdraw, sales };
  }, [transactions, ym]);

  return (
    <div>
      <div className="month-nav">
        <button onClick={() => move(-1)}>← 前月</button>
        <span className="label">
          {cursor.y}年{cursor.m + 1}月
        </span>
        <button onClick={() => move(1)}>次月 →</button>
      </div>

      <div className="card">
        <div className="card-title">支出内訳</div>
        {EXPENSE_CATEGORIES.map((c: Category) => (
          <div className="sum-row" key={c}>
            <span>{c}</span>
            <span className="out">{yen(agg.expense[c] ?? 0)}</span>
          </div>
        ))}
        <div className="sum-row total">
          <span>支出合計</span>
          <span className="out">{yen(agg.expenseTotal)}</span>
        </div>
      </div>

      <div className="card">
        <div className="card-title">入出金</div>
        <div className="sum-row">
          <span>銀行引出合計</span>
          <span>{yen(agg.withdraw)}</span>
        </div>
        <div className="sum-row">
          <span>売上入金合計</span>
          <span className="in">{yen(agg.sales)}</span>
        </div>
      </div>
    </div>
  );
}
