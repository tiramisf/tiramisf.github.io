// vite.config.ts
import path from 'path'; // path 모듈은 @ 별칭 설정에 필요합니다.
import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react' // 만약 React 같은 프레임워크를 사용한다면

export default defineConfig(() => { // mode는 loadEnv 사용 시 필요할 수 있으나, 지금은 사용하지 않으므로 제거해도 무방
    // const env = loadEnv(mode, '.', ''); // GEMINI_API_KEY를 사용하지 않으므로 이 라인도 제거 가능
    return {
      // plugins: [react()], // 사용하는 프레임워크 플러그인

      // GitHub Pages 배포를 위한 base 경로 설정
      
      base: '/copy-of-text-relationship-visualizer---4---2/',

      // API 키를 사용하지 않으므로 define 섹션은 제거하거나 비워둡니다.
      // define: {
      //   'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      //   'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      // },

      resolve: {
        alias: {
          // 현재 프로젝트 구조에 맞게 @ 별칭 설정
          // 만약 src 폴더를 기준으로 한다면:
          // '@': path.resolve(new URL('.', import.meta.url).pathname, './src'),
          // 만약 프로젝트 루트를 기준으로 한다면 (index.tsx가 루트에 있다면):
          '@': path.resolve(new URL('.', import.meta.url).pathname, '.'),
        }
      }
      // build: {
      //   outDir: 'dist',
      // }
    };
});