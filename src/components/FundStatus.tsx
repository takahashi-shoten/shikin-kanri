import type { BalanceState, Transaction } from '../types';
import { BALANCE_LABELS } from '../types';
import { totalFunds } from '../utils/calcBalance';
import { yen } from '../utils/format';

type Props = {
  balance: BalanceState;
  transactions: Transaction[];
};

export function FundStatus({ balance, transactions }: Props) {
  const total = totalFunds(balance);

  const recentWithdraws = transactions
    .filter((t) => t.category === '銀行引出')
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div>
      <div className="card">
        <div className="card-title">現在の資金</div>
        {BALANCE_LABELS.map(({ key, label }) => (
          <div className="sum-row" key={key}>
            <span>{label}</span>
            <span className="amount-big" style={{ fontSize: 17 }}>
              {yen(balance[key])}
            </span>
          </div>
        ))}
        <div className="fund-total">
          <div className="muted">事業資金合計</div>
          <div className="amt">{yen(total)}</div>
        </div>
      </div>

      {recentWithdraws.length > 0 && (
        <div className="card">
          <div className="card-title">直近の銀行引出</div>
          {recentWithdraws.map((t) => (
            <div className="flow" key={t.id}>
              <span>{t.bankName ?? '銀行'}</span>
              <span className="arrow">→ 手元現金</span>
              <span style={{ marginLeft: 'auto' }} className="amount-big" >
                {yen(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
