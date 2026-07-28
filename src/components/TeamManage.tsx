import { useEffect, useState } from 'react';
import type {
  Expense,
  ExpenseCategory,
  LineupAssignment,
  LineupRole,
  LineupSlot,
  NoticeClosingTemplate,
  ServiceNote,
  Team,
  TeamId,
  TeamMember,
  TemplateStep,
} from '../types';
import { WEEKDAYS_KO, nextServiceOn } from '../lib/date';
import { WORSHIP_TEMPLATE } from '../data/template';
import { LINEUP_ROLES, teamLineupSlots } from '../data/roles';
import type { LineupPick } from '../lib/lineup';
import TeamMembersEditor from './TeamMembersEditor';
import LineupEditor from './LineupEditor';
import LineupHistory from './LineupHistory';
import ServiceNoteHistory from './ServiceNoteHistory';
import MemberGrowth from './MemberGrowth';
import ExpenseTracker from './ExpenseTracker';
import TemplateEditor from './TemplateEditor';
import BottomNav, { type ViewId } from './BottomNav';

export interface BasicInfo {
  shortName: string;
  serviceName: string;
  weekday: number;
  pastorLabel: string;
  songCount: number;
}

export type TeamManageSection = 'basic' | 'members' | 'lineup' | 'template' | 'notes' | 'growth' | 'budget';

interface Props {
  team: Team;
  now: Date;
  history: LineupAssignment[];
  /** 특정 섹션을 펼친 채로 시작하고 싶을 때(예: 체크리스트의 '라인업 확정' 항목에서 진입) — 없으면 기본정보 */
  focusSection?: TeamManageSection;
  /** 뒤로가기 버튼의 안내 문구 — 진입 경로에 따라 복귀할 화면이 다르다 */
  backLabel: string;
  /** 공지문에 자동으로 붙는 서명 문구 */
  signature?: string;
  notes: ServiceNote[];
  noticeTemplates: NoticeClosingTemplate[];
  expenses: Expense[];
  onAddExpense: (teamId: TeamId, date: string, category: ExpenseCategory, title: string, amount: number) => void;
  onRemoveExpense: (id: string) => void;
  onBack: () => void;
  onUpdateBasic: (values: BasicInfo) => void;
  onUpdateMembers: (members: TeamMember[]) => void;
  onUpdateLineupSlots: (slots: LineupSlot[] | undefined) => void;
  onConfirmLineup: (service: string, picks: LineupPick[]) => void;
  onUpdateTemplate: (template: TemplateStep[] | undefined) => void;
  onDelete: () => void;
  /** 데스크톱 상단 네비에서 다른 탭 선택 시 — 팀 관리 상태를 정리하고 이동 */
  onNavigate: (v: ViewId) => void;
  /** 상단 네비에 프로젝트 탭을 보여줄지 — App.tsx의 longViewOn 그대로 전달 */
  longViewOn: boolean;
}

