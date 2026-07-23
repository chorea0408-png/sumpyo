import { useEffect, useState, type FormEvent } from 'react';
import type { Task, Team, TeamId } from '../types';
import { ddayLabel, dueInfo, fmtDateLine, startOfWeek, toDateInput } from '../lib/date';
import { ProgressBar } from './ui';

interface Props {
  team: Team;
  tasks: Task[];
  now: Date;
  /** 이 상세가 다루는 예배 날짜(ISO) */
  focusService: string;
  onToggle: (id: string) => void;
  onAdd: (title: string, teamId: TeamId, dateStr: string) => void;
  onDelete: (id: string) => void;
  onReschedule: (id: string, dateStr: string) => void;
  onAddPack: (teamId: string, iso: string) => void;
  onClose: () => void;
}

export default function TeamDetail({
  team,
  tasks,
  now,
  focusService,
  onToggle,
  onAdd,
  onDelete,
  onReschedule,
  onAddPack,
  onClose,
}: Props) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(toDateInput(now));
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const serviceDate = new Date(focusService);
  const focusWeek = startOfWeek(serviceDate).getTime();
  const inFocus = tasks.filter(
    (t) => startOfWeek(new Date(t.service ?? t.due)).getTime() === focusWeek,
  );
  const sorted = inFocus
    .slice()
    .sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.order - b.order));
  const done = inFocus.filter((t) => t.done).length;
  const dday = ddayLabel(serviceDate, now);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), team.id, date);
    setTitle('');
  };

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="sheet" role="dialog" aria-modal="true" aria-label={`${team.name} 체크리스트`}>
        <header className="sheet-head">
          <div>
            <h3>{team.name}</h3>
            <p className="sheet-sub">
              {team.serviceName} · {fmtDateLine(serviceDate)}
              <span className={`dday${dday === '오늘' ? ' now' : ''}`}>{dday}</span>
            </p>
          </div>
          <button className="icon-btn" aria-label="닫기" onClick={onClose}>
            ✕
          </button>
        </header>

        {inFocus.length === 0 ? (
          <div className="pack-empty">
            <p className="pack-empty-msg">아직 이 예배의 준비 목록이 없어요.</p>
            <button className="btn btn-primary" onClick={() => onAddPack(team.id, focusService)}>
              주간 준비팩 불러오기
            </button>
            <p className="hint">묵상부터 마침 기록까지 12단계가 한 번에 추가돼요</p>
          </div>
        ) : (
          <>
            <div className="sheet-progress">
              <span>
                <b>{done}</b>/{inFocus.length} 완료
              </span>
              <ProgressBar value={inFocus.length ? done / inFocus.length : 0} color={team.color} />
            </div>

            <ul className="checklist">
              {sorted.map((t) => {
                const info = dueInfo(t.due, now, t.allDay);
                const editing = editingId === t.id;
                return (
                  <li key={t.id} className={`check-item${editing ? ' editing' : ''}`}>
                    <div className="check-line">
                      <button
                        className="check-row"
                        aria-pressed={t.done}
                        aria-label={`${t.title} — ${t.done ? '완료 해제' : '완료로 표시'}`}
                        onClick={() => onToggle(t.id)}
                      >
                        <span className={`check-circle${t.done ? ' on' : ''}`} aria-hidden>
                          ✓
                        </span>
                        <span className="check-body">
                          <span className={`check-title${t.done ? ' is-done' : ''}`}>
                            {t.title}
                            {t.isCustom && <em className="mini-tag">메모</em>}
                          </span>
                          <span className={`check-sub${!t.done && info.tone === 'overdue' ? ' warn' : ''}`}>
                            {t.done ? '완료' : info.label}
                          </span>
                        </span>
                      </button>
                      {t.link && (
                        <a className="link-chip" href={t.link.url} target="_blank" rel="noreferrer">
                          {t.link.label} ↗
                        </a>
                      )}
                      <button
                        className={`kebab${editing ? ' open' : ''}`}
                        aria-label={`${t.title} 편집`}
                        aria-expanded={editing}
                        onClick={() => setEditingId(editing ? null : t.id)}
                      >
                        ⋯
                      </button>
                    </div>

                    {editing && (
                      <div className="edit-panel">
                        <label className="edit-field">
                          <span>마감일 변경</span>
                          <input
                            className="date-input"
                            type="date"
                            value={toDateInput(new Date(t.due))}
                            onChange={(e) => e.target.value && onReschedule(t.id, e.target.value)}
                          />
                        </label>
                        <button
                          className="edit-delete"
                          onClick={() => {
                            onDelete(t.id);
                            setEditingId(null);
                          }}
                        >
                          이 업무 지우기
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <form className="inline-add" onSubmit={submit}>
              <input
                className="text-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="생각난 일을 바로 적어두세요"
                aria-label="할 일 내용"
              />
              <input
                className="date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-label="마감일"
              />
              <button className="btn btn-primary" type="submit" disabled={!title.trim()}>
                추가
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
