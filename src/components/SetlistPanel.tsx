import { useState } from 'react';
import type { SetlistSong } from '../types';

interface Props {
  songs: SetlistSong[];
  /** 팀이 보통 몇 곡 하는지 — 강제하지 않고 참고로만 보여준다 */
  songCount: number;
  onChange: (songs: SetlistSong[]) => void;
  onAdd: (title: string) => void;
}

/**
 * 그 예배의 콘티 — 곡 제목 + 키 + 확인 여부.
 * 곡 라이브러리가 아니다: 재사용 이력도, BPM·가사·파일도 다루지 않는다.
 */
export default function SetlistPanel({ songs, songCount, onChange, onAdd }: Props) {
  const [title, setTitle] = useState('');

  const patch = (id: string, next: Partial<SetlistSong>) =>
    onChange(songs.map((s) => (s.id === id ? { ...s, ...next } : s)));

  const remove = (s: SetlistSong) => {
    if (!window.confirm(`"${s.title}"을(를) 콘티에서 뺄까요?`)) return;
    onChange(songs.filter((x) => x.id !== s.id));
  };

  const submit = () => {
    const t = title.trim();
    if (!t) return;
    onAdd(t);
    setTitle('');
  };

  return (
    <div className="setlist-panel">
      {songs.length > 0 && (
        <ul className="setlist-list">
          {songs.map((s) => (
            <li key={s.id} className="setlist-row">
              <button
                type="button"
                className={`check-circle${s.confirmed ? ' on' : ''}`}
                aria-pressed={!!s.confirmed}
                aria-label={`${s.title} — 악보·키·송폼 ${s.confirmed ? '확인 해제' : '확인 완료'}`}
                onClick={() => patch(s.id, { confirmed: !s.confirmed })}
              >
                ✓
              </button>
              <input
                className="text-input setlist-title"
                value={s.title}
                onChange={(e) => patch(s.id, { title: e.target.value })}
                aria-label="곡 제목"
              />
              <input
                className="text-input setlist-key"
                value={s.key ?? ''}
                onChange={(e) => patch(s.id, { key: e.target.value })}
                placeholder="키"
                aria-label={`${s.title} 키`}
              />
              <button
                type="button"
                className="tmpl-remove"
                aria-label={`${s.title} 빼기`}
                onClick={() => remove(s)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="setlist-add">
        <input
          className="text-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="곡 제목"
          aria-label="추가할 곡 제목"
        />
        <button type="button" className="btn btn-primary" onClick={submit} disabled={!title.trim()}>
          추가
        </button>
      </div>
      <p className="hint">보통 {songCount}곡이에요 · 체크는 악보·키·송폼 확인이 끝났다는 표시예요</p>
    </div>
  );
}
