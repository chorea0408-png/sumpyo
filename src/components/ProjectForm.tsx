import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PROJECT_PRESETS } from '../data/projectPresets';

export interface ProjectFormValues {
  title: string;
  description?: string;
  milestones?: string[];
}

interface Props {
  onSave: (values: ProjectFormValues) => void;
  onClose: () => void;
}

export default function ProjectForm({ onSave, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [presetId, setPresetId] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const preset = PROJECT_PRESETS.find((p) => p.id === presetId);

  useEffect(() => {
    document.body.classList.add('lock');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const focusTimer = window.setTimeout(() => titleInputRef.current?.focus(), 200);
    return () => {
      document.body.classList.remove('lock');
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(focusTimer);
    };
  }, [onClose]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      milestones: preset?.milestones,
    });
  };

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="sheet sheet-compact" role="dialog" aria-modal="true" aria-label="프로젝트 추가">
        <header className="sheet-head">
          <h3 className="sheet-title">새 프로젝트</h3>
          <button className="icon-btn" aria-label="닫기" onClick={onClose}>
            ✕
          </button>
        </header>
        <form onSubmit={submit}>
          <p className="field-label">프로젝트 이름</p>
          <input
            ref={titleInputRef}
            className="text-input full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 여름 수련회, 가을 소풍"
            aria-label="프로젝트 이름"
          />
          <p className="field-label">설명 (선택)</p>
          <input
            className="text-input full"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="예) 8월 3주차, 강원도"
            aria-label="프로젝트 설명"
          />

          <p className="field-label">시작 체크리스트 (선택)</p>
          <div className="team-select">
            <button
              type="button"
              className={`filter-chip${!presetId ? ' active' : ''}`}
              aria-pressed={!presetId}
              onClick={() => setPresetId('')}
            >
              직접 만들기
            </button>
            {PROJECT_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`filter-chip${presetId === p.id ? ' active' : ''}`}
                aria-pressed={presetId === p.id}
                onClick={() => setPresetId(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          {preset && (
            <p className="add-team-hint">
              {preset.milestones.length}개 항목이 자동으로 채워져요 · 만든 뒤 자유롭게 고칠 수 있어요
            </p>
          )}

          <button className="btn btn-primary full submit-gap" type="submit" disabled={!title.trim()}>
            추가하기
          </button>
        </form>
      </section>
    </div>
  );
}
