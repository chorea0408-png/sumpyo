import { useEffect, useState } from 'react';

const QUERY = '(min-width: 900px)';

/**
 * CSS의 900px 데스크톱 브레이크포인트와 동일한 기준을 JS에서도 알아야 할 때 쓴다.
 * 모바일에서만 <details>로 접는 섹션(WeeklySummary·UpcomingServices)이 대표 사례 —
 * 데스크톱에선 사이드바 컬럼이라 항상 펼쳐져 있어야 하는데, CSS만으로 <details>의
 * open 상태를 강제하는 건 브라우저마다 동작이 불안정해 렌더 자체를 여기서 분기한다.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = () => setIsDesktop(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}
