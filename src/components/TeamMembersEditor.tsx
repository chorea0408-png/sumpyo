import { useState } from 'react';
import type { LineupRole, TeamMember } from '../types';
import { LINEUP_ROLES } from '../data/roles';

interface Props {
  members: TeamMember[];
  onChange: (members: TeamMember[]) => void;
}

export default function TeamMembersEditor({ members, onChange }: Props) {
  const [name, setName] = useState('');
  const [roles, setRoles] = useState<LineupRole[]>([]);

  const toggleNewRole = (role: LineupRole) => {
    setRoles((rs) => (rs.includes(role) ? rs.filter((r) => r !== role) : [...rs, role]));
  };

  const addMember = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onChange([...members, { id: crypto.randomUUID(), name: trimmed, roles }]);
    setName('');
    setRoles([]);
  };

  const removeMember = (id: string, memberName: string) => {
    if (window.confirm(`${memberName}님을 명단에서 삭제할까요?`)) {
      onChange(members.filter((m) => m.id !== id));
    }
  };

  const toggleMemberRole = (id: string, role: LineupRole) => {
    onChange(
      members.map((m) =>
        m.id === id
          ? { ...m, roles: m.roles.includes(role) ? m.roles.filter((r) => r !== role) : [...m.roles, role] }
          : m,
      ),
    );
  };

  return (
    <div className="members-editor">
      {members.length > 0 && (
        <ul className="member-role-list">
          {members.map((m) => (
            <li key={m.id} className="member-role-row">
              <div className="member-role-head">
                <span className="member-role-name">{m.name}</span>
                <button type="button" aria-label={`${m.name} 삭제`} onClick={() => removeMember(m.id, m.name)}>
                  ✕
                </button>
              </div>
              <div className="role-chip-row">
                {LINEUP_ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`role-chip${m.roles.includes(r.id) ? ' active' : ''}`}
                    aria-pressed={m.roles.includes(r.id)}
                    onClick={() => toggleMemberRole(m.id, r.id)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="field-label">팀원 추가</p>
      <div className="member-add-row">
        <input
          className="text-input full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름 입력"
          aria-label="팀원 이름"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addMember();
            }
          }}
        />
      </div>
      <div className="role-chip-row">
        {LINEUP_ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`role-chip${roles.includes(r.id) ? ' active' : ''}`}
            aria-pressed={roles.includes(r.id)}
            onClick={() => toggleNewRole(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>
      <button type="button" className="member-add-btn full submit-gap" onClick={addMember} disabled={!name.trim()}>
        팀원 추가하기
      </button>
    </div>
  );
}
