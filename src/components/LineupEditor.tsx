import { useMemo, useState } from 'react';
import type { LineupAssignment, Team } from '../types';
import { recommendLineup, type LineupPick } from '../lib/lineup';
import { LINEUP_ROLES, roleLabel, teamLineupSlots } from '../data/roles';
import { fmtDateShort, nextServiceOn } from '../lib/date';
import { copyText, noticeText } from '../lib/share';

type CopyState = 'idle' | 'ok' | 'fail';

interface Props {
  team: Team;
  now: Date;
  history: LineupAssignment[];
  onConfirm: (service: string, picks: LineupPick[]) => void;
  signature?: string;
}

export default function LineupEditor({ team, now, history, onConfirm, signature }: Props) {
  const members = team.members ?? [];
  const slots = teamLineupSlots(team.lineupSlots);
  const service = useMemo(
    () => nextServiceOn(team.serviceWeekday, now).toISOString(),
    [team.serviceWeekday, now],
  );

  const confirmedRecords = useMemo(
    () => history.filter((a) => a.teamId === team.id && a.service === service),
    [history, team.id, service],
  );

  const picksFromConfirmed = (): LineupPick[] =>
    slots.map((slot) => {
      const ids = confirmedRecords.filter((a) => a.role === slot.role).map((a) => a.memberId);
      const memberIds: (string | null)[] = ids.slice(0, slot.count);
      while (memberIds.length < slot.count) memberIds.push(null);
      return { role: slot.role, memberIds };
    });

  const picksFromRecommendation = (): LineupPick[] => recommendLineup(team.id, members, slots, history);

  const [editing, setEditing] = useState(confirmedRecords.length === 0);
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [picks, setPicks] = useState<LineupPick[]>(() =>
    confirmedRecords.length > 0 ? picksFromConfirmed() : picksFromRecommendation(),
  );

  const startEdit = () => {
    setPicks(confirmedRecords.length > 0 ? picksFromConfirmed() : picksFromRecommendation());
    setEditing(true);
  };

  const setSlotMember = (roleIdx: number, seatIdx: number, memberId: string) => {
    setPicks((prev) =>
      prev.map((p, i) =>
        i === roleIdx
          ? { ...p, memberIds: p.memberIds.map((v, j) => (j === seatIdx ? memberId || null : v)) }
          : p,
      ),
    );
  };

  const handleConfirm = () => {
    onConfirm(service, picks);
    setEditing(false);
    setJustConfirmed(true);
    setTimeout(() => setJustConfirmed(false), 2500);
  };

  const nameOf = (id: string | null) => (id ? (members.find((m) => m.id === id)?.name ?? '(삭제된 팀원)') : '');

  const [copied, setCopied] = useState<CopyState>('idle');
  const copyNotice = async () => {
    const ok = await copyText(noticeText(team, service, picks, members, signature));
    setCopied(ok ? 'ok' : 'fail');
    setTimeout(() => setCopied('idle'), 2500);
  };
  const copyLabel =
    copied === 'ok' ? '복사했어요 ✓' : copied === 'fail' ? '이 환경에선 복사가 막혀 있어요' : '공지문 복사';

  if (members.length === 0) {
    return <p className="lineup-empty">팀원을 먼저 등록하면 라인업을 추천해드려요.</p>;
  }

  return (
    <div className="lineup-editor">
      <p className="lineup-service">
        {fmtDateShort(new Date(service))} · {team.serviceName} 라인업
      </p>

      {!editing ? (
        <>
          {justConfirmed && <p className="import-msg">라인업을 확정했어요</p>}
          <ul className="lineup-confirmed">
            {picks.map((p) => (
              <li key={p.role} className="lineup-confirmed-row">
                <span className="lineup-role-label">{roleLabel(p.role)}</span>
                <span className="lineup-names">
                  {p.memberIds.filter(Boolean).length > 0
                    ? p.memberIds
                        .filter(Boolean)
                        .map((id) => nameOf(id))
                        .join(', ')
                    : '미정'}
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-soft full submit-gap" onClick={copyNotice}>
            {copyLabel}
          </button>
          <p className="hint">카톡에 붙여넣어 팀에 공지할 수 있어요</p>
          <button type="button" className="btn btn-primary full delete-gap" onClick={startEdit}>
            다시 정하기
          </button>
        </>
      ) : (
        <>
          <p className="hint">최근에 이 역할을 맡지 않은 팀원을 우선 추천했어요. 필요하면 바꿔주세요.</p>
          {LINEUP_ROLES.map((meta) => {
            const idx = picks.findIndex((p) => p.role === meta.id);
            if (idx === -1) return null;
            const pick = picks[idx];
            const eligible = members.filter((m) => m.roles.includes(meta.id));
            return (
              <div key={meta.id} className="lineup-slot">
                <span className="lineup-role-label">{meta.label}</span>
                <div className="lineup-seats">
                  {eligible.length === 0 ? (
                    <span className="lineup-none">이 역할을 맡은 팀원이 없어요</span>
                  ) : (
                    pick.memberIds.map((memberId, seatIdx) => (
                      <select
                        key={seatIdx}
                        className="date-input lineup-select"
                        value={memberId ?? ''}
                        onChange={(e) => setSlotMember(idx, seatIdx, e.target.value)}
                        aria-label={`${meta.label} ${seatIdx + 1}번`}
                      >
                        <option value="">미정</option>
                        {eligible.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    ))
                  )}
                </div>
              </div>
            );
          })}
          <button type="button" className="btn btn-primary full submit-gap" onClick={handleConfirm}>
            라인업 확정하기
          </button>
        </>
      )}
    </div>
  );
}
