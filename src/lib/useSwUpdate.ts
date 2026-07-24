import { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

/**
 * 배포 직후에도 이미 열려 있던 탭(특히 홈 화면에 설치된 PWA)이 서비스워커 캐시 때문에
 * 옛 빌드를 계속 보여주는 문제를 막기 위해, 새 버전이 감지되면 배너로 알리고
 * 사용자가 직접 눌렀을 때만 새로고침한다(작성 중이던 내용을 갑자기 날리지 않도록).
 */
export function useSwUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateRef = useRef<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    updateRef.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onRegisteredSW(_url, registration) {
        // 앱을 오래 켜둔 채로 있어도(홈 화면 PWA 등) 새 배포를 놓치지 않도록 주기적으로 재확인
        if (!registration) return;
        setInterval(() => registration.update(), 60_000);
      },
    });
  }, []);

  const applyUpdate = () => {
    updateRef.current?.(true);
  };

  return { needRefresh, applyUpdate };
}
