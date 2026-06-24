import type { Transaction, InitialBalance, BalanceState } from '../types';
import { BANK_KEY } from '../types';

/**
 * 残高は「初期残高 + 取引履歴の累積」で常に再計算する。
 *
 *   各銀行残高 = 初期残高 + Σ(その銀行への入金) - Σ(その銀行からの引出)
 *   手元現金   = 初期現金 + Σ(銀行引出) - Σ(現金支出) + Σ(現金売上入金)
 */
export function calcBalance(
  initial: InitialBalance,
  transactions: Transaction[]
): BalanceState {
  const b: BalanceState = { ...initial };

  for (const t of transactions) {
    if (t.category === '銀行引出') {
      // 銀行 → 手元現金
      if (t.bankName) b[BANK_KEY[t.bankName]] -= t.amount;
      b.cash += t.amount;
    } else if (t.category === '銀行入金') {
      // 銀行残高のみ増加（手元現金は変わらない）
      if (t.bankName) b[BANK_KEY[t.bankName]] += t.amount;
    } else {
      // 現金ベースの取引
      if (t.direction === 'in') b.cash += t.amount;
      else b.cash -= t.amount;
    }
  }

  return b;
}

/** 事業資金合計（手元現金 + 全銀行残高） */
export function totalFunds(b: BalanceState): number {
  return b.cash + b.hokuyoBank + b.shinkin + b.sumishinSBI + b.paypayBank;
}
