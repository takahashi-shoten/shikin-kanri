// ===== 取引記録 =====
export type Direction = 'in' | 'out';

export type Category =
  | '銀行引出'
  | '銀行入金'
  | '売上入金'
  | '材料費'
  | '外注費'
  | '燃料代'
  | '生活費'
  | '消耗品費'
  | '工具代'
  | '駐車場代'
  | '高速代'
  | 'その他';

export type BankName =
  | '北洋銀行'
  | '旭川信用金庫'
  | '住信SBIネット銀行'
  | 'PayPay銀行';

export type Transaction = {
  id: string; // UUID
  date: string; // YYYY-MM-DD
  category: Category;
  amount: number; // 金額（正の数）
  direction: Direction; // 入金 / 支出
  bankName?: BankName; // 銀行引出・入金時のみ
  memo: string;
  createdAt: string; // ISO8601
};

// ===== 初期残高 / 資金残高 =====
export type InitialBalance = {
  cash: number; // 手元現金
  hokuyoBank: number; // 北洋銀行
  shinkin: number; // 旭川信用金庫
  sumishinSBI: number; // 住信SBIネット銀行
  paypayBank: number; // PayPay銀行
};

export type BalanceState = InitialBalance;

// ===== 定数 =====
export const CATEGORIES: Category[] = [
  '銀行引出',
  '銀行入金',
  '売上入金',
  '材料費',
  '外注費',
  '燃料代',
  '生活費',
  '消耗品費',
  '工具代',
  '駐車場代',
  '高速代',
  'その他',
];

// 支出として集計する区分
export const EXPENSE_CATEGORIES: Category[] = [
  '材料費',
  '外注費',
  '燃料代',
  '生活費',
  '消耗品費',
  '工具代',
  '駐車場代',
  '高速代',
  'その他',
];

export const BANKS: BankName[] = [
  '北洋銀行',
  '旭川信用金庫',
  '住信SBIネット銀行',
  'PayPay銀行',
];

// 銀行名 → 残高キー
export const BANK_KEY: Record<BankName, keyof InitialBalance> = {
  北洋銀行: 'hokuyoBank',
  旭川信用金庫: 'shinkin',
  住信SBIネット銀行: 'sumishinSBI',
  PayPay銀行: 'paypayBank',
};

// 残高キー → 表示ラベル（手元現金 + 各銀行）
export const BALANCE_LABELS: { key: keyof InitialBalance; label: string }[] = [
  { key: 'cash', label: '手元現金' },
  { key: 'hokuyoBank', label: '北洋銀行' },
  { key: 'shinkin', label: '旭川信用金庫' },
  { key: 'sumishinSBI', label: '住信SBIネット銀行' },
  { key: 'paypayBank', label: 'PayPay銀行' },
];