export default function TeamManage({
  team,
  now,
  history,
  focusSection,
  backLabel,
  signature,
  notes,
  noticeTemplates,
  expenses,
  onAddExpense,
  onRemoveExpense,
  onBack,
  onUpdateBasic,
  onUpdateMembers,
  onUpdateLineupSlots,
  onConfirmLineup,
  onUpdateTemplate,
  onDelete,
  onNavigate,
  longViewOn,
}: Props) {
  const [section, setSection] = useState<TeamManageSection>(focusSection ?? 'basic');
  useEffect(() => {
    if (focusSection) setSection(focusSection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSection]);
  const [shortName, setShortName] = useState(team.shortName);
  const [serviceName, setServiceName] = useState(team.serviceName);
  const [weekday, setWeekday] = useState(team.serviceWeekday);
  const [pastorLabel, setPastorLabel] = useState(team.pastorLabel);
  const [songCount, setSongCount] = useState(team.songCount);

  const save = (patch: Partial<BasicInfo>) => {
    onUpdateBasic({ shortName, serviceName, weekday, pastorLabel, songCount, ...patch });
  };

  const slots = teamLineupSlots(team.lineupSlots);
  const slotsKey = slots.map((s) => `${s.role}:${s.count}`).join(',');
  const members = team.members ?? [];

  const changeSlotCount = (role: LineupRole, count: number) => {
    const next: LineupSlot[] = LINEUP_ROLES.map((r) => ({
      role: r.id,
      count: r.id === role ? count : (slots.find((s) => s.role === r.id)?.count ?? 0),
    })).filter((s) => s.count > 0);
    onUpdateLineupSlots(next.length > 0 ? next : undefined);
  };

  const template = team.customTemplate && team.customTemplate.length > 0 ? team.customTemplate : WORSHIP_TEMPLATE;
  const isCustomTemplate = !!(team.customTemplate && team.customTemplate.length > 0);

  /** 다음 예배 라인업이 이미 확정됐는지 — LineupEditor.tsx가 편집 모드를 여는 조건과 동일한 판정 */
  const nextService = nextServiceOn(team.serviceWeekday, now).toISOString();
  const lineupConfirmed = history.some((a) => a.teamId === team.id && a.service === nextService);
  const teamExpenseCount = expenses.filter((e) => e.teamId === team.id).length;

  return (
    <div className="container main teammanage">
      <div className="tm-nav-wrap">
        <BottomNav active="mypage" onChange={onNavigate} showProjects={longViewOn} />
      </div>
      <header className="tm-header">
        <button className="icon-btn" aria-label={backLabel} onClick={onBack}>
          ‹
        </button>
        <h1 className="tm-title">{team.shortName} 관리</h1>
      </header>

      <div className="tm-body">
        <h2 className="tm-section-head">
          <button
            type="button"
            className="tm-section-label"
            aria-expanded={section === 'basic'}
            aria-controls="tm-panel-basic"
            onClick={() => setSection('basic')}
          >
            <span className="tm-chevron" aria-hidden>▸</span>
            기본정보
            <span className="tm-section-hint">{team.serviceName}</span>
          </button>
        </h2>
        <div id="tm-panel-basic" className="tm-panel" hidden={section !== 'basic'}>
          <section className="card mypage-section tm-basic">
            <label className="profile-field">
              <span className="field-label">카테고리 이름</span>
              <input
                className="text-input full"
                value={shortName}
                onChange={(e) => {
                  setShortName(e.target.value);
                  save({ shortName: e.target.value });
                }}
                aria-label="카테고리 이름"
              />
            </label>
            <label className="profile-field">
              <span className="field-label">예배 이름</span>
              <input
                className="text-input full"
                value={serviceName}
                onChange={(e) => {
                  setServiceName(e.target.value);
                  save({ serviceName: e.target.value });
                }}
                aria-label="예배 이름"
              />
            </label>
            <div className="profile-field">
              <span className="field-label">예배 요일</span>
              <div className="team-select">
                {WEEKDAYS_KO.map((w, i) => (
                  <button
                    key={w}
                    type="button"
                    className={`filter-chip${weekday === i ? ' active' : ''}`}
                    aria-pressed={weekday === i}
                    onClick={() => {
                      setWeekday(i);
                      save({ weekday: i });
                    }}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
            <label className="profile-field">
              <span className="field-label">교역자 호칭</span>
              <input
                className="text-input full"
                value={pastorLabel}
                onChange={(e) => {
                  setPastorLabel(e.target.value);
                  save({ pastorLabel: e.target.value });
                }}
                aria-label="교역자 호칭"
              />
            </label>
            <div className="profile-field">
              <span className="field-label">콘티 곡 수</span>
              <div className="song-count-row">
                <button
                  type="button"
                  className="count-btn"
                  aria-label="곡 수 줄이기"
                  onClick={() => {
                    const v = Math.max(1, songCount - 1);
                    setSongCount(v);
                    save({ songCount: v });
                  }}
                >
                  −
                </button>
                <span className="count-value">{songCount}곡</span>
                <button
                  type="button"
                  className="count-btn"
                  aria-label="곡 수 늘리기"
                  onClick={() => {
                    const v = Math.min(10, songCount + 1);
                    setSongCount(v);
                    save({ songCount: v });
                  }}
                >
                  ＋
                </button>
              </div>
            </div>
          </section>
        </div>

        <h2 className="tm-section-head">
          <button
            type="button"
            className="tm-section-label"
            aria-expanded={section === 'members'}
            aria-controls="tm-panel-members"
            onClick={() => setSection('members')}
          >
            <span className="tm-chevron" aria-hidden>▸</span>
            팀원 & 역할
            <span className="tm-section-hint">{members.length}명</span>
          </button>
        </h2>
        <div id="tm-panel-members" className="tm-panel" hidden={section !== 'members'}>
          <section className="card mypage-section tm-members">
            <TeamMembersEditor members={members} onChange={onUpdateMembers} />
          </section>
        </div>

        <h2 className="tm-section-head">
          <button
            type="button"
            className="tm-section-label"
            aria-expanded={section === 'lineup'}
            aria-controls="tm-panel-lineup"
            onClick={() => setSection('lineup')}
          >
            <span className="tm-chevron" aria-hidden>▸</span>
            라인업
            <span className="tm-section-hint">{lineupConfirmed ? '확정됨' : '미정'}</span>
          </button>
        </h2>
        <div id="tm-panel-lineup" className="tm-panel" hidden={section !== 'lineup'}>
          <section className="card mypage-section tm-lineup">
            <details className="lineup-slots-config">
              <summary>필요 인원 구성 수정</summary>
              <div className="slots-grid">
                {LINEUP_ROLES.map((r) => {
                  const count = slots.find((s) => s.role === r.id)?.count ?? 0;
                  return (
                    <div key={r.id} className="slot-count-row">
                      <span className="lineup-role-label">{r.label}</span>
                      <div className="song-count-row">
                        <button
                          type="button"
                          className="count-btn"
                          aria-label={`${r.label} 인원 줄이기`}
                          onClick={() => changeSlotCount(r.id, Math.max(0, count - 1))}
                        >
                          −
                        </button>
                        <span className="count-value">{count}</span>
                        <button
                          type="button"
                          className="count-btn"
                          aria-label={`${r.label} 인원 늘리기`}
                          onClick={() => changeSlotCount(r.id, Math.min(8, count + 1))}
                        >
                          ＋
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
            <LineupEditor
              key={slotsKey}
              team={team}
              now={now}
              history={history}
              onConfirm={onConfirmLineup}
              signature={signature}
              noticeTemplates={noticeTemplates}
            />
            <LineupHistory team={team} now={now} history={history} />
          </section>
        </div>

        <h2 className="tm-section-head">
          <button
            type="button"
            className="tm-section-label"
            aria-expanded={section === 'template'}
            aria-controls="tm-panel-template"
            onClick={() => setSection('template')}
          >
            <span className="tm-chevron" aria-hidden>▸</span>
            준비팩 구성
            <span className="tm-section-hint">
              {template.length}단계{isCustomTemplate ? ' · 수정됨' : ''}
            </span>
          </button>
        </h2>
        <div id="tm-panel-template" className="tm-panel" hidden={section !== 'template'}>
          <section className="card mypage-section tm-template">
            <TemplateEditor steps={template} isCustom={isCustomTemplate} onChange={onUpdateTemplate} />
          </section>
        </div>

        <h2 className="tm-section-head">
          <button
            type="button"
            className="tm-section-label"
            aria-expanded={section === 'notes'}
            aria-controls="tm-panel-notes"
            onClick={() => setSection('notes')}
          >
            <span className="tm-chevron" aria-hidden>▸</span>
            지난 예배 기록
            <span className="tm-section-hint">
              {notes.filter((n) => n.teamId === team.id && n.text.trim()).length}개
            </span>
          </button>
        </h2>
        <div id="tm-panel-notes" className="tm-panel" hidden={section !== 'notes'}>
          <section className="card mypage-section tm-notes">
            <ServiceNoteHistory notes={notes} teamId={team.id} />
          </section>
        </div>

        <h2 className="tm-section-head">
          <button
            type="button"
            className="tm-section-label"
            aria-expanded={section === 'growth'}
            aria-controls="tm-panel-growth"
            onClick={() => setSection('growth')}
          >
            <span className="tm-chevron" aria-hidden>▸</span>
            팀원 성장
            <span className="tm-section-hint">{members.length}명</span>
          </button>
        </h2>
        <div id="tm-panel-growth" className="tm-panel" hidden={section !== 'growth'}>
          <section className="card mypage-section tm-growth">
            <MemberGrowth team={team} now={now} history={history} />
          </section>
        </div>

        <h2 className="tm-section-head">
          <button
            type="button"
            className="tm-section-label"
            aria-expanded={section === 'budget'}
            aria-controls="tm-panel-budget"
            onClick={() => setSection('budget')}
          >
            <span className="tm-chevron" aria-hidden>▸</span>
            예산
            <span className="tm-section-hint">{teamExpenseCount}건</span>
          </button>
        </h2>
        <div id="tm-panel-budget" className="tm-panel" hidden={section !== 'budget'}>
          <section className="card mypage-section tm-budget">
            <ExpenseTracker
              teamId={team.id}
              expenses={expenses}
              onAdd={(date, category, title, amount) => onAddExpense(team.id, date, category, title, amount)}
              onRemove={onRemoveExpense}
            />
          </section>
        </div>

        <button type="button" className="mypage-row mypage-danger tm-delete card" onClick={onDelete}>
          <span>이 팀 삭제하기</span>
        </button>
      </div>
    </div>
  );
}
