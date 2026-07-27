export type ViewId = 'home' | 'calendar' | 'projects' | 'mypage';

interface Props {
  active: ViewId;
  onChange: (v: ViewId) => void;
  /** '길게 보기' 모드가 켜져 있을 때만 프로젝트 탭을 보여준다 */
  showProjects: boolean;
}

const ALL_TABS: { id: ViewId; label: string; icon: string }[] = [
  { id: 'home', label: '홈', icon: '🏠' },
  { id: 'calendar', label: '캘린더', icon: '📅' },
  { id: 'projects', label: '프로젝트', icon: '📋' },
  { id: 'mypage', label: '마이페이지', icon: '👤' },
];

export default function BottomNav({ active, onChange, showProjects }: Props) {
  const tabs = showProjects ? ALL_TABS : ALL_TABS.filter((t) => t.id !== 'projects');
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      <span className="bn-brand" aria-hidden>
        숨표
      </span>
      <div className="bn-pills">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`bn-item${active === t.id ? ' on' : ''}`}
            aria-current={active === t.id ? 'page' : undefined}
            onClick={() => onChange(t.id)}
          >
            <span className="bn-icon" aria-hidden>
              {t.icon}
            </span>
            <span className="bn-label">{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
