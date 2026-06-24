/** ¥1,234,567 形式 */
export function yen(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}¥${Math.abs(Math.round(n)).toLocaleString('ja-JP')}`;
}

/** カンマ区切りのみ（記号なし） */
export function comma(n: number): string {
  return Math.round(n).toLocaleString('ja-JP');
}
