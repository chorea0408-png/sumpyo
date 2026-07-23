import { useRef, useState } from 'react';
import type { Task, Team, TeamId } from '../types';
import { findTeam } from '../data/teams';
import { dueInfo } from '../lib/date';
import { DueBadge, TeamChip } from './ui';

interface Props {
  tasks: Task[];
  teams: Team[];
  now: Date;
  onComplete: (id: string) => void;
  onOpenTeam: (teamId: TeamId) => void;
}

export default function PriorityCarousel({ tasks, teams, now, onComplete, onOpenTeam }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  if (tasks.length === 0) {
    return (
      <section className="card hero">
        <p className="card-label">가장 먼저 할 일</p>
        <h2 className="hero-title">이번 주 준비를 모두 마쳤어요</h2>
        <p className="hero-sub">깊게 숨 한 번 쉬어가요 🌿</p>
      </section>
    );
  }

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.max(0, Math.min(tasks.length - 1, idx)));
  };

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <section className="hero-wrap">
      <p className="card-label carousel-label">
        가장 먼저 할 일{tasks.length > 1 ? ` · ${active + 1}/${tasks.length}` : ''}
      </p>
      <div className="hero-track" ref={trackRef} onScroll={onScroll}>
        {tasks.map((task) => {
          const team = findTeam(teams, task.teamId);
          if (!team) return null;
          const info = dueInfo(task.due, now, task.allDay);
          return (
            <article className="card hero hero-slide" key={task.id}>
              <div className="hero-meta">
                <TeamChip team={team} />
                <DueBadge info={info} />
              </div>
              <h2 className="hero-title">{task.title}</h2>
              {info.sub && <p className="hero-sub">{info.sub}</p>}
              <div className="hero-actions">
                <button className="btn btn-primary" onClick={() => onComplete(task.id)}>
                  완료로 표시
                </button>
                <button className="btn btn-ghost" onClick={() => onOpenTeam(task.teamId)}>
                  팀 체크리스트 보기
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {tasks.length > 1 && (
        <div className="hero-dots" role="tablist" aria-label="우선순위 넘기기">
          {tasks.map((t, i) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={i === active}
              aria-label={`${i + 1}번째 우선순위`}
              className={`hero-dot${i === active ? ' on' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
