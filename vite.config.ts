import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 로컬 개발은 루트('/'), GitHub Pages 배포는 '/sumpyo/' 하위 경로로 서빙된다.
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/sumpyo/' : '/',
  plugins: [react()],
  server: { port: 5174, strictPort: true },
}));
