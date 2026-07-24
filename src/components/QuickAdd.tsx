import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Team, TeamId } from '../types';
import { toDateInput } from '../lib/date';

interface Props {
  teams: Team[];
  defaultTeam: TeamId;
  onAdd: (title: string, teamId: TeamId, dateStr: string, memberId?: string) => void;
  onClose: () => void;
}

export default function QuickAdd({ teams, defaultTeam, onAdd, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [teamId, setTeamId] = useState<TeamId>(defaultTeam);
  const [date, setDate] = useState(toDateInput(new Date()));
  const [memberId, setMemberId] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const members = teams.find((t) => t.id === teamId)?.members ?? [];

  useEffect(() => {
    document.body.classList.add('lock');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // 시트 등장 애니메이션이 끝난 뒤 포커스 — autoFocus를 쓰면 애니메이션과
    // 키보드 팝업이 겹쳐 iOS에서 화면이 과도하게 확대되고 스크롤이 꼬인다.
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 200);
    return () => {
      document.body.classList.remove('lock');
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(focusTimer);
    };
  }, [onClose]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), teamId, date, memberId || undefined);
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
            ref={inputRef}
            className="text-input full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 콘티 선정, 팀 공지 보내기"
            aria-label="할 일 내용"
          />
          <p className="field-label">소속 팀</p>
          <div className="team-select">
            {teams.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`filter-chip${teamId === t.id ? ' active' : ''}`}
                aria-pressed={teamId === t.id}
                onClick={() => {
                  setTeamId(t.id);
                  setMemberId('');
                }}
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
          {members.length > 0 && (
            <>
              <p className="field-label">관련 팀원 (선택)</p>
              <select
                className="date-input full"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                aria-label="관련 팀원"
              >
                <option value="">선택 안 함</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </>
          )}
          <button className="btn btn-primary full submit-gap" type="submit" disabled={!title.trim()}>
            추가하기
          </button>
        </form>
      </section>
    </div>
  );
}
