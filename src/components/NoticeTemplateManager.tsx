import { useState } from 'react';
import type { NoticeClosingTemplate } from '../types';
import { defaultNoticeClosing } from '../lib/share';

interface Props {
  templates: NoticeClosingTemplate[];
  onChange: (templates: NoticeClosingTemplate[]) => void;
}

export default function NoticeTemplateManager({ templates, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [text, setText] = useState('');

  const renameLabel = (i: number, value: string) => {
    onChange(templates.map((t, idx) => (idx === i ? { ...t, label: value } : t)));
  };
  const renameText = (i: number, value: string) => {
    onChange(templates.map((t, idx) => (idx === i ? { ...t, text: value } : t)));
  };
  const removeTemplate = (i: number) => {
    if (!window.confirm(`"${templates[i].label}" 문구를 삭제할까요?`)) return;
    onChange(templates.filter((_, idx) => idx !== i));
  };
  const addTemplate = () => {
    const l = label.trim();
    const t = text.trim();
    if (!l || !t) return;
    onChange([...templates, { id: crypto.randomUUID(), label: l, text: t }]);
    setLabel('');
    setText('');
    setAdding(false);
  };

  return (
    <div className="template-editor">
      <ul className="template-list">
        <li className="template-card">
          <div className="template-card-top">
            <span className="notice-tmpl-default-label">기본</span>
          </div>
          <p className="hint">{defaultNoticeClosing(3)}</p>
          <p className="hint">곡 수는 그때그때 자동으로 채워져요 — 수정·삭제할 수 없어요</p>
        </li>
        {templates.map((t, i) => (
          <li key={t.id} className="template-card">
            <div className="template-card-top">
              <input
                className="text-input template-title-input"
                value={t.label}
                onChange={(e) => renameLabel(i, e.target.value)}
                aria-label="문구 이름"
              />
              <button
                type="button"
                className="tmpl-remove"
                aria-label={`${t.label} 삭제`}
                onClick={() => removeTemplate(i)}
              >
                ✕
              </button>
            </div>
            <input
              className="text-input full"
              value={t.text}
              onChange={(e) => renameText(i, e.target.value)}
              aria-label="마무리 문구 내용"
            />
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="template-add-card">
          <input
            className="text-input full"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="예) 정중한 버전"
            aria-label="새 문구 이름"
          />
          <input
            className="text-input full"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="예) 특이사항 있으면 언제든 편하게 말씀해주세요 🙏"
            aria-label="새 문구 내용"
          />
          <div className="template-add-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>
              취소
            </button>
            <button type="button" className="btn btn-primary" onClick={addTemplate} disabled={!label.trim() || !text.trim()}>
              추가하기
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="tmpl-add-toggle" onClick={() => setAdding(true)}>
          ＋ 새 문구 추가
        </button>
      )}
    </div>
  );
}
