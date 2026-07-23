import { useState } from 'react';
import type { TemplateStep } from '../types';

interface Props {
  steps: TemplateStep[];
  isCustom: boolean;
  onChange: (steps: TemplateStep[] | undefined) => void;
}

export default function TemplateEditor({ steps, isCustom, onChange }: Props) {
  const [title, setTitle] = useState('');
  const [before, setBefore] = useState(1);
  const [hour, setHour] = useState(21);

  const renameStep = (i: number, value: string) => {
    onChange(steps.map((s, idx) => (idx === i ? { ...s, title: value } : s)));
  };
  const removeStep = (i: number) => {
    onChange(steps.filter((_, idx) => idx !== i));
  };
  const moveStep = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const next = steps.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const addStep = () => {
    const t = title.trim();
    if (!t) return;
    onChange([...steps, { key: `custom-${crypto.randomUUID()}`, title: t, before, h: hour }]);
    setTitle('');
    setBefore(1);
    setHour(21);
  };

  return (
    <div className="template-editor">
      <ul className="template-list">
        {steps.map((s, i) => (
          <li key={s.key} className="template-row">
            <div className="template-order">
              <button
                type="button"
                className="tmpl-move"
                aria-label="위로 이동"
                disabled={i === 0}
                onClick={() => moveStep(i, -1)}
              >
                ▲
              </button>
              <button
                type="button"
                className="tmpl-move"
                aria-label="아래로 이동"
                disabled={i === steps.length - 1}
                onClick={() => moveStep(i, 1)}
              >
                ▼
              </button>
            </div>
            <input
              className="text-input template-title-input"
              value={s.title}
              onChange={(e) => renameStep(i, e.target.value)}
              aria-label="단계 이름"
            />
            <span className="template-timing">
              D-{s.before} · {s.h}시
            </span>
            <button type="button" className="tmpl-remove" aria-label={`${s.title} 삭제`} onClick={() => removeStep(i)}>
              ✕
            </button>
          </li>
        ))}
      </ul>

      <p className="field-label">새 단계 추가</p>
      <div className="template-add-row">
        <input
          className="text-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예) 특송 준비"
          aria-label="새 단계 이름"
        />
        <input
          className="date-input template-num"
          type="number"
          min={0}
          max={14}
          value={before}
          onChange={(e) => setBefore(Number(e.target.value))}
          aria-label="예배 며칠 전"
        />
        <input
          className="date-input template-num"
          type="number"
          min={0}
          max={23}
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          aria-label="마감 시각"
        />
        <button type="button" className="member-add-btn" onClick={addStep} disabled={!title.trim()}>
          추가
        </button>
      </div>
      <p className="hint">예배일로부터 며칠 전, 몇 시까지인지 정해요 (0 = 예배 당일)</p>

      {isCustom && (
        <button type="button" className="edit-delete full delete-gap" onClick={() => onChange(undefined)}>
          기본 템플릿으로 되돌리기
        </button>
      )}
    </div>
  );
}
