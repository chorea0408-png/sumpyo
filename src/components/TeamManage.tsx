import { useState } from 'react';
import type { LineupAssignment, LineupRole, LineupSlot, Team, TeamMember, TemplateStep } from '../types';
import { WEEKDAYS_KO } from '../lib/date';
import { WORSHIP_TEMPLATE } from '../data/template';
import { LINEUP_ROLES, teamLineupSlots } from '../data/roles';
import type { LineupPick } from '../lib/lineup';
import TeamMembersEditor from './TeamMembersEditor';
import LineupEditor from './LineupEditor';
import TemplateEditor from './TemplateEditor';

export interface BasicInfo {
  shortName: string;
  serviceName: string;
  weekday: number;
  pastorLabel: string;
  songCount: number;
}

interface Props {
  team: Team;
  now: Date;
  history: LineupAssignment[];
  onBack: () => void;
  onUpdateBasic: (values: BasicInfo) => void;
  onUpdateMembers: (members: TeamMember[]) => void;
  onUpdateLineupSlots: (slots: LineupSlot[] | undefined) => void;
  onConfirmLineup: (service: string, picks: LineupPick[]) => void;
  onUpdateTemplate: (template: TemplateStep[] | undefined) => void;
  onDelete: () => void;
}

export default function TeamManage({
  team,
  now,
  history,
  onBack,
  onUpdateBasic,
  onUpdateMembers,
  onUpdateLineupSlots,
  onConfirmLineup,
  onUpdateTemplate,
  onDelete,
}: Props) {
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

  const changeSlotCount = (role: LineupRole, count: number) => {
    const next: LineupSlot[] = LINEUP_ROLES.map((r) => ({
      role: r.id,
      count: r.id === role ? count : (slots.find((s) => s.role === r.id)?.count ?? 0),
    })).filter((s) => s.count > 0);
    onUpdateLineupSlots(next.length > 0 ? next : undefined);
  };

  const template = team.customTemplate && team.customTemplate.length > 0 ? team.customTemplate : WORSHIP_TEMPLATE;
  const isCustomTemplate = !!(team.customTemplate && team.customTemplate.length > 0);

  return (
    <div className="container main teammanage">
      <header className="tm-header">
        <button className="icon-btn" aria-label="마이페이지로 돌아가기" onClick={onBack}>
          ‹
        </button>
        <h1 className="tm-title">{team.shortName} 관리</h1>
      </header>

      <p className="mypage-section-label">기본정보</p>
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

      <p className="mypage-section-label">팀원 & 역할</p>
      <section className="card mypage-section tm-members">
        <TeamMembersEditor members={team.members ?? []} onChange={onUpdateMembers} />
      </section>

      <p className="mypage-section-label">라인업</p>
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
        <LineupEditor key={slotsKey} team={team} now={now} history={history} onConfirm={onConfirmLineup} />
      </section>

      <p className="mypage-section-label">준비팩 구성</p>
      <section className="card mypage-section tm-template">
        <TemplateEditor steps={template} isCustom={isCustomTemplate} onChange={onUpdateTemplate} />
      </section>

      <button type="button" className="mypage-row mypage-danger tm-delete card" onClick={onDelete}>
        <span>이 팀 삭제하기</span>
      </button>
    </div>
  );
}
