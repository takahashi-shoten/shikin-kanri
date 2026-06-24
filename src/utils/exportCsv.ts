import Encoding from 'encoding-japanese';
import type { Transaction } from '../types';

/**
 * CSV を Shift-JIS（Excelで直接開ける）でダウンロードする。
 * ヘッダー：日付,区分,金額,メモ / 金額はカンマなしの数値
 */
export function exportCsv(transactions: Transaction[]): void {
  const header = ['日付', '区分', '金額', 'メモ'];
  const rows = transactions
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => {
      const signed = t.direction === 'out' && t.category !== '銀行引出'
        ? -t.amount
        : t.amount;
      return [t.date, t.category, String(signed), csvEscape(t.memo)];
    });

  const csv = [header, ...rows].map((r) => r.join(',')).join('\r\n');

  // Unicode → Shift-JIS
  const sjis = Encoding.convert(Encoding.stringToCode(csv), {
    to: 'SJIS',
    from: 'UNICODE',
  });
  const blob = new Blob([new Uint8Array(sjis)], { type: 'text/csv' });
  download(blob, `shikin-kanri_${todayStamp()}.csv`);
}

function csvEscape(s: string): string {
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function todayStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

export function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
