interface Props {
  onShowIntro: () => void;
  onReset: () => void;
}

export default function MyPage({ onShowIntro, onReset }: Props) {
  return (
    <div className="container main mypage">
      <h1 className="mypage-title">마이페이지</h1>

      <section className="card mypage-section">
        <button className="mypage-row" onClick={onShowIntro}>
          <span>숨표 소개 다시 보기</span>
          <span className="mypage-arrow">›</span>
        </button>
        <button className="mypage-row mypage-danger" onClick={onReset}>
          <span>데모 데이터 초기화</span>
          <span className="mypage-arrow">›</span>
        </button>
      </section>

      <p className="mypage-tagline">숨표 — 예배 준비는 보이게, 내 시간에는 숨표를.</p>
    </div>
  );
}
