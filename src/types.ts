export interface UserStats {
  totalBalance: number;
  totalDebt: number;
  totalLent: number;
  updatedAt: string;
}

export interface Fund {
  id: string;
  name: string;
  balance: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export type DebtType = 'borrowed' | 'lent';

export interface Debt {
  id: string;
  contactName: string;
  type: DebtType;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'income' | 'expense' | 'debt_increase' | 'debt_decrease' | 'lend_increase' | 'lend_decrease';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  isCustom?: boolean;
}

export interface TransactionTemplate {
  id: string;
  name: string;
  amount?: number;
  categoryId: string;
  type: TransactionType;
  description: string;
  fundId?: string;
  createdAt: any;
}

export interface UserCategoryMapping {
  id: string;
  keyword: string;
  categoryId: string;
  count: number;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  categoryId?: string;
  contact?: string;
  fundId?: string;
  debtId?: string;
  date: string;
  createdAt: any; // Firestore timestamp
}
