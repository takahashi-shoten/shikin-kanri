import type { Category, BankName, Direction } from '../types';

export type ParsedInput = {
  date: string; // YYYY-MM-DD
  category: Category;
  amount: number;
  direction: Direction;
  bankName?: BankName;
  memo: string;
};

// ===== 共通ヘルパ =====
function pad(n: number): string {
  return String(n).padStart(2, '0');
}
function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 全角数字→半角、カンマ除去 */
function normalize(s: string): string {
  return s
    .replace(/[，,]/g, '')
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .trim();
}

// ===== 日付解析 =====
function parseDate(
  text: string,
  today: Date
): { date: string; rest: string } {
  let rest = text;
  let date = toISO(today);

  if (/一昨日|おととい|オトトイ/.test(rest)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 2);
    date = toISO(d);
    rest = rest.replace(/一昨日|おととい|オトトイ/, '');
  } else if (/昨日|きのう|キノウ/.test(rest)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    date = toISO(d);
    rest = rest.replace(/昨日|きのう|キノウ/, '');
  } else if (/今日|きょう|キョウ|本日/.test(rest)) {
    rest = rest.replace(/今日|きょう|キョウ|本日/, '');
  }

  // 〇月〇日（当年）
  const m = rest.match(/(\d{1,2})月(\d{1,2})日/);
  if (m) {
    date = `${today.getFullYear()}-${pad(Number(m[1]))}-${pad(Number(m[2]))}`;
    rest = rest.replace(m[0], '');
  }

  return { date, rest };
}

// ===== 金額解析（日本語→数値） =====
const KANJI: Record<string, number> = {
  '〇': 0, 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};
const SMALL: Record<string, number> = { 十: 10, 百: 100, 千: 1000 };
const BIG: Record<string, number> = { 万: 10000, 億: 100000000 };

/** 「3万5千」「百五十万」「12500」などを数値へ */
function jpToInt(s: string): number | null {
  let total = 0;
  let section = 0;
  let current = 0;
  let has = false;

  for (const ch of s) {
    if (/[0-9]/.test(ch)) {
      current = current * 10 + Number(ch);
      has = true;
    } else if (ch in KANJI) {
      current = current * 10 + KANJI[ch];
      has = true;
    } else if (ch in SMALL) {
      const v = current === 0 ? 1 : current;
      section += v * SMALL[ch];
      current = 0;
      has = true;
    } else if (ch in BIG) {
      section += current;
      total += section * BIG[ch];
      section = 0;
      current = 0;
      has = true;
    }
  }
  if (!has) return null;
  return total + section + current;
}

function parseAmount(text: string): number | null {
  const re = /[0-9〇零一二三四五六七八九十百千万億]+/g;
  const cands: { val: number; beforeEn: boolean }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const val = jpToInt(m[0]);
    if (val == null || val === 0) continue;
    const after = text.slice(m.index + m[0].length);
    cands.push({ val, beforeEn: /^円/.test(after) });
  }
  if (cands.length === 0) return null;
  // 「〇〇円」と直後に円が付く候補を最優先、なければ最大値
  const en = cands.find((c) => c.beforeEn);
  if (en) return en.val;
  return cands.reduce((a, b) => (b.val > a.val ? b : a)).val;
}

// ===== 銀行名解析 =====
const BANK_PATTERNS: [RegExp, BankName][] = [
  [/北洋|ほくよう|ホクヨウ/, '北洋銀行'],
  [/旭川信用金庫|旭川信金|信用金庫|信金|しんきん|シンキン/, '旭川信用金庫'],
  [/住信SBI|住信|スミシン|すみしん|ＳＢＩ|SBI/i, '住信SBIネット銀行'],
  [/PayPay|ペイペイ|ぺいぺい/i, 'PayPay銀行'],
];

function parseBank(text: string): BankName | undefined {
  for (const [re, name] of BANK_PATTERNS) if (re.test(text)) return name;
  return undefined;
}

// ===== 区分・方向解析 =====
const WITHDRAW = /下ろした|おろした|降ろした|引き出した|引出|引き出し/;
const BANK_DEPOSIT = /振り込まれた|振込|振り込み|入金された/;

const CAT_PATTERNS: [RegExp, Category][] = [
  [/材料|ホーマック|建材|コメリ|資材/, '材料費'],
  [/外注|手間|応援/, '外注費'],
  [/ガソリン|燃料|軽油|灯油|給油/, '燃料代'],
  [/生活費|家に入れた|家族に/, '生活費'],
  [/消耗品|軍手|マスク|テープ/, '消耗品費'],
  [/工具|道具/, '工具代'],
  [/駐車場|パーキング|コインパーキング/, '駐車場代'],
  [/高速|ＥＴＣ|ETC|道路代/, '高速代'],
];

function parseCategoryDirection(
  text: string,
  bank: BankName | undefined
): { category: Category; direction: Direction } {
  // 銀行引出（銀行名 + 引出キーワード）
  if (bank && WITHDRAW.test(text)) return { category: '銀行引出', direction: 'out' };
  // 銀行入金（銀行名 + 入金キーワード）
  if (bank && BANK_DEPOSIT.test(text)) return { category: '銀行入金', direction: 'in' };

  // 支出区分
  for (const [re, cat] of CAT_PATTERNS) {
    if (re.test(text)) return { category: cat, direction: 'out' };
  }

  // 「〇〇さんに払った」→ 外注費
  if (/さん/.test(text) && /(払った|渡した|支払|払い)/.test(text)) {
    return { category: '外注費', direction: 'out' };
  }

  // 売上入金（銀行名なし）
  if (/売上|請求|もらった|頂いた|いただいた/.test(text)) {
    return { category: '売上入金', direction: 'in' };
  }

  // 方向ワードでフォールバック
  if (/入った|入金|振り込まれた/.test(text)) {
    return { category: 'その他', direction: 'in' };
  }
  return { category: 'その他', direction: 'out' };
}

// ===== メモ自動抽出 =====
const STORE_NAMES = ['ホーマック', 'コメリ', 'カインズ', 'コーナン', 'ホクレン', 'エネオス'];

function extractMemo(text: string, bank: BankName | undefined): string {
  const parts: string[] = [];
  if (bank) parts.push(bank);

  const persons = text.match(/[一-龥ぁ-んァ-ヶー゠-ヿA-Za-z]+さん/g);
  if (persons) parts.push(...persons);

  for (const s of STORE_NAMES) if (text.includes(s)) parts.push(s);

  return Array.from(new Set(parts)).join(' ');
}

// ===== メイン =====
export function parseVoiceInput(raw: string, today: Date = new Date()): ParsedInput {
  const text = normalize(raw);
  const { date, rest } = parseDate(text, today);
  const bank = parseBank(rest);
  const amount = parseAmount(rest) ?? 0;
  const { category, direction } = parseCategoryDirection(rest, bank);
  const memo = extractMemo(rest, bank);

  // bankName は銀行引出・入金のときのみ保持
  const bankName =
    category === '銀行引出' || category === '銀行入金' ? bank : undefined;

  return { date, category, amount, direction, bankName, memo };
}

/** 設定画面の残高音声入力用：銀行名 + 金額のみ抽出 */
export function parseBalanceInput(
  raw: string
): { bankName?: BankName; amount: number | null } {
  const text = normalize(raw);
  return { bankName: parseBank(text), amount: parseAmount(text) };
}
