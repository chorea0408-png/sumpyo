import { useEffect, useState, type FormEvent } from 'react';
import type { Team } from '../types';
import { WEEKDAYS_KO } from '../lib/date';

export interface TeamFormValues {
  shortName: string;
  serviceName: string;
  weekday: number;
  pastorLabel: string;
  songCount: number;
}

interface Props {
  /** 있으면 편집 모드, 없으면 새 예배 추가 모드 */
  team?: Team;
  onSave: (values: TeamFormValues) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function TeamForm({ team, onSave, onDelete, onClose }: Props) {
  const editing = !!team;
  const [shortName, setShortName] = useState(team?.shortName ?? '');
  const [serviceName, setServiceName] = useState(team?.serviceName ?? '주일예배');
  const [weekday, setWeekday] = useState(team?.serviceWeekday ?? 0);
  const [pastorLabel, setPastorLabel] = useState(team?.pastorLabel ?? '목사님');
  const [songCount, setSongCount] = useState(team?.songCount ?? 4);

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
    if (!shortName.trim() || !serviceName.trim()) return;
    onSave({
      shortName: shortName.trim(),
      serviceName: serviceName.trim(),
      weekday,
      pastorLabel: pastorLabel.trim() || '목사님',
      songCount: Math.max(1, songCount),
    });
  };

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="sheet sheet-compact" role="dialog" aria-modal="true" aria-label={editing ? '예배 편집' : '예배 추가'}>
        <header className="sheet-head">
          <h3 className="sheet-title">{editing ? '예배 편집' : '예배 추가'}</h3>
          <button className="icon-btn" aria-label="닫기" onClick={onClose}>
            ✕
          </button>
        </header>
        <form onSubmit={submit}>
          <p className="field-label">카테고리 이름</p>
          <input
            className="text-input full"
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            placeholder="예) 대학부, 새벽예배, 유아부"
            aria-label="카테고리 이름"
            autoFocus
          />
          <p className="field-label">예배 이름</p>
          <input
            className="text-input full"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder="예) 주일예배, 수요예배, 새벽예배"
            aria-label="예배 이름"
          />
          <p className="field-label">예배 요일</p>
          <div className="team-select">
            {WEEKDAYS_KO.map((w, i) => (
              <button
                key={w}
                type="button"
                className={`filter-chip${weekday === i ? ' active' : ''}`}
                aria-pressed={weekday === i}
                onClick={() => setWeekday(i)}
              >
                {w}
              </button>
            ))}
          </div>
          <p className="field-label">교역자 호칭</p>
          <input
            className="text-input full"
            value={pastorLabel}
            onChange={(e) => setPastorLabel(e.target.value)}
            placeholder="예) 목사님, 청소년 전도사님"
            aria-label="교역자 호칭"
          />
          <p className="field-label">콘티 곡 수</p>
          <div className="song-count-row">
            <button
              type="button"
              className="count-btn"
              aria-label="곡 수 줄이기"
              onClick={() => setSongCount((n) => Math.max(1, n - 1))}
            >
              −
            </button>
            <span className="count-value">{songCount}곡</span>
            <button
              type="button"
              className="count-btn"
              aria-label="곡 수 늘리기"
              onClick={() => setSongCount((n) => Math.min(10, n + 1))}
            >
              ＋
            </button>
          </div>

          {!editing && <p className="add-team-hint">추가하면 이번 주·다음 주 준비팩이 자동으로 채워져요.</p>}

          <button
            className="btn btn-primary full submit-gap"
            type="submit"
            disabled={!shortName.trim() || !serviceName.trim()}
          >
            {editing ? '저장하기' : '추가하기'}
          </button>

          {editing && onDelete && (
            <button type="button" className="edit-delete full delete-gap" onClick={onDelete}>
              이 팀 삭제하기
            </button>
          )}
        </form>
      </section>
    </div>
  );
}
