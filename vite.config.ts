import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// 로컬 개발은 루트('/'), GitHub Pages 배포는 '/sumpyo/' 하위 경로로 서빙된다.
export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? '/sumpyo/' : '/';
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        // 'autoUpdate'는 감지되는 즉시 조용히 새로고침돼 입력 중이던 내용을 날릴 수 있어
        // 'prompt'로 두고, 실제 새로고침 여부는 useSwUpdate 훅의 토스트 버튼으로 사용자가 결정하게 한다.
        registerType: 'prompt',
        includeAssets: ['apple-touch-icon.png', 'favicon-48.png'],
        manifest: {
          name: '숨표 — 예배 준비는 보이게',
          short_name: '숨표',
          description: '여러 찬양팀을 병행하는 인도자를 위한 주간 준비 대시보드',
          start_url: base,
          scope: base,
          display: 'standalone',
          background_color: '#F7F4EE',
          theme_color: '#F7F4EE',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,ico}'],
        },
      }),
    ],
    server: { port: 5174, strictPort: true },
  };
});
