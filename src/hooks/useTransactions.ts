import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Transaction, InitialBalance, BalanceState } from '../types';
import { calcBalance } from '../utils/calcBalance';

const TX_KEY = 'shikin-kanri:transactions';
const BAL_KEY = 'shikin-kanri:initialBalance';
const INIT_KEY = 'shikin-kanri:initialized';

const ZERO_BALANCE: InitialBalance = {
  cash: 0,
  hokuyoBank: 0,
  shinkin: 0,
  sumishinSBI: 0,
  paypayBank: 0,
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type TransactionsApi = {
  transactions: Transaction[];
  initialBalance: InitialBalance;
  balance: BalanceState;
  isInitialized: boolean;
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  setInitialBalance: (b: InitialBalance) => void;
  exportJson: () => string;
  importJson: (json: string) => boolean;
};

export function useTransactions(): TransactionsApi {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    load<Transaction[]>(TX_KEY, [])
  );
  const [initialBalance, setInitialBalanceState] = useState<InitialBalance>(() =>
    load<InitialBalance>(BAL_KEY, ZERO_BALANCE)
  );
  const [isInitialized, setIsInitialized] = useState<boolean>(() =>
    load<boolean>(INIT_KEY, false)
  );

  useEffect(() => {
    localStorage.setItem(TX_KEY, JSON.stringify(transactions));
  }, [transactions]);
  useEffect(() => {
    localStorage.setItem(BAL_KEY, JSON.stringify(initialBalance));
  }, [initialBalance]);
  useEffect(() => {
    localStorage.setItem(INIT_KEY, JSON.stringify(isInitialized));
  }, [isInitialized]);

  const balance = useMemo(
    () => calcBalance(initialBalance, transactions),
    [initialBalance, transactions]
  );

  const addTransaction = useCallback(
    (t: Omit<Transaction, 'id' | 'createdAt'>) => {
      const tx: Transaction = { ...t, id: uuid(), createdAt: new Date().toISOString() };
      setTransactions((prev) => [tx, ...prev]);
    },
    []
  );

  const updateTransaction = useCallback((id: string, patch: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  }, []);

  const removeTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setInitialBalance = useCallback((b: InitialBalance) => {
    setInitialBalanceState(b);
    setIsInitialized(true);
  }, []);

  const exportJson = useCallback(
    () => JSON.stringify({ transactions, initialBalance }, null, 2),
    [transactions, initialBalance]
  );

  const importJson = useCallback((json: string): boolean => {
    try {
      const data = JSON.parse(json);
      if (Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (data.initialBalance) setInitialBalanceState(data.initialBalance);
      setIsInitialized(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    transactions,
    initialBalance,
    balance,
    isInitialized,
    addTransaction,
    updateTransaction,
    removeTransaction,
    setInitialBalance,
    exportJson,
    importJson,
  };
}
