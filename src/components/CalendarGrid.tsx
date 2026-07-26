import { useState } from 'react';
import type { Task, Team, TeamId } from '../types';
import { WEEKDAYS_KO, addDays, ddayLabel, fmtDateShort, fmtMonthLabel, startOfDay } from '../lib/date';
import { TeamChip } from './ui';

interface DayService {
  team: Team;
  total: number;
  done: number;
}

interface Props {
  teams: Team[];
  tasks: Task[];
  now: Date;
  onOpenService: (teamId: TeamId, iso: string) => void;
  onAddPack: (teamId: TeamId, iso: string) => void;
}

function servicesOnDay(day: Date, teams: Team[], tasks: Task[]): DayService[] {
  const iso = day.toISOString();
  const result: DayService[] = [];
  for (const team of teams) {
    if (day.getDay() !== team.serviceWeekday) continue;
    const ts = tasks.filter((t) => t.teamId === team.id && t.service === iso);
    result.push({ team, total: ts.length, done: ts.filter((t) => t.done).length });
  }
  return result;
}

const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

export default function CalendarGrid({ teams, tasks, now, onOpenService, onAddPack }: Props) {
  const [monthCursor, setMonthCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => startOfDay(now));

  const firstWeekday = monthCursor.getDay();
  const gridStart = addDays(monthCursor, -firstWeekday);
  const daysInMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const days = Array.from({ length: totalCells }, (_, i) => addDays(gridStart, i));

  const selectedServices = selectedDay ? servicesOnDay(selectedDay, teams, tasks) : [];

  return (
    <div className="cal-grid-wrap">
      <div className="cal-grid-nav">
        <button
          className="week-nav-btn"
          aria-label="이전 달"
          onClick={() => setMonthCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
        >
          ‹
        </button>
        <p className="cal-grid-month">{fmtMonthLabel(monthCursor)}</p>
        <button
          className="week-nav-btn"
          aria-label="다음 달"
          onClick={() => setMonthCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
        >
          ›
        </button>
      </div>

      <div className="cal-grid-weekdays">
        {WEEKDAYS_KO.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="cal-grid-days">
        {days.map((day, i) => {
          const inMonth = day.getMonth() === monthCursor.getMonth();
          const isToday = sameDay(day, now);
          const isSelected = !!selectedDay && sameDay(day, selectedDay);
          const services = servicesOnDay(day, teams, tasks).filter((s) => s.total > 0);
          return (
            <button
              key={i}
              className={`cal-day${inMonth ? '' : ' outside'}${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              <span className="cal-day-num">{day.getDate()}</span>
              {services.length > 0 && (
                <span className="cal-day-dots">
                  {services.map((s) => (
                    <span key={s.team.id} className={`cal-dot dot-${s.team.color}`} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* selectedDay는 startOfDay(now)로 초기화되고 null로 되돌아가는 경로가 없어
          이 패널은 항상 렌더된다 — 데스크톱 2열 레이아웃(index.css)이 이 전제를 깔고 있다.
          나중에 "선택 해제"를 추가하면 null일 때의 대체 콘텐츠도 같이 넣어야 한다. */}
      {selectedDay && (
        <div className="cal-day-detail">
          <p className="cal-day-detail-label">
            {fmtDateShort(selectedDay)} · {ddayLabel(selectedDay, now)}
          </p>
          {selectedServices.length === 0 ? (
            <p className="hint">이 날은 예정된 예배가 없어요</p>
          ) : (
            selectedServices.map((s) => (
              <button
                key={s.team.id}
                className="svc-item"
                onClick={() =>
                  s.total > 0
                    ? onOpenService(s.team.id, selectedDay.toISOString())
                    : onAddPack(s.team.id, selectedDay.toISOString())
                }
              >
                <TeamChip team={s.team} />
                <div className="svc-main">
                  <span className="svc-name">{s.team.serviceName}</span>
                </div>
                {s.total > 0 ? (
                  <span className="svc-open">
                    {s.done}/{s.total}
                  </span>
                ) : (
                  <span className="svc-add">준비팩 추가</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
