import { useEffect, useMemo, useRef, useState } from 'react';
import type { Task, Team, TeamId } from './types';
import { INITIAL_TEAMS, findTeam, nextColor } from './data/teams';
import { makeSeed } from './data/seed';
import { makeWeekTasks } from './data/template';
import * as storage from './lib/storage';
import { pendingSorted } from './lib/priority';
import { WEEKDAYS_KO, addDays, isInWeek, startOfDay, startOfWeek, thisWeekServiceDate } from './lib/date';
import Landing from './components/Landing';
import EmptyHome from './components/EmptyHome';
import Header from './components/Header';
import PriorityCarousel from './components/PriorityCarousel';
import Upcoming from './components/Upcoming';
import UpcomingServices from './components/UpcomingServices';
import CalendarView from './components/CalendarView';
import MyPage from './components/MyPage';
import BottomNav, { type ViewId } from './components/BottomNav';
import TeamCard from './components/TeamCard';
import TeamDetail from './components/TeamDetail';
import WeeklySummary from './components/WeeklySummary';
import QuickAdd from './components/QuickAdd';
import TeamForm, { type TeamFormValues } from './components/TeamForm';
import UndoToast from './components/UndoToast';

type Filter = TeamId | 'all';
interface DetailTarget {
  teamId: TeamId;
  service: string;
}
type TeamFormState = { mode: 'add' } | { mode: 'edit'; teamId: TeamId } | null;

