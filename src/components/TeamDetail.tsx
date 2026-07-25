import { useEffect, useState, type FormEvent } from 'react';
import type { ServiceNote, SetlistSong, Task, TaskWaiting, Team, TeamId } from '../types';
import { addDays, ddayLabel, dueInfo, fmtDateLine, toDateInput } from '../lib/date';
import { serviceTasks } from '../lib/priority';
import { waitingDays, waitingLabel, waitingWho } from '../lib/waiting';
import SetlistPanel from './SetlistPanel';
import { ProgressBar } from './ui';

interface Props {
  team: Team;
  tasks: Task[];
  now: Date;
  /** 이 상세가 다루는 예배 날짜(ISO) */
  focusService: string;
  onToggle: (id: string) => void;
  onAdd: (title: string, teamId: TeamId, dateStr: string, memberId?: string) => void;
  onDelete: (id: string) => void;
  onReschedule: (id: string, dateStr: string) => void;
  onSetWaiting: (id: string, waiting: TaskWaiting) => void;
  onClearWaiting: (id: string) => void;
  /** 전체 마침 기록 — ‹ ›로 주를 옮기면 그 주의 기록을 보여줘야 해서 배열째 받는다 */
  notes: ServiceNote[];
  onSaveNote: (teamId: TeamId, service: string, text: string) => void;
  /** 전체 콘티 — 노트와 같은 이유로 배열째 받는다 */
  setlist: SetlistSong[];
  onChangeSetlist: (songs: SetlistSong[]) => void;
  onAddSong: (teamId: TeamId, service: string, title: string) => void;
  onAddPack: (teamId: string, iso: string) => void;
  onOpenLineup: (teamId: TeamId) => void;
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
  onSetWaiting,
  onClearWaiting,
  notes,
  onSaveNote,
  setlist,
  onChangeSetlist,
  onAddSong,
  onAddPack,
  onOpenLineup,
  onClose,
}: Props) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(toDateInput(now));
  const [memberId, setMemberId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  /** 편집 패널에서 '기다리는 중' 입력을 펼친 업무 */
  const [waitingFormId, setWaitingFormId] = useState<string | null>(null);
  /** 마침 기록 입력을 펼쳤는지 — 기록이 이미 있으면 처음부터 펼친다 */
  const [noteOpen, setNoteOpen] = useState(false);
  /** 콘티 패널을 펼쳤는지 */
  const [setlistOpen, setSetlistOpen] = useState(false);
  const [waitWho, setWaitWho] = useState('');
  const [waitSince, setWaitSince] = useState(toDateInput(now));
  const [viewDate, setViewDate] = useState(() => new Date(focusService));
  const members = team.members ?? [];
  const memberName = (id?: string) => (id ? members.find((m) => m.id === id)?.name : undefined);

  useEffect(() => {
    setViewDate(new Date(focusService));
  }, [focusService]);

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

  const serviceDate = viewDate;
  const serviceIso = serviceDate.toISOString();
  // 완료 축하(App.toggle)와 반드시 같은 기준으로 묶는다 — lib/priority.ts의 serviceTasks 참고
  const inFocus = serviceTasks(tasks, team.id, serviceIso);
  // 지금 보고 있는 주의 기록만 — 이번 주를 열었을 때 지난 주 회고가 뜨지 않는다(의도된 동작)
  const noteText = notes.find((n) => n.teamId === team.id && n.service === serviceIso)?.text ?? '';
  const songs = setlist
    .filter((s) => s.teamId === team.id && s.service === serviceIso)
    .slice()
    .sort((a, b) => a.order - b.order);
  const unconfirmed = songs.filter((s) => !s.confirmed).length;
  const sorted = inFocus
    .slice()
    .sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.order - b.order));
  const done = inFocus.filter((t) => t.done).length;
  const allDone = inFocus.length > 0 && done === inFocus.length;
  const dday = ddayLabel(serviceDate, now);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), team.id, date, memberId || undefined);
    setTitle('');
    setMemberId('');
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
            <div className="sheet-week-nav">
              <button
                className="week-nav-btn"
                aria-label="이전 주"
                onClick={() => setViewDate((d) => addDays(d, -7))}
              >
                ‹
              </button>
              <p className="sheet-sub">
                {team.serviceName} · {fmtDateLine(serviceDate)}
                <span className={`dday${dday === '오늘' ? ' now' : ''}`}>{dday}</span>
              </p>
              <button
                className="week-nav-btn"
                aria-label="다음 주"
                onClick={() => setViewDate((d) => addDays(d, 7))}
              >
                ›
              </button>
            </div>
          </div>
          <button className="icon-btn" aria-label="닫기" onClick={onClose}>
            ✕
          </button>
        </header>

        {inFocus.length === 0 ? (
          <div className="pack-empty">
            <p className="pack-empty-msg">아직 이 예배의 준비 목록이 없어요.</p>
            <button className="btn btn-primary" onClick={() => onAddPack(team.id, viewDate.toISOString())}>
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
              <ProgressBar
                value={inFocus.length ? done / inFocus.length : 0}
                color={team.color}
                label={`${team.serviceName} 준비 ${done}/${inFocus.length} 완료`}
              />
            </div>

            {allDone && (
              <div className="finish-card">
                <span className="finish-icon" aria-hidden>
                  🌿
                </span>
                <p className="finish-text">이번 예배 준비를 마쳤어요</p>
              </div>
            )}

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
                            {memberName(t.memberId) && <em className="mini-tag mini-tag-member">👤 {memberName(t.memberId)}</em>}
                            {/* "악보·키·송폼 확인이 필요한 곡은?" — 콘티가 있을 때만 나오는 파생 표시 */}
                            {t.stepKey === 'score' && unconfirmed > 0 && (
                              <em className="mini-tag">{unconfirmed}곡 확인 필요</em>
                            )}
                          </span>
                          <span
                            className={`check-sub${!t.done && !t.waiting && info.tone === 'overdue' ? ' warn' : ''}`}
                          >
                            {t.done
                              ? '완료'
                              : t.waiting
                                ? `${waitingWho(t.waiting, members) || '요청'} · ${waitingLabel(waitingDays(t.waiting.since, now))}`
                                : info.label}
                          </span>
                        </span>
                      </button>
                      {t.link && (
                        <a className="link-chip" href={t.link.url} target="_blank" rel="noreferrer">
                          {t.link.label} ↗
                        </a>
                      )}
                      {t.isLineupStep && (
                        <button type="button" className="link-chip" onClick={() => onOpenLineup(team.id)}>
                          라인업 정하기 ↗
                        </button>
                      )}
                      {t.stepKey === 'finish' && (
                        <button
                          type="button"
                          className="link-chip"
                          onClick={() => setNoteOpen((o) => !o)}
                          aria-expanded={noteOpen}
                        >
                          {noteText.trim() ? '기록 보기' : '기록 남기기'} ↗
                        </button>
                      )}
                      {t.stepKey === 'conti' && (
                        <button
                          type="button"
                          className="link-chip"
                          onClick={() => setSetlistOpen((o) => !o)}
                          aria-expanded={setlistOpen}
                        >
                          콘티 정리 {songs.length > 0 ? `(${songs.length}) ` : ''}↗
                        </button>
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

                    {t.stepKey === 'conti' && setlistOpen && (
                      <SetlistPanel
                        songs={songs}
                        songCount={team.songCount}
                        onChange={(next) =>
                          onChangeSetlist([
                            ...setlist.filter((s) => !(s.teamId === team.id && s.service === serviceIso)),
                            ...next,
                          ])
                        }
                        onAdd={(songTitle) => onAddSong(team.id, serviceIso, songTitle)}
                      />
                    )}

                    {t.stepKey === 'finish' && noteOpen && (
                      <div className="note-panel">
                        <textarea
                          className="note-input"
                          value={noteText}
                          onChange={(e) => onSaveNote(team.id, serviceIso, e.target.value)}
                          placeholder="다음 예배에 기억하고 싶은 것 한 줄"
                          aria-label="예배 마침 기록"
                        />
                        <p className="hint">
                          팀 관리 &gt; 지난 예배 기록에서 모아 볼 수 있어요
                          {/* 다음 주 체크리스트에 자동으로 띄우지 않는다 — 사용자가 '저장하고 찾아보기'를 택했다 */}
                        </p>
                      </div>
                    )}

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
                        {/* 이미 끝낸 일은 누구의 답도 기다리지 않는다 — 컨트롤 자체를 숨긴다 */}
                        {t.done ? null : t.waiting ? (
                          <button
                            type="button"
                            className="btn btn-soft full"
                            onClick={() => onClearWaiting(t.id)}
                          >
                            답 받았어요
                          </button>
                        ) : waitingFormId === t.id ? (
                          <div className="waiting-form">
                            <label className="edit-field">
                              <span>누구에게</span>
                              {members.length > 0 ? (
                                <select
                                  className="date-input"
                                  value={waitWho}
                                  onChange={(e) => setWaitWho(e.target.value)}
                                  aria-label="요청한 대상"
                                >
                                  <option value="">직접 입력</option>
                                  {team.pastorLabel && (
                                    <option value={`name:${team.pastorLabel}`}>{team.pastorLabel}</option>
                                  )}
                                  {members.map((m) => (
                                    <option key={m.id} value={`id:${m.id}`}>
                                      {m.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  className="date-input"
                                  value={waitWho.replace(/^name:/, '')}
                                  onChange={(e) => setWaitWho(`name:${e.target.value}`)}
                                  placeholder="예) 목사님"
                                  aria-label="요청한 대상"
                                />
                              )}
                            </label>
                            <label className="edit-field">
                              <span>언제 요청했나요</span>
                              <input
                                className="date-input"
                                type="date"
                                value={waitSince}
                                onChange={(e) => setWaitSince(e.target.value)}
                              />
                            </label>
                            <div className="waiting-form-actions">
                              <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setWaitingFormId(null)}
                              >
                                취소
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => {
                                  const since = new Date(`${waitSince}T00:00:00`).toISOString();
                                  const w: TaskWaiting = waitWho.startsWith('id:')
                                    ? { whoMemberId: waitWho.slice(3), since }
                                    : { whoName: waitWho.replace(/^name:/, '').trim() || undefined, since };
                                  onSetWaiting(t.id, w);
                                  setWaitingFormId(null);
                                }}
                              >
                                표시하기
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-soft full"
                            onClick={() => {
                              setWaitingFormId(t.id);
                              setWaitWho(t.stepKey === 'confirm' ? `name:${team.pastorLabel}` : '');
                              setWaitSince(toDateInput(now));
                            }}
                          >
                            답을 기다리는 중으로 표시
                          </button>
                        )}
                        <button
                          className="edit-delete"
                          onClick={() => {
                            if (!window.confirm(`"${t.title}" 업무를 지울까요?`)) return;
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
              {members.length > 0 && (
                <select
                  className="date-input"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  aria-label="관련 팀원"
                >
                  <option value="">관련 팀원 (선택 안 함)</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}
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
