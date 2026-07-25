interface Props {
  teamName: string;
  /** 지난 예배를 뒤늦게 마무리한 경우엔 '이번 주'라고 하면 안 된다 */
  isThisWeek: boolean;
  onClose: () => void;
}

export default function Celebration({ teamName, isThisWeek, onClose }: Props) {
  return (
    <div className="celebration-overlay" onClick={onClose} role="status">
      <div className="celebration-card">
        <span className="celebration-icon" aria-hidden>
          🌿
        </span>
        <p className="celebration-text">
          {isThisWeek ? '이번 주 ' : ''}
          {teamName} 예배 준비를
          <br />
          모두 마쳤어요
        </p>
      </div>
    </div>
  );
}