export default function App() {
  // 저장된 데이터가 없으면 빈 배열로 시작 — 랜딩에서 데모/신규 시작을 선택하기 전까지는 채우지 않는다
  const [teams, setTeams] = useState<Team[]>(() => storage.loadTeams() ?? []);
  const [tasks, setTasks] = useState<Task[]>(() => storage.loadTasks() ?? []);
  const [entered, setEntered] = useState<boolean>(() => storage.loadEntered());
  const [view, setView] = useState<ViewId>('home');
  const [filter, setFilter] = useState<Filter>('all');
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [teamForm, setTeamForm] = useState<TeamFormState>(null);
  const [now, setNow] = useState(() => new Date());
  const [undo, setUndo] = useState<{ id: string; title: string } | null>(null);
  const undoTimer = useRef<number | null>(null);

  useEffect(() => storage.saveTasks(tasks), [tasks]);
  useEffect(() => storage.saveTeams(teams), [teams]);
  useEffect(() => storage.saveEntered(entered), [entered]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // 매주 자동 준비팩 보장 — 캘린더에서 수동으로 추가하지 않아도 이번 주·다음 주는 항상 준비돼 있다.
  // setTasks 함수형 업데이터 안에서 최신 tasks 기준으로 누락분을 계산해야
  // (StrictMode의 effect 이중 실행 등으로) 이 effect가 연달아 두 번 돌아도 중복 생성되지 않는다.
  useEffect(() => {
    if (teams.length === 0) return;
    setTasks((currentTasks) => {
      const missing: { team: Team; service: Date }[] = [];
      for (const team of teams) {
        const weeks = [
          thisWeekServiceDate(team.serviceWeekday, now),
          thisWeekServiceDate(team.serviceWeekday, addDays(now, 7)),
        ];
        for (const service of weeks) {
          const svcIso = service.toISOString();
          if (!currentTasks.some((t) => t.teamId === team.id && t.service === svcIso)) {
            missing.push({ team, service });
          }
        }
      }
      if (missing.length === 0) return currentTasks;
      return [
        ...currentTasks,
        ...missing.flatMap(({ team, service }) => {
          const prefix = `${team.id}-${service.toISOString().slice(0, 10)}`;
          return makeWeekTasks(team, service, { doneCount: 0, idPrefix: prefix });
        }),
      ];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams, now]);

  const weekStart = startOfWeek(now);
  const inWeek = (t: Task) => isInWeek(t.service ?? t.due, weekStart);
  const weekTasks = useMemo(() => tasks.filter(inWeek), [tasks, now]);

  const filteredWeek = useMemo(
    () => (filter === 'all' ? weekTasks : weekTasks.filter((t) => t.teamId === filter)),
    [weekTasks, filter],
  );
  const pending = useMemo(() => pendingSorted(filteredWeek), [filteredWeek]);
  const heroTasks = pending.slice(0, 5);
  const upcoming = pending.slice(5, 8);

  /** 전체 팀 중 가장 가까운 다음 예배 (헤더 D-day 강조용) — 오늘 포함, 이번 주에 이미 지난 예배는 다음 주로 */
  const nextServiceDday = useMemo(() => {
    if (teams.length === 0) return null;
    const today = startOfDay(now).getTime();
    const candidates = teams.map((t) => {
      const thisWeek = thisWeekServiceDate(t.serviceWeekday, now);
      return thisWeek.getTime() >= today ? thisWeek : thisWeekServiceDate(t.serviceWeekday, addDays(now, 7));
    });
    return candidates.reduce((min, d) => (d < min ? d : min), candidates[0]);
  }, [teams, now]);

  const toggle = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    const willComplete = !!target && !target.done;
    setTasks((ts) =>
      ts.map((t) =>
        t.id === id
          ? t.done
            ? { ...t, done: false, doneAt: undefined }
            : { ...t, done: true, doneAt: new Date().toISOString() }
          : t,
      ),
    );
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    if (willComplete && target) {
      setUndo({ id, title: target.title });
      undoTimer.current = window.setTimeout(() => setUndo(null), 4000);
    } else {
      setUndo(null);
    }
  };

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

  /** 예배 주간 준비팩(12단계) 추가 — service 지정 시 그 주, 아니면 가장 가까운 빈 주 */
  const addPack = (teamId: TeamId, iso?: string) => {
    const team = findTeam(teams, teamId);
    if (!team) return;
    let service = iso ? new Date(iso) : null;
    if (!service) {
      for (let w = 0; w < 12; w++) {
        const cand = thisWeekServiceDate(team.serviceWeekday, addDays(now, w * 7));
        if (!tasks.some((t) => t.teamId === teamId && t.service === cand.toISOString())) {
          service = cand;
          break;
        }
      }
    }
    if (!service) return;
    const svcIso = service.toISOString();
    if (tasks.some((t) => t.teamId === teamId && t.service === svcIso)) return; // 이미 있음
    const prefix = `${teamId}-${svcIso.slice(0, 10)}`;
    setTasks((ts) => [...ts, ...makeWeekTasks(team, service!, { doneCount: 0, idPrefix: prefix })]);
  };

  const addTeam = (values: TeamFormValues) => {
    const id = crypto.randomUUID();
    const team: Team = {
      id,
      name: values.shortName,
      shortName: values.shortName,
      serviceName: values.serviceName,
      serviceDayLabel: `${WEEKDAYS_KO[values.weekday]}요일`,
      serviceWeekday: values.weekday,
      songCount: values.songCount,
      pastorLabel: values.pastorLabel,
      color: nextColor(teams.length),
      custom: true,
    };
    setTeams((ts) => [...ts, team]);
    // 이번 주 예배가 아직 남아 있으면 이번 주부터, 이미 지났으면 다음 주부터 (과거로 backfill만 방지)
    const today = startOfDay(now).getTime();
    const thisService = thisWeekServiceDate(values.weekday, now);
    const firstService = thisService.getTime() >= today ? thisService : addDays(thisService, 7);
    const secondService = addDays(firstService, 7);
    setTasks((ts) => [
      ...ts,
      ...makeWeekTasks(team, firstService, { doneCount: 0, idPrefix: `${id}-w1` }),
      ...makeWeekTasks(team, secondService, { doneCount: 0, idPrefix: `${id}-w2` }),
    ]);
  };

  const updateTeam = (teamId: TeamId, values: TeamFormValues) => {
    setTeams((ts) =>
      ts.map((t) =>
        t.id === teamId
          ? {
              ...t,
              name: values.shortName,
              shortName: values.shortName,
              serviceName: values.serviceName,
              serviceDayLabel: `${WEEKDAYS_KO[values.weekday]}요일`,
              serviceWeekday: values.weekday,
              pastorLabel: values.pastorLabel,
              songCount: values.songCount,
            }
          : t,
      ),
    );
  };

  const deleteTeam = (teamId: TeamId) => {
    const team = findTeam(teams, teamId);
    if (!team) return;
    if (!window.confirm(`${team.name}을(를) 삭제할까요? 이 팀의 모든 업무 기록도 함께 사라져요.`)) return;
    setTeams((ts) => ts.filter((t) => t.id !== teamId));
    setTasks((ts) => ts.filter((t) => t.teamId !== teamId));
    if (filter === teamId) setFilter('all');
    setTeamForm(null);
  };

  const importBackup = (importedTeams: Team[], importedTasks: Task[]) => {
    setTeams(importedTeams);
    setTasks(importedTasks);
    setFilter('all');
  };

  const openTeam = (teamId: TeamId) => {
    const team = findTeam(teams, teamId);
    if (!team) return;
    setDetail({ teamId, service: thisWeekServiceDate(team.serviceWeekday, now).toISOString() });
  };
  const openService = (teamId: TeamId, iso: string) => setDetail({ teamId, service: iso });

  const reset = () => {
    if (window.confirm('데모 데이터를 처음 상태로 되돌릴까요?')) {
      storage.clearData();
      setTeams(INITIAL_TEAMS);
      setTasks(makeSeed(INITIAL_TEAMS));
      setFilter('all');
      setView('home');
    }
  };

  if (!entered) {
    return (
      <Landing
        hasData={teams.length > 0}
        onContinue={() => setEntered(true)}
        onEnterDemo={() => {
          if (teams.length === 0) {
            setTeams(INITIAL_TEAMS);
            setTasks(makeSeed(INITIAL_TEAMS));
          }
          setEntered(true);
        }}
        onEnterFresh={() => {
          storage.clearData();
          setTeams([]);
          setTasks([]);
          setEntered(true);
          setTeamForm({ mode: 'add' });
        }}
      />
    );
  }

  const detailTeam = detail ? findTeam(teams, detail.teamId) : undefined;
  const visibleTeams = teams.filter((t) => filter === 'all' || t.id === filter);
  // 이번 주 예배가 있는 팀만 카드로 (추가된 팀은 캘린더에서 준비 시작)
  const gridTeams = visibleTeams.filter((t) => weekTasks.some((x) => x.teamId === t.id));
  const editingTeam =
    teamForm?.mode === 'edit' ? findTeam(teams, teamForm.teamId) : undefined;

  return (
    <div className="app">
      {view === 'home' &&
        (teams.length === 0 ? (
          <EmptyHome onAddTeam={() => setTeamForm({ mode: 'add' })} />
        ) : (
          <>
            <Header now={now} tasks={weekTasks} nextServiceDate={nextServiceDday} />

            <nav className="container chips" aria-label="팀 필터">
              {(['all', ...teams.map((t) => t.id)] as Filter[]).map((f) => (
                <button
                  key={f}
                  className={`filter-chip${filter === f ? ' active' : ''}`}
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? '전체' : findTeam(teams, f)?.shortName ?? f}
                </button>
              ))}
              <button className="chip-add" aria-label="예배 추가" onClick={() => setTeamForm({ mode: 'add' })}>
                ＋
              </button>
            </nav>

            <main className="container main">
              <div className="top-grid">
                <div className="col">
                  <PriorityCarousel
                    tasks={heroTasks}
                    teams={teams}
                    now={now}
                    onComplete={toggle}
                    onOpenTeam={openTeam}
                  />
                  <Upcoming tasks={upcoming} teams={teams} now={now} onOpenTeam={openTeam} />
                </div>
                <WeeklySummary tasks={tasks} teams={teams} now={now} />
              </div>

              <p className="section-label">팀별 준비 현황</p>
              <div className="team-grid">
                {gridTeams.map((t) => (
                  <TeamCard
                    key={t.id}
                    team={t}
                    tasks={weekTasks.filter((x) => x.teamId === t.id)}
                    now={now}
                    onOpen={() => openTeam(t.id)}
                  />
                ))}
              </div>

              <UpcomingServices
                teams={visibleTeams}
                tasks={tasks}
                now={now}
                onOpenService={openService}
                onViewAll={() => setView('calendar')}
              />
            </main>
          </>
        ))}

      {view === 'calendar' && (
        <CalendarView
          teams={teams}
          tasks={tasks}
          now={now}
          onOpenService={openService}
          onAddPack={addPack}
        />
      )}

      {view === 'mypage' && (
        <MyPage
          teams={teams}
          tasks={tasks}
          onShowIntro={() => setEntered(false)}
          onReset={reset}
          onAddTeam={() => setTeamForm({ mode: 'add' })}
          onEditTeam={(teamId) => setTeamForm({ mode: 'edit', teamId })}
          onImport={importBackup}
        />
      )}

      <BottomNav active={view} onChange={setView} />

      {teams.length > 0 && (
        <button className="fab" aria-label="빠른 추가" onClick={() => setQuickOpen(true)}>
          ＋
        </button>
      )}

      {undo && (
        <UndoToast
          title={undo.title}
          onUndo={() => {
            toggle(undo.id);
            setUndo(null);
          }}
        />
      )}

      {quickOpen && teams.length > 0 && (
        <QuickAdd
          teams={teams}
          defaultTeam={filter === 'all' ? teams[0].id : filter}
          onAdd={(title, teamId, dateStr) => {
            addTask(title, teamId, dateStr);
            setQuickOpen(false);
          }}
          onClose={() => setQuickOpen(false)}
        />
      )}

      {teamForm && (
        <TeamForm
          team={editingTeam}
          onSave={(values) => {
            if (teamForm.mode === 'add') addTeam(values);
            else updateTeam(teamForm.teamId, values);
            setTeamForm(null);
          }}
          onDelete={teamForm.mode === 'edit' ? () => deleteTeam(teamForm.teamId) : undefined}
          onClose={() => setTeamForm(null)}
        />
      )}

      {detail && detailTeam && (
        <TeamDetail
          team={detailTeam}
          tasks={tasks.filter((t) => t.teamId === detail.teamId)}
          now={now}
          focusService={detail.service}
          onToggle={toggle}
          onAdd={addTask}
          onDelete={removeTask}
          onReschedule={rescheduleTask}
          onAddPack={addPack}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
