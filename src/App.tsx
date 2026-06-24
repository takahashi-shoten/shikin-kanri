import { useState } from 'react';
import { BottomNav } from './components/BottomNav';
import type { Screen } from './components/BottomNav';
import { VoiceInput } from './components/VoiceInput';
import { ManualInput } from './components/ManualInput';
import { TransactionList } from './components/TransactionList';
import { Summary } from './components/Summary';
import { FundStatus } from './components/FundStatus';
import { Settings } from './components/Settings';
import { useTransactions } from './hooks/useTransactions';
import { totalFunds } from './utils/calcBalance';
import { yen } from './utils/format';

const TITLES: Record<Screen, string> = {
  voice: '音声入力',
  manual: '手入力',
  list: '記録一覧',
  summary: '集計',
  fund: '資金状況',
  settings: '設定',
};

export default function App() {
  const api = useTransactions();
  // 初回起動なら設定画面から開始
  const [screen, setScreen] = useState<Screen>(api.isInitialized ? 'voice' : 'settings');

  return (
    <div className="app">
      <header className="header">
        <h1>高橋商店 資金管理 ／ {TITLES[screen]}</h1>
        <div className="total">
          事業資金
          <strong>{yen(totalFunds(api.balance))}</strong>
        </div>
      </header>

      <main className="main">
        {screen === 'voice' && <VoiceInput onSave={api.addTransaction} />}
        {screen === 'manual' && <ManualInput onSave={api.addTransaction} />}
        {screen === 'list' && (
          <TransactionList
            transactions={api.transactions}
            onUpdate={api.updateTransaction}
            onRemove={api.removeTransaction}
          />
        )}
        {screen === 'summary' && <Summary transactions={api.transactions} />}
        {screen === 'fund' && (
          <FundStatus balance={api.balance} transactions={api.transactions} />
        )}
        {screen === 'settings' && (
          <Settings
            initialBalance={api.initialBalance}
            transactions={api.transactions}
            onSaveBalance={api.setInitialBalance}
            exportJson={api.exportJson}
            importJson={api.importJson}
            firstRun={!api.isInitialized}
          />
        )}
      </main>

      <BottomNav current={screen} onChange={setScreen} />
    </div>
  );
}
