#!/usr/bin/env node
// 숨표 백업 JSON을 구글 시트에 바로 올릴 수 있는 CSV 5개로 변환한다.
// 사용법: node scripts/backup-to-report.mjs 백업파일.json [출력폴더(기본 report)]

import fs from 'node:fs';
import path from 'node:path';

const ROLE_LABELS = {
  main: '메인',
  second: '세컨',
  acoustic: '통기타',
  electric: '일렉',
  bass: '베이스',
  drum: '드럼',
  singer: '싱어',
  engineer: '엔지니어',
  ppt: 'PPT',
};
const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

function roleLabel(role) {
  return ROLE_LABELS[role] ?? role;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fmtDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${fmtDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function csvEscape(value) {
  const s = value === undefined || value === null ? '' : String(value);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function writeCsv(filePath, headers, rows) {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  // BOM을 붙여야 엑셀에서도 한글이 안 깨짐 (구글 시트는 BOM 없어도 정상)
  fs.writeFileSync(filePath, '﻿' + lines.join('\n') + '\n', 'utf8');
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('사용법: node scripts/backup-to-report.mjs <백업파일.json> [출력폴더]');
    process.exit(1);
  }
  const outDir = process.argv[3] || 'report';

  const backup = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  if (backup.app !== 'sumpyo') {
    console.error('숨표 백업 파일이 아니에요 (app 필드가 "sumpyo"가 아님)');
    process.exit(1);
  }

  const teams = backup.teams ?? [];
  const tasks = backup.tasks ?? [];
  const lineup = backup.lineup ?? [];

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const teamName = (teamId) => teamById.get(teamId)?.shortName ?? '(삭제된 팀)';

  const memberById = new Map();
  for (const t of teams) {
    for (const m of t.members ?? []) memberById.set(m.id, m.name);
  }

  fs.mkdirSync(outDir, { recursive: true });

  writeCsv(
    path.join(outDir, 'teams.csv'),
    ['이름', '예배명', '요일', '교역자', '곡수', '팀원수', '준비팩커스텀'],
    teams.map((t) => ({
      이름: t.shortName,
      예배명: t.serviceName,
      요일: WEEKDAYS_KO[t.serviceWeekday] ?? '',
      교역자: t.pastorLabel,
      곡수: t.songCount,
      팀원수: (t.members ?? []).length,
      준비팩커스텀: t.customTemplate && t.customTemplate.length > 0 ? 'Y' : '',
    })),
  );

  const memberRows = [];
  for (const t of teams) {
    for (const m of t.members ?? []) {
      memberRows.push({ 팀: t.shortName, 이름: m.name, 역할: (m.roles ?? []).map(roleLabel).join(', ') });
    }
  }
  writeCsv(path.join(outDir, 'members.csv'), ['팀', '이름', '역할'], memberRows);

  writeCsv(
    path.join(outDir, 'tasks.csv'),
    ['팀', '제목', '예배일', '마감일시', '완료여부', '완료일시', '메모여부'],
    tasks.map((t) => ({
      팀: teamName(t.teamId),
      제목: t.title,
      예배일: fmtDate(t.service),
      마감일시: t.allDay ? fmtDate(t.due) : fmtDateTime(t.due),
      완료여부: t.done ? 'Y' : '',
      완료일시: t.doneAt ? fmtDateTime(t.doneAt) : '',
      메모여부: t.isCustom ? 'Y' : '',
    })),
  );

  const progressMap = new Map();
  for (const t of tasks) {
    if (!t.service) continue;
    const key = `${t.teamId}|${t.service}`;
    const entry = progressMap.get(key) ?? { teamId: t.teamId, service: t.service, total: 0, done: 0 };
    entry.total += 1;
    if (t.done) entry.done += 1;
    progressMap.set(key, entry);
  }
  const progressRows = Array.from(progressMap.values())
    .sort((a, b) => (a.service < b.service ? -1 : a.service > b.service ? 1 : 0))
    .map((e) => ({
      팀: teamName(e.teamId),
      예배일: fmtDate(e.service),
      총업무수: e.total,
      완료수: e.done,
      완료율: e.total > 0 ? `${Math.round((e.done / e.total) * 100)}%` : '0%',
    }));
  writeCsv(path.join(outDir, 'weekly_progress.csv'), ['팀', '예배일', '총업무수', '완료수', '완료율'], progressRows);

  writeCsv(
    path.join(outDir, 'lineup.csv'),
    ['팀', '예배일', '역할', '담당자', '확정일시'],
    lineup.map((a) => ({
      팀: teamName(a.teamId),
      예배일: fmtDate(a.service),
      역할: roleLabel(a.role),
      담당자: memberById.get(a.memberId) ?? '(삭제된 팀원)',
      확정일시: fmtDateTime(a.confirmedAt),
    })),
  );

  console.log(`완료: ${outDir}/ 폴더에 teams.csv, members.csv, tasks.csv, weekly_progress.csv, lineup.csv 생성됨`);
  console.log(`팀 ${teams.length}개 · 업무 ${tasks.length}건 · 라인업 확정 ${lineup.length}건`);
}

main();
