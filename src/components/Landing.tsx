interface Props {
  onEnter: () => void;
}

const POINTS = [
  { icon: '🌿', title: '현황 파악', desc: '세 팀의 이번 주 진행률을 한 화면에서' },
  { icon: '⏱️', title: '다음 행동', desc: '마감 기준으로 가장 급한 한 가지를 자동으로' },
  { icon: '🔔', title: '누락 방지', desc: '놓치기 쉬운 공지·라인업까지 미리 챙기게' },
];

export default function Landing({ onEnter }: Props) {
  return (
    <div className="landing">
      <div className="landing-inner">
        <p className="landing-eyebrow">여러 찬양팀을 병행하는 인도자를 위한 주간 준비 대시보드</p>
        <h1 className="landing-logo">숨표</h1>
        <p className="landing-tagline">예배 준비는 보이게, 내 시간에는 숨표를.</p>

        <p className="landing-lead">
          세 팀의 콘티·악보·라인업·공지가 카톡과 메모장에 흩어져 있나요?
          <br />
          숨표는 <b>이번 주 준비 현황</b>과 <b>지금 해야 할 한 가지</b>를 한 화면에 모아줍니다.
        </p>

        <ul className="landing-points">
          {POINTS.map((p) => (
            <li key={p.title} className="landing-point">
              <span className="lp-icon" aria-hidden>
                {p.icon}
              </span>
              <div>
                <p className="lp-title">{p.title}</p>
                <p className="lp-desc">{p.desc}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="landing-diff">
          Praise Hub가 팀에게 콘티를 <b>공유</b>하는 앱이라면, 숨표는 인도자 혼자서도 이번 주의
          <b> 병목과 다음 행동을 파악</b>하는 도구입니다.
        </div>

        <button className="btn btn-primary landing-cta" onClick={onEnter}>
          이번 주 현황 보기 →
        </button>
        <p className="landing-foot">설치 없이 바로 시작 · 데이터는 내 기기에만 저장돼요</p>
      </div>
    </div>
  );
}
