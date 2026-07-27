import type { ProjectExpenseCategory } from '../types';

export interface ProjectExpenseCategoryMeta {
  id: ProjectExpenseCategory;
  label: string;
}

export const PROJECT_EXPENSE_CATEGORIES: ProjectExpenseCategoryMeta[] = [
  { id: 'lodging', label: '숙소비' },
  { id: 'transport', label: '교통비' },
  { id: 'meal', label: '식비' },
  { id: 'speaker', label: '강사비' },
  { id: 'etc', label: '기타' },
];

export function projectExpenseCategoryLabel(category: ProjectExpenseCategory): string {
  return PROJECT_EXPENSE_CATEGORIES.find((c) => c.id === category)?.label ?? category;
}
