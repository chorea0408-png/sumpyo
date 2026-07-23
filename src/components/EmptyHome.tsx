interface Props {
  onAddTeam: () => void;
}

export default function EmptyHome({ onAddTeam }: Props) {
  return (
    <div className="container main empty-home">
      <p className="empty-eyebrow">아직 등록된 팀이 없어요</p>
      <h2 className="empty-title">첫 팀을 만들어볼까요?</h2>
      <p className="empty-desc">
        중장년·청소년·청년처럼 맡고 있는 예배를 하나씩 등록하면,
        <br />그 주부터 준비 현황이 여기 보여요.
      </p>
      <button className="btn btn-primary empty-cta" onClick={onAddTeam}>
        ＋ 첫 팀 만들기
      </button>
    </div>
  );
}
