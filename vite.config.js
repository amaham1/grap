import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      // 오피넷 API 프록시 설정
      '/api/opinet': {
        target: 'http://www.opinet.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/opinet/, '')
      },
      // 카카오 API 프록시 설정
      '/api/kakao': {
        target: 'https://dapi.kakao.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kakao/, ''),
        configure: (proxy, options) => {
          // 프록시 요청 전에 실행되는 이벤트 핸들러
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 원본 요청의 Authorization 헤더를 유지
            const authHeader = req.headers['authorization'];
            if (authHeader) {
              proxyReq.setHeader('Authorization', authHeader);
            }
          });
        }
      },
      // cafe24 API 프록시 설정
      '/api/cafe24': {
        target: 'https://grap.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cafe24/, '/api')
      }
    }
  }
})