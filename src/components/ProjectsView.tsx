import type { Project, ProjectId, ProjectMilestone } from '../types';

interface Props {
  projects: Project[];
  milestones: ProjectMilestone[];
  onAddProject: () => void;
  onOpen: (id: ProjectId) => void;
}

function progressOf(projectId: ProjectId, milestones: ProjectMilestone[]) {
  const own = milestones.filter((m) => m.projectId === projectId);
  return { done: own.filter((m) => m.done).length, total: own.length };
}

export default function ProjectsView({ projects, milestones, onAddProject, onOpen }: Props) {
  const inProgress = projects.filter((p) => !p.completedAt);
  const completed = projects.filter((p) => p.completedAt);

  return (
    <div className="container main projects-view">
      <h1 className="cal-title">프로젝트</h1>
      <p className="cal-sub">수련회·소풍·특별행사 같은 장기 준비를 체크리스트로 관리해요</p>

      <button type="button" className="btn btn-primary proj-add-btn" onClick={onAddProject}>
        ＋ 새 프로젝트
      </button>

      {projects.length === 0 ? (
        <div className="pack-empty">
          <p className="pack-empty-msg">아직 등록된 프로젝트가 없어요.</p>
          <p className="hint">수련회·소풍·특별행사처럼 여러 주에 걸쳐 준비하는 일을 마일스톤으로 나눠 관리해보세요</p>
        </div>
      ) : (
        <>
          {inProgress.length > 0 && (
            <section className="card cal-list">
              {inProgress.map((p) => {
                const { done, total } = progressOf(p.id, milestones);
                return (
                  <button key={p.id} className="svc-item" onClick={() => onOpen(p.id)}>
                    <div className="svc-main">
                      <span className="svc-name">
                        {p.title}
                        {p.description && <span className="svc-date">{p.description}</span>}
                      </span>
                    </div>
                    <span className="svc-open">{total > 0 ? `${done}/${total}` : '체크리스트 없음'}</span>
                  </button>
                );
              })}
            </section>
          )}

          {completed.length > 0 && (
            <details className="cal-month">
              <summary className="cal-month-label">
                완료
                <span className="cal-month-count">{completed.length}건</span>
              </summary>
              <div className="card cal-list">
                {completed.map((p) => {
                  const { done, total } = progressOf(p.id, milestones);
                  return (
                    <button key={p.id} className="svc-item" onClick={() => onOpen(p.id)}>
                      <div className="svc-main">
                        <span className="svc-name">
                          {p.title}
                          {p.description && <span className="svc-date">{p.description}</span>}
                        </span>
                      </div>
                      <span className="svc-open">{total > 0 ? `${done}/${total}` : '체크리스트 없음'}</span>
                    </button>
                  );
                })}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
