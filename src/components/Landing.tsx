interface Props {
  onEnter: () => void;
}

const POINTS = [
  { icon: '🌿', title: '현황 파악' },
  { icon: '⏱️', title: '다음 행동' },
  { icon: '🔔', title: '누락 방지' },
];

export default function Landing({ onEnter }: Props) {
  return (
    <div className="landing">
      <div className="landing-inner">
        <p className="landing-eyebrow">여러 찬양팀을 병행하는 인도자를 위해</p>
        <h1 className="landing-logo">숨표</h1>
        <p className="landing-tagline">예배 준비는 보이게, 내 시간에는 숨표를.</p>

        <ul className="landing-points">
          {POINTS.map((p) => (
            <li key={p.title} className="landing-point">
              <span className="lp-icon" aria-hidden>
                {p.icon}
              </span>
              <p className="lp-title">{p.title}</p>
            </li>
          ))}
        </ul>

        <button className="btn btn-primary landing-cta" onClick={onEnter}>
          이번 주 현황 보기 →
        </button>
        <p className="landing-foot">설치 없이 바로 시작 · 데이터는 내 기기에만 저장돼요</p>
      </div>
    </div>
  );
}
