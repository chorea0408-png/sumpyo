import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  Expense,
  ExpenseCategory,
  LineupAssignment,
  LineupSlot,
  NoticeClosingTemplate,
  Profile,
  Project,
  ProjectExpense,
  ProjectExpenseCategory,
  ProjectId,
  ProjectMilestone,
  ServiceNote,
  SetlistSong,
  Task,
  TaskWaiting,
  Team,
  TeamId,
  TeamMember,
  TemplateStep,
} from './types';
import { INITIAL_TEAMS, findTeam, nextColor } from './data/teams';
import { makeSeed } from './data/seed';
import { makeWeekTasks } from './data/template';
import * as storage from './lib/storage';
import { carriedOver, rankForHome, serviceTasks } from './lib/priority';
import { waitingTasks } from './lib/waiting';
import { WEEKDAYS_KO, addDays, isInWeek, nextServiceOn, startOfDay, startOfWeek, thisWeekServiceDate } from './lib/date';
import { toAssignments, type LineupPick } from './lib/lineup';
import { useSwUpdate } from './lib/useSwUpdate';
import { useIsDesktop } from './lib/useIsDesktop';
import Landing from './components/Landing';
import EmptyHome from './components/EmptyHome';
import Header from './components/Header';
import PriorityCarousel from './components/PriorityCarousel';
import Upcoming from './components/Upcoming';
import CarriedOver from './components/CarriedOver';
import WaitingBoard from './components/WaitingBoard';
import UpcomingServices from './components/UpcomingServices';
import CalendarView from './components/CalendarView';
import ProjectsView from './components/ProjectsView';
import ProjectForm from './components/ProjectForm';
import ProjectDetail from './components/ProjectDetail';
import MyPage from './components/MyPage';
import BottomNav, { type ViewId } from './components/BottomNav';
import TeamCard from './components/TeamCard';
import TeamDetail from './components/TeamDetail';
import WeeklySummary from './components/WeeklySummary';
import QuickAdd from './components/QuickAdd';
import TeamForm, { type TeamFormValues } from './components/TeamForm';
import TeamManage, { type BasicInfo, type TeamManageSection } from './components/TeamManage';
import UndoToast from './components/UndoToast';
import UpdateToast from './components/UpdateToast';
import Celebration from './components/Celebration';

type Filter = TeamId | 'all';
interface DetailTarget {
  teamId: TeamId;
  service: string;
}

