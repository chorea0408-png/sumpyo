import { useState } from 'react';
import type { TemplateStep } from '../types';

interface Props {
  steps: TemplateStep[];
  isCustom: boolean;
  onChange: (steps: TemplateStep[] | undefined) => void;
}

function MiniStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mini-stepper">
      <button type="button" aria-label={`${label} 줄이기`} onClick={() => onChange(Math.max(min, value - 1))}>
        −
      </button>
      <span>{label}</span>
      <button type="button" aria-label={`${label} 늘리기`} onClick={() => onChange(Math.min(max, value + 1))}>
        ＋
      </button>
    </div>
  );
}

export default function TemplateEditor({ steps, isCustom, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [before, setBefore] = useState(1);
  const [hour, setHour] = useState(21);

  const renameStep = (i: number, value: string) => {
    onChange(steps.map((s, idx) => (idx === i ? { ...s, title: value } : s)));
  };
  const restepStep = (i: number, patch: Partial<Pick<TemplateStep, 'before' | 'h'>>) => {
    onChange(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };
  const removeStep = (i: number) => {
    if (!window.confirm(`"${steps[i].title}" 단계를 삭제할까요?`)) return;
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
    setAdding(false);
  };

  return (
    <div className="template-editor">
      <ul className="template-list">
        {steps.map((s, i) => (
          <li key={s.key} className="template-card">
            <div className="template-card-top">
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
              <button type="button" className="tmpl-remove" aria-label={`${s.title} 삭제`} onClick={() => removeStep(i)}>
                ✕
              </button>
            </div>
            <div className="template-card-timing">
              <span className="tmpl-timing-label">예배</span>
              <MiniStepper
                label={`${s.before}일 전`}
                value={s.before}
                min={0}
                max={14}
                onChange={(v) => restepStep(i, { before: v })}
              />
              <MiniStepper
                label={`${s.h}시`}
                value={s.h}
                min={0}
                max={23}
                onChange={(v) => restepStep(i, { h: v })}
              />
            </div>
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="template-add-card">
          <input
            className="text-input full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 특송 준비"
            aria-label="새 단계 이름"
          />
          <div className="template-card-timing">
            <span className="tmpl-timing-label">예배</span>
            <MiniStepper label={`${before}일 전`} value={before} min={0} max={14} onChange={setBefore} />
            <MiniStepper label={`${hour}시`} value={hour} min={0} max={23} onChange={setHour} />
          </div>
          <p className="hint">예배일로부터 며칠 전, 몇 시까지인지예요 (0일 전 = 예배 당일)</p>
          <div className="template-add-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>
              취소
            </button>
            <button type="button" className="btn btn-primary" onClick={addStep} disabled={!title.trim()}>
              추가하기
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="tmpl-add-toggle" onClick={() => setAdding(true)}>
          ＋ 새 단계 추가
        </button>
      )}

      {isCustom && (
        <button type="button" className="edit-delete full delete-gap" onClick={() => onChange(undefined)}>
          기본 템플릿으로 되돌리기
        </button>
      )}
    </div>
  );
}
