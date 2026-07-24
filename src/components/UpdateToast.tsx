interface Props {
  onReload: () => void;
}

export default function UpdateToast({ onReload }: Props) {
  return (
    <div className="undo-toast" role="status">
      <span className="undo-text">새 버전이 있어요</span>
      <button className="undo-btn" onClick={onReload}>
        새로고침
      </button>
    </div>
  );
}
