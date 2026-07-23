import { useEffect, useState, type FormEvent } from 'react';
import { WEEKDAYS_KO } from '../lib/date';

interface Props {
  onAdd: (shortName: string, serviceName: string, weekday: number) => void;
  onClose: () => void;
}

export default function AddTeam({ onAdd, onClose }: Props) {
  const [shortName, setShortName] = useState('');
  const [serviceName, setServiceName] = useState('주일예배');
  const [weekday, setWeekday] = useState(0);

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
    onAdd(shortName.trim(), serviceName.trim(), weekday);
  };

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="sheet sheet-compact" role="dialog" aria-modal="true" aria-label="예배 추가">
        <header className="sheet-head">
          <h3 className="sheet-title">예배 추가</h3>
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
          <p className="add-team-hint">추가하면 이번 주·다음 주 준비팩이 자동으로 채워져요.</p>
          <button
            className="btn btn-primary full submit-gap"
            type="submit"
            disabled={!shortName.trim() || !serviceName.trim()}
          >
            추가하기
          </button>
        </form>
      </section>
    </div>
  );
}
