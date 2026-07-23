import { useEffect, useMemo, useState } from 'react';
import type { Task, TeamId } from './types';
import { TEAMS, teamById } from './data/teams';
import { makeSeed } from './data/seed';
import * as storage from './lib/storage';
import { pendingSorted } from './lib/priority';
import Header from './components/Header';
import NextAction from './components/NextAction';
import Upcoming from './components/Upcoming';
import TeamCard from './components/TeamCard';
import TeamDetail from './components/TeamDetail';
import WeeklySummary from './components/WeeklySummary';
import QuickAdd from './components/QuickAdd';

type Filter = TeamId | 'all';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => storage.load() ?? makeSeed());
  const [filter, setFilter] = useState<Filter>('all');
  const [detailTeam, setDetailTeam] = useState<TeamId | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    storage.save(tasks);
  }, [tasks]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(
    () => (filter === 'all' ? tasks : tasks.filter((t) => t.teamId === filter)),
    [tasks, filter],
  );
  const pending = useMemo(() => pendingSorted(filtered), [filtered]);
  const hero = pending[0] ?? null;
  const upcoming = pending.slice(1, 4);

  const toggle = (id: string) =>
    setTasks((ts) =>
      ts.map((t) =>
        t.id === id
          ? t.done
            ? { ...t, done: false, doneAt: undefined }
            : { ...t, done: true, doneAt: new Date().toISOString() }
          : t,
      ),
    );

  const addTask = (title: string, teamId: TeamId, dateStr: string) => {
    const due = new Date(`${dateStr}T23:59:59`);
    setTasks((ts) => [
      ...ts,
      {
        id: crypto.randomUUID(),
        teamId,
        title,
        due: due.toISOString(),
        allDay: true,
        done: false,
        order: 1000 + ts.length,
        isCustom: true,
      },
    ]);
  };

  const removeTask = (id: string) => setTasks((ts) => ts.filter((t) => t.id !== id));

  const rescheduleTask = (id: string, dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    setTasks((ts) =>
      ts.map((t) => {
        if (t.id !== id) return t;
        const nd = new Date(t.due);
        nd.setFullYear(y, m - 1, d);
        if (t.allDay) nd.setHours(23, 59, 59, 0);
        return { ...t, due: nd.toISOString() };
      }),
    );
  };

  const reset = () => {
    if (window.confirm('데모 데이터를 처음 상태로 되돌릴까요?')) {
      storage.clear();
      setTasks(makeSeed());
    }
  };

  return (
    <div className="app">
      <Header now={now} tasks={tasks} />

      <nav className="container chips" aria-label="팀 필터">
        {(['all', ...TEAMS.map((t) => t.id)] as Filter[]).map((f) => (
          <button
            key={f}
            className={`filter-chip${filter === f ? ' active' : ''}`}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '전체' : teamById(f as TeamId).shortName}
          </button>
        ))}
      </nav>

      <main className="container main">
        <div className="top-grid">
          <div className="col">
            <NextAction task={hero} now={now} onComplete={toggle} onOpenTeam={setDetailTeam} />
            <Upcoming tasks={upcoming} now={now} onOpenTeam={setDetailTeam} />
          </div>
          <WeeklySummary tasks={tasks} now={now} />
        </div>

        <p className="section-label">팀별 준비 현황</p>
        <div className="team-grid">
          {TEAMS.filter((t) => filter === 'all' || t.id === filter).map((t) => (
            <TeamCard
              key={t.id}
              team={t}
              tasks={tasks.filter((x) => x.teamId === t.id)}
              now={now}
              onOpen={() => setDetailTeam(t.id)}
            />
          ))}
        </div>
      </main>

      <footer className="container footer">
        <button className="reset-btn" onClick={reset}>
          데모 데이터 초기화
        </button>
        <p className="tagline">숨표 — 예배 준비는 보이게, 내 시간에는 숨표를.</p>
      </footer>

      <button className="fab" aria-label="빠른 추가" onClick={() => setQuickOpen(true)}>
        ＋
      </button>

      {quickOpen && (
        <QuickAdd
          defaultTeam={filter === 'all' ? TEAMS[0].id : filter}
          onAdd={(title, teamId, dateStr) => {
            addTask(title, teamId, dateStr);
            setQuickOpen(false);
          }}
          onClose={() => setQuickOpen(false)}
        />
      )}

      {detailTeam && (
        <TeamDetail
          team={teamById(detailTeam)}
          tasks={tasks.filter((t) => t.teamId === detailTeam)}
          now={now}
          onToggle={toggle}
          onAdd={addTask}
          onDelete={removeTask}
          onReschedule={rescheduleTask}
          onClose={() => setDetailTeam(null)}
        />
      )}
    </div>
  );
}
