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
        registerType: 'autoUpdate',
        includeAssets: ['breath.svg'],
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
            {
              src: 'breath.svg',
              type: 'image/svg+xml',
              sizes: 'any',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,ico}'],
        },
      }),
    ],
    server: { port: 5174, strictPort: true },
  };
});
