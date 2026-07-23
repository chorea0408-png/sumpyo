export type ViewId = 'home' | 'calendar' | 'mypage';

interface Props {
  active: ViewId;
  onChange: (v: ViewId) => void;
}

const TABS: { id: ViewId; label: string; icon: string }[] = [
  { id: 'home', label: '홈', icon: '🏠' },
  { id: 'calendar', label: '캘린더', icon: '📅' },
  { id: 'mypage', label: '마이페이지', icon: '👤' },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {TABS.map((t) => (
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
    </nav>
  );
}
