import { useEffect, useState } from 'react';
import type { Project, ProjectId, ProjectMilestone } from '../types';
import { ProgressBar } from './ui';

interface Props {
  project: Project;
  /** 이 프로젝트의 마일스톤만, order 오름차순으로 이미 정렬돼 들어온다 */
  milestones: ProjectMilestone[];
  onRename: (id: ProjectId, title: string) => void;
  onEditDescription: (id: ProjectId, description: string) => void;
  onToggleComplete: (id: ProjectId) => void;
  onDelete: (id: ProjectId) => void;
  onAddMilestone: (projectId: ProjectId, title: string) => void;
  onToggleMilestone: (id: string) => void;
  onRenameMilestone: (id: string, title: string) => void;
  onRemoveMilestone: (id: string) => void;
  onReorderMilestones: (projectId: ProjectId, milestones: ProjectMilestone[]) => void;
  onClose: () => void;
}

export default function ProjectDetail({
  project,
  milestones,
  onRename,
  onEditDescription,
  onToggleComplete,
  onDelete,
  onAddMilestone,
  onToggleMilestone,
  onRenameMilestone,
  onRemoveMilestone,
  onReorderMilestones,
  onClose,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

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

  const done = milestones.filter((m) => m.done).length;
  const total = milestones.length;

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= milestones.length) return;
    const next = milestones.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onReorderMilestones(
      project.id,
      next.map((m, idx) => ({ ...m, order: idx })),
    );
  };

  const remove = (m: ProjectMilestone) => {
    if (!window.confirm(`"${m.title}" 항목을 삭제할까요?`)) return;
    onRemoveMilestone(m.id);
  };

  const addMilestone = () => {
    const t = newTitle.trim();
    if (!t) return;
    onAddMilestone(project.id, t);
    setNewTitle('');
    setAdding(false);
  };

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="sheet" role="dialog" aria-modal="true" aria-label={`${project.title} 프로젝트`}>
        <header className="sheet-head">
          <h3>프로젝트</h3>
          <button className="icon-btn" aria-label="닫기" onClick={onClose}>
            ✕
          </button>
        </header>

        <label className="profile-field">
          <span className="field-label">이름</span>
          <input
            className="text-input full"
            value={project.title}
            onChange={(e) => onRename(project.id, e.target.value)}
            aria-label="프로젝트 이름"
          />
        </label>
        <label className="profile-field">
          <span className="field-label">설명 (선택)</span>
          <input
            className="text-input full"
            value={project.description ?? ''}
            onChange={(e) => onEditDescription(project.id, e.target.value)}
            placeholder="예) 8월 3주차, 강원도"
            aria-label="프로젝트 설명"
          />
        </label>

        {total > 0 && (
          <div className="sheet-progress">
            <span>
              <b>{done}</b>/{total} 완료
            </span>
            <ProgressBar value={total ? done / total : 0} label={`${project.title} 진행 ${done}/${total}`} />
          </div>
        )}

        <button type="button" className="btn btn-soft full submit-gap" onClick={() => onToggleComplete(project.id)}>
          {project.completedAt ? '진행 중으로 되돌리기' : '완료로 표시'}
        </button>

        <ul className="template-list">
          {milestones.map((m, i) => (
            <li key={m.id} className="template-card">
              <div className="template-card-top">
                <button
                  type="button"
                  className={`check-circle${m.done ? ' on' : ''}`}
                  aria-pressed={m.done}
                  aria-label={`${m.title} ${m.done ? '완료 해제' : '완료로 표시'}`}
                  onClick={() => onToggleMilestone(m.id)}
                >
                  ✓
                </button>
                <div className="template-order">
                  <button
                    type="button"
                    className="tmpl-move"
                    aria-label="위로 이동"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="tmpl-move"
                    aria-label="아래로 이동"
                    disabled={i === milestones.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    ▼
                  </button>
                </div>
                <input
                  className={`text-input template-title-input${m.done ? ' is-done' : ''}`}
                  value={m.title}
                  onChange={(e) => onRenameMilestone(m.id, e.target.value)}
                  aria-label="체크리스트 항목"
                />
                <button
                  type="button"
                  className="tmpl-remove"
                  aria-label={`${m.title} 삭제`}
                  onClick={() => remove(m)}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>

        {adding ? (
          <div className="template-add-card">
            <input
              className="text-input full"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="예) 숙소 예약"
              aria-label="새 체크리스트 항목"
            />
            <div className="template-add-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>
                취소
              </button>
              <button type="button" className="btn btn-primary" onClick={addMilestone} disabled={!newTitle.trim()}>
                추가하기
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="tmpl-add-toggle" onClick={() => setAdding(true)}>
            ＋ 새 항목 추가
          </button>
        )}

        <button
          type="button"
          className="edit-delete full delete-gap"
          onClick={() => {
            if (!window.confirm(`"${project.title}" 프로젝트를 삭제할까요? 체크리스트도 함께 사라져요.`)) return;
            onDelete(project.id);
          }}
        >
          이 프로젝트 삭제하기
        </button>
      </section>
    </div>
  );
}
