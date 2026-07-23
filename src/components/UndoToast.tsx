interface Props {
  title: string;
  onUndo: () => void;
}

export default function UndoToast({ title, onUndo }: Props) {
  return (
    <div className="undo-toast" role="status">
      <span className="undo-text">“{title}” 완료했어요</span>
      <button className="undo-btn" onClick={onUndo}>
        취소
      </button>
    </div>
  );
}
