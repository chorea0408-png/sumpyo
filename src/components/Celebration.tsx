interface Props {
  teamName: string;
  onClose: () => void;
}

export default function Celebration({ teamName, onClose }: Props) {
  return (
    <div className="celebration-overlay" onClick={onClose} role="status">
      <div className="celebration-card">
        <span className="celebration-icon" aria-hidden>
          🌿
        </span>
        <p className="celebration-text">
          이번 주 {teamName} 예배 준비를
          <br />
          모두 마쳤어요
        </p>
      </div>
    </div>
  );
}
