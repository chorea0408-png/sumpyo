import { useMemo, useState } from 'react';
import type { Expense, ExpenseCategory, TeamId } from '../types';
import { EXPENSE_CATEGORIES, expenseCategoryLabel } from '../data/expenseCategories';
import { fmtDateShort, toDateInput } from '../lib/date';

interface Props {
  teamId: TeamId;
  expenses: Expense[];
  onAdd: (date: string, category: ExpenseCategory, title: string, amount: number) => void;
  onRemove: (id: string) => void;
}

export default function ExpenseTracker({ teamId, expenses, onAdd, onRemove }: Props) {
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState(() => toDateInput(new Date()));
  const [category, setCategory] = useState<ExpenseCategory>('snack');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  const own = useMemo(
    () =>
      expenses
        .filter((e) => e.teamId === teamId)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [expenses, teamId],
  );
  const total = useMemo(() => own.reduce((sum, e) => sum + e.amount, 0), [own]);

  const submit = () => {
    const amt = Number(amount);
    if (!title.trim() || !Number.isFinite(amt) || amt <= 0) return;
    onAdd(date, category, title.trim(), Math.round(amt));
    setDate(toDateInput(new Date()));
    setCategory('snack');
    setTitle('');
    setAmount('');
    setAdding(false);
  };

  const remove = (id: string, itemTitle: string) => {
    if (!window.confirm(`"${itemTitle}" 지출 기록을 삭제할까요?`)) return;
    onRemove(id);
  };

  return (
    <div className="expense-tracker">
      {own.length === 0 ? (
        <p className="hint">아직 기록된 지출이 없어요</p>
      ) : (
        <>
          <p className="expense-total">누적 지출: {total.toLocaleString('ko-KR')}원</p>
          <ul className="expense-list">
            {own.map((e) => (
              <li key={e.id} className="expense-row">
                <span className="expense-date">{fmtDateShort(new Date(`${e.date}T00:00:00`))}</span>
                <span className="expense-category">{expenseCategoryLabel(e.category)}</span>
                <span className="expense-title">{e.title}</span>
                <span className="expense-amount">{e.amount.toLocaleString('ko-KR')}원</span>
                <button
                  type="button"
                  className="tmpl-remove"
                  aria-label={`${e.title} 삭제`}
                  onClick={() => remove(e.id, e.title)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {adding ? (
        <div className="template-add-card">
          <input
            className="date-input full"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="지출 날짜"
          />
          <select
            className="date-input full"
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            aria-label="지출 카테고리"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            className="text-input full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 간식 구입"
            aria-label="지출 항목"
          />
          <input
            className="text-input full"
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="예) 35000"
            aria-label="지출 금액 (원)"
          />
          <div className="template-add-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>
              취소
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={submit}
              disabled={!title.trim() || !amount}
            >
              추가하기
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="tmpl-add-toggle" onClick={() => setAdding(true)}>
          ＋ 지출 추가
        </button>
      )}
    </div>
  );
}
