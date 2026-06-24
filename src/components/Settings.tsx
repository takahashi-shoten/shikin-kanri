import { useEffect, useRef, useState } from 'react';
import type { InitialBalance, Transaction } from '../types';
import { BALANCE_LABELS, BANK_KEY } from '../types';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { parseBalanceInput } from '../utils/parseVoiceInput';
import { exportCsv, download } from '../utils/exportCsv';
import { comma } from '../utils/format';

type Props = {
  initialBalance: InitialBalance;
  transactions: Transaction[];
  onSaveBalance: (b: InitialBalance) => void;
  exportJson: () => string;
  importJson: (json: string) => boolean;
  firstRun?: boolean;
};

type Form = Record<keyof InitialBalance, string>;

function toForm(b: InitialBalance): Form {
  return {
    cash: String(b.cash || ''),
    hokuyoBank: String(b.hokuyoBank || ''),
    shinkin: String(b.shinkin || ''),
    sumishinSBI: String(b.sumishinSBI || ''),
    paypayBank: String(b.paypayBank || ''),
  };
}

export function Settings({
  initialBalance,
  transactions,
  onSaveBalance,
  exportJson,
  importJson,
  firstRun,
}: Props) {
  const [form, setForm] = useState<Form>(() => toForm(initialBalance));
  const [saved, setSaved] = useState(false);
  const voice = useVoiceRecognition();
  const activeField = useRef<keyof InitialBalance | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 音声確定時：銀行名が取れればその欄、なければアクティブ欄へ
  useEffect(() => {
    if (!voice.transcript) return;
    const { bankName, amount } = parseBalanceInput(voice.transcript);
    if (amount == null) return;
    const key: keyof InitialBalance | null = bankName
      ? BANK_KEY[bankName]
      : activeField.current;
    if (!key) return;
    setForm((f) => ({ ...f, [key]: String(amount) }));
  }, [voice.transcript]);

  const micFor = (key: keyof InitialBalance) => {
    if (voice.listening) {
      voice.stop();
      return;
    }
    activeField.current = key;
    voice.start();
  };

  const save = () => {
    onSaveBalance({
      cash: Number(form.cash) || 0,
      hokuyoBank: Number(form.hokuyoBank) || 0,
      shinkin: Number(form.shinkin) || 0,
      sumishinSBI: Number(form.sumishinSBI) || 0,
      paypayBank: Number(form.paypayBank) || 0,
    });
    setSaved(true);
  };

  const doImport = async (file: File) => {
    const text = await file.text();
    if (!confirm('現在のデータを上書きします。よろしいですか？')) return;
    if (importJson(text)) {
      setForm(toForm(JSON.parse(text).initialBalance ?? initialBalance));
      alert('インポートしました');
    } else {
      alert('ファイルの読み込みに失敗しました');
    }
  };

  const doExportJson = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    download(blob, `shikin-kanri_backup_${stamp}.json`);
  };

  return (
    <div>
      {firstRun && (
        <div className="banner">
          👋 はじめに、今の手元現金と各銀行の残高を入力してください。
          🎤ボタンで「325万円」のように話しても入力できます。
        </div>
      )}

      <div className="card">
        <div className="card-title">初期残高設定</div>
        {BALANCE_LABELS.map(({ key, label }) => (
          <label className="field" key={key}>
            <span>{label}</span>
            <div className="row" style={{ alignItems: 'stretch' }}>
              <input
                type="number"
                inputMode="numeric"
                value={form[key]}
                placeholder="0"
                onChange={(e) => {
                  setForm((f) => ({ ...f, [key]: e.target.value }));
                  setSaved(false);
                }}
              />
              <button
                type="button"
                className={`mic-mini ${
                  voice.listening && activeField.current === key ? 'listening' : ''
                }`}
                onClick={() => micFor(key)}
                disabled={!voice.supported}
                title="音声入力"
              >
                🎤
              </button>
            </div>
          </label>
        ))}
        <button className="btn btn-primary" onClick={save}>
          残高を保存する
        </button>
        {saved && <div className="banner" style={{ marginTop: 12 }}>✅ 保存しました</div>}
      </div>

      <div className="card">
        <div className="card-title">データ管理</div>
        <button className="btn btn-sub" onClick={() => exportCsv(transactions)}>
          CSVエクスポート（Excel用）
        </button>
        <div style={{ height: 10 }} />
        <button className="btn btn-sub" onClick={doExportJson}>
          JSONバックアップ（全データ）
        </button>
        <div style={{ height: 10 }} />
        <button className="btn btn-sub" onClick={() => fileRef.current?.click()}>
          JSONインポート（復元）
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) doImport(f);
            e.target.value = '';
          }}
        />
        <p className="muted" style={{ marginTop: 12 }}>
          記録件数：{transactions.length}件 ／ 初期資金合計：
          {comma(
            Object.values(initialBalance).reduce((a, b) => a + b, 0)
          )}
          円
        </p>
      </div>
    </div>
  );
}
