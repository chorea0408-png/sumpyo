import type { ExpenseCategory } from '../types';

export interface ExpenseCategoryMeta {
  id: ExpenseCategory;
  label: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategoryMeta[] = [
  { id: 'snack', label: '간식비' },
  { id: 'equipment', label: '장비/소모품' },
  { id: 'print', label: '인쇄/자료' },
  { id: 'etc', label: '기타' },
];

export function expenseCategoryLabel(category: ExpenseCategory): string {
  return EXPENSE_CATEGORIES.find((c) => c.id === category)?.label ?? category;
}
