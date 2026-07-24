import { useRef, useState, type ChangeEvent } from 'react';
import type { LineupAssignment, Profile, Task, Team, TeamId } from '../types';
import { exportBackup, parseBackup, readFileAsText } from '../lib/backup';
import { downloadIcs } from '../lib/ics';
import { TeamChip } from './ui';

interface Props {
  teams: Team[];
  tasks: Task[];
  profile: Profile;
  lineup: LineupAssignment[];
  now: Date;
  onSaveProfile: (p: Profile) => void;
  onShowIntro: () => void;
  onReset: () => void;
  onAddTeam: () => void;
  onManageTeam: (teamId: TeamId) => void;
  onImport: (teams: Team[], tasks: Task[], profile: Profile | null, lineup: LineupAssignment[]) => void;
}

type ImportState = 'idle' | 'ok' | 'fail';

export default function MyPage({
  teams,
  tasks,
  profile,
  lineup,
  now,
  onSaveProfile,
  onShowIntro,
  onReset,
  onAddTeam,
  onManageTeam,
  onImport,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState<ImportState>('idle');
  const [importMsg, setImportMsg] = useState('');
  const [exportMsg, setExportMsg] = useState('');
  const exportTimer = useRef<number | null>(null);

  const pickFile = () => fileRef.current?.click();

  const notifyExport = (msg: string) => {
    setExportMsg(msg);
    if (exportTimer.current) window.clearTimeout(exportTimer.current);
    exportTimer.current = window.setTimeout(() => setExportMsg(''), 2500);
  };

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await readFileAsText(file);
    const result = parseBackup(text);
    if (!result.ok) {
      setImportState('fail');
      setImportMsg(result.error);
      return;
    }
    if (window.confirm(`백업 파일에는 팀 ${result.teams.length}개, 업무 ${result.tasks.length}건이 있어요. 지금 데이터를 덮어쓸까요?`)) {
      onImport(result.teams, result.tasks, result.profile, result.lineup);
      setImportState('ok');
      setImportMsg('불러오기 완료');
    }
  };

  return (
    <div className="container main mypage">
      <h1 className="mypage-title">마이페이지</h1>

      <p className="mypage-section-label">내 프로필</p>
      <section className="card mypage-section mypage-profile">
        <label className="profile-field">
          <span className="field-label">이름</span>
          <input
            className="text-input full"
            value={profile.name}
            onChange={(e) => onSaveProfile({ ...profile, name: e.target.value })}
            placeholder="예) 김인도"
            aria-label="이름"
          />
        </label>
        <label className="profile-field">
          <span className="field-label">소속 교회</span>
          <input
            className="text-input full"
            value={profile.church}
            onChange={(e) => onSaveProfile({ ...profile, church: e.target.value })}
            placeholder="예) 은혜교회"
            aria-label="소속 교회"
          />
        </label>
      </section>

      <p className="mypage-section-label">팀 관리</p>
      <section className="card mypage-section">
        {teams.map((t) => (
          <button key={t.id} className="mypage-row" onClick={() => onManageTeam(t.id)}>
            <span className="mypage-team-row">
              <TeamChip team={t} />
              <span>{t.serviceName}</span>
            </span>
            <span className="mypage-arrow">›</span>
          </button>
        ))}
        <button className="mypage-row mypage-add" onClick={onAddTeam}>
          <span>＋ 예배 추가</span>
        </button>
      </section>

      <p className="mypage-section-label">데이터</p>
      <section className="card mypage-section">
        <button
          className="mypage-row"
          onClick={() => {
            exportBackup(teams, tasks, profile, lineup);
            notifyExport('백업 파일을 내려받았어요');
          }}
        >
          <span>데이터 내보내기 (백업 파일)</span>
          <span className="mypage-arrow">›</span>
        </button>
        <button className="mypage-row" onClick={pickFile}>
          <span>데이터 가져오기 (복원)</span>
          <span className="mypage-arrow">›</span>
        </button>
        <button
          className="mypage-row"
          onClick={() => {
            downloadIcs(teams, now);
            notifyExport('.ics 파일을 내려받았어요');
          }}
          disabled={teams.length === 0}
        >
          <span>예배 일정 내보내기 (.ics)</span>
          <span className="mypage-arrow">›</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="sr-only"
          onChange={onFileChange}
          aria-label="백업 파일 선택"
        />
      </section>
      {importState !== 'idle' && (
        <p className={`import-msg${importState === 'fail' ? ' fail' : ''}`}>{importMsg}</p>
      )}
      {exportMsg && <p className="import-msg">{exportMsg}</p>}
      <p className="mypage-hint">이 기기에만 저장돼요. 기기를 바꾸거나 브라우저 데이터를 지우기 전에 내보내기로 백업해두세요.</p>
      <p className="mypage-hint">.ics는 예배 요일을 아이폰·구글 캘린더에 매주 반복 일정으로 등록해요(정확한 예배 시각은 없어 종일 일정으로 담겨요).</p>

      <p className="mypage-section-label">기타</p>
      <section className="card mypage-section">
        <button className="mypage-row" onClick={onShowIntro}>
          <span>숨표 소개 다시 보기</span>
          <span className="mypage-arrow">›</span>
        </button>
        <button className="mypage-row mypage-danger" onClick={onReset}>
          <span>데모 데이터 초기화</span>
          <span className="mypage-arrow">›</span>
        </button>
      </section>

      <p className="mypage-tagline">숨표 — 예배 준비는 보이게, 내 시간에는 숨표를.</p>
    </div>
  );
}
