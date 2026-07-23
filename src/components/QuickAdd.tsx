import { useEffect, useState, type FormEvent } from 'react';
import type { Team, TeamId } from '../types';
import { toDateInput } from '../lib/date';

interface Props {
  teams: Team[];
  defaultTeam: TeamId;
  onAdd: (title: string, teamId: TeamId, dateStr: string) => void;
  onClose: () => void;
}

export default function QuickAdd({ teams, defaultTeam, onAdd, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [teamId, setTeamId] = useState<TeamId>(defaultTeam);
  const [date, setDate] = useState(toDateInput(new Date()));

  useEffect(() => {
    document.body.classList.add('lock');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('lock');
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), teamId, date);
  };

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="sheet sheet-compact" role="dialog" aria-modal="true" aria-label="빠른 추가">
        <header className="sheet-head">
          <h3 className="sheet-title">빠른 추가</h3>
          <button className="icon-btn" aria-label="닫기" onClick={onClose}>
            ✕
          </button>
        </header>
        <form onSubmit={submit}>
          <p className="field-label">무엇을 기억해둘까요?</p>
          <input
            className="text-input full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 은우 시험기간, 라인업 조정"
            aria-label="할 일 내용"
            autoFocus
          />
          <p className="field-label">소속 팀</p>
          <div className="team-select">
            {teams.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`filter-chip${teamId === t.id ? ' active' : ''}`}
                aria-pressed={teamId === t.id}
                onClick={() => setTeamId(t.id)}
              >
                {t.shortName}
              </button>
            ))}
          </div>
          <p className="field-label">마감일</p>
          <input
            className="date-input full"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="마감일"
          />
          <button className="btn btn-primary full submit-gap" type="submit" disabled={!title.trim()}>
            추가하기
          </button>
        </form>
      </section>
    </div>
  );
}
