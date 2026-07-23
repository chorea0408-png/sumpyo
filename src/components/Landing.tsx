interface Props {
  /** 이미 사용 중인 데이터(데모 또는 실제 팀)가 있으면 true — '소개 다시 보기'로 재방문한 경우 */
  hasData: boolean;
  onContinue: () => void;
  onEnterDemo: () => void;
  onEnterFresh: () => void;
}

const POINTS = [
  { icon: '🌿', title: '현황 파악' },
  { icon: '⏱️', title: '다음 행동' },
  { icon: '🔔', title: '누락 방지' },
];

export default function Landing({ hasData, onContinue, onEnterDemo, onEnterFresh }: Props) {
  return (
    <div className="landing">
      <div className="landing-inner">
        <p className="landing-eyebrow">여러 찬양팀을 병행하는 인도자를 위해</p>
        <img src="/pwa-192.png" alt="" aria-hidden="true" className="landing-mark" />
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

        {hasData ? (
          <button className="btn btn-primary landing-cta" onClick={onContinue}>
            이어서 보기 →
          </button>
        ) : (
          <div className="landing-cta-group">
            <button className="btn btn-primary landing-cta" onClick={onEnterFresh}>
              내 팀으로 시작하기
            </button>
            <button className="btn btn-ghost landing-cta" onClick={onEnterDemo}>
              데모로 둘러보기
            </button>
          </div>
        )}
        <p className="landing-foot">설치 없이 바로 시작 · 데이터는 내 기기에만 저장돼요</p>
      </div>
    </div>
  );
}