export default function App() {
  // 저장된 데이터가 없으면 빈 배열로 시작 — 랜딩에서 데모/신규 시작을 선택하기 전까지는 채우지 않는다
  const [teams, setTeams] = useState<Team[]>(() => storage.loadTeams() ?? []);
  const [tasks, setTasks] = useState<Task[]>(() => storage.loadTasks() ?? []);
  const [entered, setEntered] = useState<boolean>(() => storage.loadEntered());
  const [view, setView] = useState<ViewId>('home');
  const [filter, setFilter] = useState<Filter>('all');
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [teamManageId, setTeamManageId] = useState<TeamId | null>(null);
  const [teamManageFocus, setTeamManageFocus] = useState<TeamManageSection | undefined>(undefined);
  /** 체크리스트의 '라인업 정하기 ↗'로 진입했을 때, 뒤로가기 시 복귀할 체크리스트 대상 */
  const [returnToDetail, setReturnToDetail] = useState<DetailTarget | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [undo, setUndo] = useState<{ id: string; title: string } | null>(null);
  const undoTimer = useRef<number | null>(null);
  const [celebration, setCelebration] = useState<{ teamName: string; isThisWeek: boolean } | null>(
    null,
  );
  const celebrationTimer = useRef<number | null>(null);
  const [profile, setProfile] = useState<Profile>(() => storage.loadProfile() ?? { name: '', church: '' });
  const [lineup, setLineup] = useState<LineupAssignment[]>(() => storage.loadLineup());
  const [notes, setNotes] = useState<ServiceNote[]>(() => storage.loadNotes());
  const [setlist, setSetlist] = useState<SetlistSong[]>(() => storage.loadSetlist());
  const [noticeTemplates, setNoticeTemplates] = useState<NoticeClosingTemplate[]>(() =>
    storage.loadNoticeTemplates(),
  );
  const [expenses, setExpenses] = useState<Expense[]>(() => storage.loadExpenses());
  const [projects, setProjects] = useState<Project[]>(() => storage.loadProjects());
  const [milestones, setMilestones] = useState<ProjectMilestone[]>(() => storage.loadMilestones());
  const [projectExpenses, setProjectExpenses] = useState<ProjectExpense[]>(() => storage.loadProjectExpenses());
  const [longViewOn, setLongViewOn] = useState<boolean>(() => storage.loadLongView());
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [projectDetailId, setProjectDetailId] = useState<ProjectId | null>(null);
  const { needRefresh, applyUpdate } = useSwUpdate();
  const isDesktop = useIsDesktop();

  useEffect(() => storage.saveTasks(tasks), [tasks]);
  useEffect(() => storage.saveTeams(teams), [teams]);
  useEffect(() => storage.saveEntered(entered), [entered]);
  useEffect(() => storage.saveProfile(profile), [profile]);
  useEffect(() => storage.saveLineup(lineup), [lineup]);
  useEffect(() => storage.saveNotes(notes), [notes]);
  useEffect(() => storage.saveSetlist(setlist), [setlist]);
  useEffect(() => storage.saveNoticeTemplates(noticeTemplates), [noticeTemplates]);
  useEffect(() => storage.saveExpenses(expenses), [expenses]);
  useEffect(() => storage.saveProjects(projects), [projects]);
  useEffect(() => storage.saveMilestones(milestones), [milestones]);
  useEffect(() => storage.saveProjectExpenses(projectExpenses), [projectExpenses]);
  useEffect(() => storage.saveLongView(longViewOn), [longViewOn]);

  /** 길게 보기 모드를 끄는 순간 프로젝트 탭에 있었다면 홈으로 — 빈 화면 대신 안전한 곳으로 */
  useEffect(() => {
    if (!longViewOn && view === 'projects') setView('home');
  }, [longViewOn, view]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // 매주 자동 준비팩 보장 — 캘린더에서 수동으로 추가하지 않아도 이번 주·다음 주는 항상 준비돼 있다.
  // setTasks 함수형 업데이터 안에서 최신 tasks 기준으로 누락분을 계산해야
  // (StrictMode의 effect 이중 실행 등으로) 이 effect가 연달아 두 번 돌아도 중복 생성되지 않는다.
  useEffect(() => {
    if (teams.length === 0) return;
    const today = startOfDay(now).getTime();
    setTasks((currentTasks) => {
      const missing: { team: Team; service: Date }[] = [];
      for (const team of teams) {
        const weeks = [
          thisWeekServiceDate(team.serviceWeekday, now),
          thisWeekServiceDate(team.serviceWeekday, addDays(now, 7)),
        ];
        for (const service of weeks) {
          // 이번 주 안에서 이미 지난 요일이면(과거 예배) 새로 생성하지 않는다 — 지나버린 유령 준비팩 방지
          if (startOfDay(service).getTime() < today) continue;
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
  const ranking = useMemo(() => rankForHome(filteredWeek), [filteredWeek]);
  const heroTasks = ranking.ready.slice(0, 5);
  // 잘라내지 않고 나머지 전부를 넘긴다 — 몇 건이 남았는지는 Upcoming이 직접 보여준다.
  // 선행 단계가 남아 미뤄둔 일도 여기서 이유와 함께 보인다.
  const upcoming = useMemo(() => {
    const rest: { task: Task; blockedBy?: Task }[] = ranking.ready
      .slice(5)
      .map((task) => ({ task }))
      .concat(ranking.blocked.map((b) => ({ task: b.task, blockedBy: b.blockedBy })));
    return rest.sort((a, b) => (a.task.due < b.task.due ? -1 : a.task.due > b.task.due ? 1 : 0));
  }, [ranking]);

  /** 답을 기다리는 중인 업무 — 주 단위로 자르지 않는다(요청은 주를 넘겨서도 살아 있다) */
  const waiting = useMemo(() => {
    const all = waitingTasks(tasks);
    return filter === 'all' ? all : all.filter((t) => t.teamId === filter);
  }, [tasks, filter]);

  /** 주 경계를 넘으며 홈에서 사라졌을 지난 주 미완료 업무 */
  const CARRY_WEEKS = 4;
  const carried = useMemo(() => {
    const all = carriedOver(tasks, weekStart, CARRY_WEEKS);
    return filter === 'all' ? all : all.filter((t) => t.teamId === filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, now, filter]);

  /** 전체 팀 중 가장 가까운 다음 예배 (헤더 D-day 강조용) */
  const nextServiceDday = useMemo(() => {
    if (teams.length === 0) return null;
    const candidates = teams.map((t) => nextServiceOn(t.serviceWeekday, now));
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

    // 이 토글로 해당 팀·예배의 마지막 남은 업무가 채워져 0%→100%가 됐는지 감지.
    // 묶는 기준은 반드시 체크리스트 진행률과 같아야 한다(serviceTasks) —
    // 다르면 "12/13인데 모두 마쳤어요"가 뜬다. 메모(service 없음)도 함께 센다.
    if (willComplete && target) {
      const anchor = target.service ?? target.due;
      const siblings = serviceTasks(tasks, target.teamId, anchor);
      const nowAllDone = siblings.length > 0 && siblings.every((t) => t.id === id || t.done);
      if (nowAllDone) {
        const team = findTeam(teams, target.teamId);
        if (team) {
          if (celebrationTimer.current) window.clearTimeout(celebrationTimer.current);
          setCelebration({
            teamName: team.shortName,
            isThisWeek: startOfWeek(new Date(anchor)).getTime() === weekStart.getTime(),
          });
          celebrationTimer.current = window.setTimeout(() => setCelebration(null), 2500);
        }
      }
    }
  };

  const addTask = (title: string, teamId: TeamId, dateStr: string, memberId?: string) => {
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
        memberId,
      },
    ]);
  };

  const removeTask = (id: string) => setTasks((ts) => ts.filter((t) => t.id !== id));

  const setWaiting = (id: string, waiting: TaskWaiting) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, waiting } : t)));

  /** 답을 받았다는 표시일 뿐 — 자료를 받은 것과 정리한 것은 다른 행동이라 완료 처리하지 않는다 */
  const clearWaiting = (id: string) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, waiting: undefined } : t)));

  /** 예배 마침 기록 upsert — 내용을 비우면 기록을 지운다 */
  const saveNote = (teamId: TeamId, service: string, text: string) => {
    const at = new Date().toISOString();
    setNotes((ns) => {
      const found = ns.find((n) => n.teamId === teamId && n.service === service);
      if (!text.trim()) return found ? ns.filter((n) => n !== found) : ns;
      if (found) return ns.map((n) => (n === found ? { ...n, text, updatedAt: at } : n));
      return [...ns, { id: crypto.randomUUID(), teamId, service, text, createdAt: at, updatedAt: at }];
    });
  };

  const addSong = (teamId: TeamId, service: string, title: string) =>
    setSetlist((ss) => {
      const order = ss.filter((s) => s.teamId === teamId && s.service === service).length;
      return [...ss, { id: crypto.randomUUID(), teamId, service, order, title }];
    });

  const addExpense = (teamId: TeamId, date: string, category: ExpenseCategory, title: string, amount: number) =>
    setExpenses((es) => [...es, { id: crypto.randomUUID(), teamId, date, category, title, amount }]);

  const removeExpense = (id: string) => setExpenses((es) => es.filter((e) => e.id !== id));

  const addProject = (title: string, description?: string, milestoneTitles?: string[]) => {
    const p: Project = { id: crypto.randomUUID(), title, description, createdAt: new Date().toISOString() };
    setProjects((ps) => [...ps, p]);
    if (milestoneTitles?.length) {
      setMilestones((ms) => [
        ...ms,
        ...milestoneTitles.map((t, i) => ({
          id: crypto.randomUUID(),
          projectId: p.id,
          title: t,
          done: false,
          order: i,
        })),
      ]);
    }
  };

  const updateProjectTitle = (id: ProjectId, title: string) =>
    setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, title } : p)));

  const updateProjectDescription = (id: ProjectId, description: string) =>
    setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, description: description || undefined } : p)));

  const toggleProjectComplete = (id: ProjectId) =>
    setProjects((ps) =>
      ps.map((p) => (p.id === id ? { ...p, completedAt: p.completedAt ? undefined : new Date().toISOString() } : p)),
    );

  /** confirm은 ProjectDetail이 이미 물어봤다 — 여기서 또 물으면 이중 확인이 된다 */
  const deleteProject = (id: ProjectId) => {
    setProjects((ps) => ps.filter((p) => p.id !== id));
    setMilestones((ms) => ms.filter((m) => m.projectId !== id));
    setProjectExpenses((es) => es.filter((e) => e.projectId !== id));
    setProjectDetailId(null);
  };

  const addMilestone = (projectId: ProjectId, title: string) =>
    setMilestones((ms) => {
      const order = ms.filter((m) => m.projectId === projectId).length;
      return [...ms, { id: crypto.randomUUID(), projectId, title, done: false, order }];
    });

  const toggleMilestone = (id: string) =>
    setMilestones((ms) => ms.map((m) => (m.id === id ? { ...m, done: !m.done } : m)));

  const renameMilestone = (id: string, title: string) =>
    setMilestones((ms) => ms.map((m) => (m.id === id ? { ...m, title } : m)));

  const removeMilestone = (id: string) => setMilestones((ms) => ms.filter((m) => m.id !== id));

  const reorderMilestones = (projectId: ProjectId, ordered: ProjectMilestone[]) =>
    setMilestones((ms) => [...ms.filter((m) => m.projectId !== projectId), ...ordered]);

  const addProjectExpense = (
    projectId: ProjectId,
    date: string,
    category: ProjectExpenseCategory,
    title: string,
    amount: number,
  ) =>
    setProjectExpenses((es) => [...es, { id: crypto.randomUUID(), projectId, date, category, title, amount }]);

  const removeProjectExpense = (id: string) => setProjectExpenses((es) => es.filter((e) => e.id !== id));

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

  /** 예배 주간 준비팩 추가 — service 지정 시 그 주, 아니면 가장 가까운 빈 주 */
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
      members: [],
    };
    setTeams((ts) => [...ts, team]);
    // 이번 주 예배가 아직 남아 있으면 이번 주부터, 이미 지났으면 다음 주부터 (과거로 backfill만 방지)
    const firstService = nextServiceOn(values.weekday, now);
    const secondService = addDays(firstService, 7);
    setTasks((ts) => [
      ...ts,
      ...makeWeekTasks(team, firstService, { doneCount: 0, idPrefix: `${id}-w1` }),
      ...makeWeekTasks(team, secondService, { doneCount: 0, idPrefix: `${id}-w2` }),
    ]);
  };

  const updateTeamBasic = (teamId: TeamId, values: BasicInfo) => {
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

  const updateTeamMembers = (teamId: TeamId, members: TeamMember[]) => {
    setTeams((ts) => ts.map((t) => (t.id === teamId ? { ...t, members } : t)));
  };

  const updateTeamLineupSlots = (teamId: TeamId, slots: LineupSlot[] | undefined) => {
    setTeams((ts) => ts.map((t) => (t.id === teamId ? { ...t, lineupSlots: slots } : t)));
  };

  const updateTeamTemplate = (teamId: TeamId, template: TemplateStep[] | undefined) => {
    setTeams((ts) => ts.map((t) => (t.id === teamId ? { ...t, customTemplate: template } : t)));
  };

  /** 라인업 확정 — 같은 팀·같은 예배에 대한 기존 확정 기록은 갈아끼운다 */
  const confirmLineup = (teamId: TeamId, service: string, picks: LineupPick[]) => {
    const fresh = toAssignments(teamId, service, picks);
    setLineup((ls) => [...ls.filter((a) => !(a.teamId === teamId && a.service === service)), ...fresh]);
  };

  const deleteTeam = (teamId: TeamId) => {
    const team = findTeam(teams, teamId);
    if (!team) return;
    if (!window.confirm(`${team.name}을(를) 삭제할까요? 이 팀의 모든 업무 기록도 함께 사라져요.`)) return;
    setTeams((ts) => ts.filter((t) => t.id !== teamId));
    setTasks((ts) => ts.filter((t) => t.teamId !== teamId));
    setLineup((ls) => ls.filter((a) => a.teamId !== teamId));
    setNotes((ns) => ns.filter((n) => n.teamId !== teamId));
    setSetlist((ss) => ss.filter((s) => s.teamId !== teamId));
    setExpenses((es) => es.filter((e) => e.teamId !== teamId));
    if (filter === teamId) setFilter('all');
    setTeamManageId(null);
  };

  const importBackup = (
    importedTeams: Team[],
    importedTasks: Task[],
    importedProfile: Profile | null,
    importedLineup: LineupAssignment[],
    importedNotes: ServiceNote[],
    importedSetlist: SetlistSong[],
    importedNoticeTemplates: NoticeClosingTemplate[],
    importedExpenses: Expense[],
    importedProjects: Project[],
    importedMilestones: ProjectMilestone[],
    importedProjectExpenses: ProjectExpense[],
  ) => {
    setTeams(importedTeams);
    setTasks(importedTasks);
    if (importedProfile) setProfile(importedProfile);
    setLineup(importedLineup);
    setNotes(importedNotes);
    setSetlist(importedSetlist);
    setNoticeTemplates(importedNoticeTemplates);
    setExpenses(importedExpenses);
    setProjects(importedProjects);
    setMilestones(importedMilestones);
    setProjectExpenses(importedProjectExpenses);
    setFilter('all');
  };

  const openTeam = (teamId: TeamId) => {
    const team = findTeam(teams, teamId);
    if (!team) return;
    setDetail({ teamId, service: thisWeekServiceDate(team.serviceWeekday, now).toISOString() });
  };
  const openService = (teamId: TeamId, iso: string) => setDetail({ teamId, service: iso });

  /** 체크리스트의 '라인업 확정' 항목에서 바로 라인업 관리 화면으로 이동 */
  const openLineupFor = (teamId: TeamId) => {
    setReturnToDetail(detail);
    setDetail(null);
    setTeamManageFocus('lineup');
    setTeamManageId(teamId);
  };

  /** 데스크톱 상단 네비에서 팀 관리 화면을 나가며 다른 탭으로 이동 —
      manageTeam이 view보다 먼저 early return하므로 setView만으로는 화면이 안 바뀐다 */
  const leaveManage = (v: ViewId) => {
    setTeamManageId(null);
    setTeamManageFocus(undefined);
    setReturnToDetail(null);
    setDetail(null);
    setView(v);
  };

  const reset = () => {
    const hasRealData = teams.some((t) => t.custom);
    const message = hasRealData
      ? '지금 등록된 팀·업무 데이터가 모두 사라지고 데모 데이터로 바뀌어요. 먼저 마이페이지에서 내보내기로 백업해두는 걸 권해요. 그래도 초기화할까요?'
      : '데모 데이터를 처음 상태로 되돌릴까요?';
    if (window.confirm(message)) {
      storage.clearData();
      setTeams(INITIAL_TEAMS);
      setTasks(makeSeed(INITIAL_TEAMS));
      setLineup([]);
      setNotes([]);
      setSetlist([]);
      setNoticeTemplates([]);
      setExpenses([]);
      setProjects([]);
      setMilestones([]);
      setProjectExpenses([]);
      setFilter('all');
      setView('home');
      setTeamManageId(null);
    }
  };

  if (!entered) {
    return (
      <>
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
            setLineup([]);
            setNotes([]);
            setSetlist([]);
            setNoticeTemplates([]);
            setExpenses([]);
            setProjects([]);
            setMilestones([]);
            setProjectExpenses([]);
            setEntered(true);
            setAddTeamOpen(true);
          }}
        />
        {needRefresh && <UpdateToast onReload={applyUpdate} />}
      </>
    );
  }

  const manageTeam = teamManageId ? findTeam(teams, teamManageId) : undefined;
  if (manageTeam) {
    return (
      <>
        <TeamManage
          team={manageTeam}
          now={now}
          history={lineup}
          focusSection={teamManageFocus}
          backLabel={returnToDetail ? '체크리스트로 돌아가기' : '마이페이지로 돌아가기'}
          signature={profile.signature}
          notes={notes}
          noticeTemplates={noticeTemplates}
          expenses={expenses}
          onAddExpense={addExpense}
          onRemoveExpense={removeExpense}
          onBack={() => {
            setTeamManageId(null);
            setTeamManageFocus(undefined);
            if (returnToDetail) {
              setDetail(returnToDetail);
              setReturnToDetail(null);
            }
          }}
          onUpdateBasic={(values) => updateTeamBasic(manageTeam.id, values)}
          onUpdateMembers={(members) => updateTeamMembers(manageTeam.id, members)}
          onUpdateLineupSlots={(slots) => updateTeamLineupSlots(manageTeam.id, slots)}
          onConfirmLineup={(service, picks) => confirmLineup(manageTeam.id, service, picks)}
          onUpdateTemplate={(tpl) => updateTeamTemplate(manageTeam.id, tpl)}
          onDelete={() => deleteTeam(manageTeam.id)}
          onNavigate={leaveManage}
          longViewOn={longViewOn}
        />
        {needRefresh && <UpdateToast onReload={applyUpdate} />}
      </>
    );
  }

  const detailTeam = detail ? findTeam(teams, detail.teamId) : undefined;
  const projectFor = projectDetailId ? projects.find((p) => p.id === projectDetailId) : undefined;
  const visibleTeams = teams.filter((t) => filter === 'all' || t.id === filter);
  // 이번 주 예배가 있는 팀만 카드로 (추가된 팀은 캘린더에서 준비 시작)
  const gridTeams = visibleTeams.filter((t) => weekTasks.some((x) => x.teamId === t.id));

  return (
    <div className="app">
      {view === 'home' &&
        (teams.length === 0 ? (
          <EmptyHome onAddTeam={() => setAddTeamOpen(true)} />
        ) : (
          <>
            <Header
              now={now}
              tasks={weekTasks}
              nextServiceDate={nextServiceDday}
              profileName={profile.name || undefined}
            />

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
              <button className="chip-add" aria-label="예배 추가" onClick={() => setAddTeamOpen(true)}>
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
                  <Upcoming rows={upcoming} teams={teams} now={now} onOpenTeam={openTeam} />
                  <WaitingBoard
                    tasks={waiting}
                    teams={teams}
                    now={now}
                    onResolve={clearWaiting}
                    onOpenTeam={openTeam}
                  />
                  <CarriedOver
                    tasks={carried}
                    teams={teams}
                    weeksBack={CARRY_WEEKS}
                    onToggle={toggle}
                  />
                </div>
                {isDesktop ? (
                  <WeeklySummary tasks={tasks} teams={teams} now={now} signature={profile.signature} />
                ) : (
                  /* 모바일에서만 접어둔다 — 데스크톱은 사이드바 컬럼이라 항상 펼쳐져 있어야 한다 */
                  <details className="tm-section">
                    <summary className="tm-section-label">
                      이번 주 완료 기록
                      <span className="tm-section-hint">
                        {weekTasks.filter((t) => t.done).length}/{weekTasks.length} 완료
                      </span>
                    </summary>
                    <WeeklySummary tasks={tasks} teams={teams} now={now} signature={profile.signature} />
                  </details>
                )}
              </div>

              {gridTeams.length > 0 && (
                <>
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
                </>
              )}

              {isDesktop ? (
                <UpcomingServices
                  teams={visibleTeams}
                  tasks={tasks}
                  now={now}
                  onOpenService={openService}
                  onViewAll={() => setView('calendar')}
                />
              ) : (
                <details className="tm-section">
                  <summary className="tm-section-label">다가오는 예배</summary>
                  <UpcomingServices
                    teams={visibleTeams}
                    tasks={tasks}
                    now={now}
                    onOpenService={openService}
                    onViewAll={() => setView('calendar')}
                  />
                </details>
              )}
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

      {view === 'projects' && longViewOn && (
        <ProjectsView
          projects={projects}
          milestones={milestones}
          onAddProject={() => setAddProjectOpen(true)}
          onOpen={(id) => setProjectDetailId(id)}
        />
      )}

      {view === 'mypage' && (
        <MyPage
          teams={teams}
          tasks={tasks}
          profile={profile}
          lineup={lineup}
          notes={notes}
          setlist={setlist}
          noticeTemplates={noticeTemplates}
          onChangeNoticeTemplates={setNoticeTemplates}
          expenses={expenses}
          projects={projects}
          milestones={milestones}
          projectExpenses={projectExpenses}
          longViewOn={longViewOn}
          onToggleLongView={setLongViewOn}
          now={now}
          onSaveProfile={setProfile}
          onShowIntro={() => setEntered(false)}
          onReset={reset}
          onAddTeam={() => setAddTeamOpen(true)}
          onManageTeam={(teamId) => {
            setTeamManageFocus(undefined);
            setReturnToDetail(null);
            setTeamManageId(teamId);
          }}
          onImport={importBackup}
        />
      )}

      <BottomNav active={view} onChange={setView} showProjects={longViewOn} />

      {teams.length > 0 && (view === 'home' || view === 'calendar') && (
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

      {celebration && (
        <Celebration
          teamName={celebration.teamName}
          isThisWeek={celebration.isThisWeek}
          onClose={() => setCelebration(null)}
        />
      )}

      {needRefresh && <UpdateToast onReload={applyUpdate} />}

      {quickOpen && teams.length > 0 && (
        <QuickAdd
          teams={teams}
          defaultTeam={filter === 'all' ? teams[0].id : filter}
          onAdd={(title, teamId, dateStr, memberId) => {
            addTask(title, teamId, dateStr, memberId);
            setQuickOpen(false);
          }}
          onClose={() => setQuickOpen(false)}
        />
      )}

      {addTeamOpen && (
        <TeamForm
          onSave={(values) => {
            addTeam(values);
            setAddTeamOpen(false);
          }}
          onClose={() => setAddTeamOpen(false)}
        />
      )}

      {addProjectOpen && (
        <ProjectForm
          onSave={(values) => {
            addProject(values.title, values.description, values.milestones);
            setAddProjectOpen(false);
          }}
          onClose={() => setAddProjectOpen(false)}
        />
      )}

      {projectDetailId && projectFor && (
        <ProjectDetail
          project={projectFor}
          milestones={milestones
            .filter((m) => m.projectId === projectDetailId)
            .sort((a, b) => a.order - b.order)}
          onRename={updateProjectTitle}
          onEditDescription={updateProjectDescription}
          onToggleComplete={toggleProjectComplete}
          onDelete={deleteProject}
          onAddMilestone={addMilestone}
          onToggleMilestone={toggleMilestone}
          onRenameMilestone={renameMilestone}
          onRemoveMilestone={removeMilestone}
          onReorderMilestones={reorderMilestones}
          projectExpenses={projectExpenses.filter((e) => e.projectId === projectDetailId)}
          onAddProjectExpense={(date, category, title, amount) =>
            addProjectExpense(projectDetailId, date, category, title, amount)
          }
          onRemoveProjectExpense={removeProjectExpense}
          signature={profile.signature}
          onClose={() => setProjectDetailId(null)}
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
          onSetWaiting={setWaiting}
          onClearWaiting={clearWaiting}
          notes={notes}
          onSaveNote={saveNote}
          setlist={setlist}
          onChangeSetlist={setSetlist}
          onAddSong={addSong}
          onAddPack={addPack}
          onOpenLineup={openLineupFor}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
