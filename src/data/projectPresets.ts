export interface ProjectPreset {
  id: string;
  label: string;
  /** 이 순서대로 ProjectMilestone이 채워진다 */
  milestones: string[];
}

export const PROJECT_PRESETS: ProjectPreset[] = [
  {
    id: 'retreat',
    label: '수련회',
    milestones: [
      '날짜·장소 확정',
      '예산 승인 받기',
      '숙소 예약',
      '참석 인원 확인',
      '집회별 콘티 정하기',
      '장비 반출 목록 정리',
      '차량·이동 확정',
      '리허설 일정 잡기',
      '정산 마무리',
    ],
  },
  {
    id: 'outing',
    label: '소풍·나들이',
    milestones: ['날짜·장소 확정', '참석 인원 확인', '차량·이동 확정', '식사·간식 준비', '준비물 챙기기', '정산 마무리'],
  },
  {
    id: 'special',
    label: '특별예배',
    milestones: [
      '예배 주제·순서 확정',
      '콘티 선정',
      '특송·특별 순서 준비',
      '무대·장식 확인',
      '영상·음향 점검',
      '리허설 일정 잡기',
      '예배 후 기록 남기기',
    ],
  },
];
