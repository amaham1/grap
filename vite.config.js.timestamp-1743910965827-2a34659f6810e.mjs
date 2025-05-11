// vite.config.js
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "file:///C:/Users/CJY/Desktop/devlopment/grap/grap/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/CJY/Desktop/devlopment/grap/grap/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueDevTools from "file:///C:/Users/CJY/Desktop/devlopment/grap/grap/node_modules/vite-plugin-vue-devtools/dist/vite.mjs";
var __vite_injected_original_import_meta_url = "file:///C:/Users/CJY/Desktop/devlopment/grap/grap/vite.config.js";
var vite_config_default = defineConfig({
  plugins: [
    vue(),
    vueDevTools()
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  },
  server: {
    proxy: {
      // 오피넷 API 프록시 설정
      "/api/opinet": {
        target: "http://www.opinet.co.kr",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/opinet/, "")
      },
      "/api/its": {
        target: "http://api.jejuits.go.kr",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/its/, "")
      },
      // 카카오 API 프록시 설정
      "/api/kakao": {
        target: "https://dapi.kakao.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kakao/, ""),
        configure: (proxy, options) => {
          proxy.on("proxyReq", (proxyReq, req, res) => {
            const authHeader = req.headers["authorization"];
            if (authHeader) {
              proxyReq.setHeader("Authorization", authHeader);
            }
          });
        }
      },
      // cafe24 API 프록시 설정
      "/api/cafe24": {
        target: "https://grap.co.kr",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cafe24/, "/api")
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxDSllcXFxcRGVza3RvcFxcXFxkZXZsb3BtZW50XFxcXGdyYXBcXFxcZ3JhcFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQ0pZXFxcXERlc2t0b3BcXFxcZGV2bG9wbWVudFxcXFxncmFwXFxcXGdyYXBcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0NKWS9EZXNrdG9wL2RldmxvcG1lbnQvZ3JhcC9ncmFwL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnXHJcblxyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcclxuaW1wb3J0IHZ1ZURldlRvb2xzIGZyb20gJ3ZpdGUtcGx1Z2luLXZ1ZS1kZXZ0b29scydcclxuXHJcbi8vIGh0dHBzOi8vdml0ZS5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHZ1ZSgpLFxyXG4gICAgdnVlRGV2VG9vbHMoKSxcclxuICBdLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgICdAJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYycsIGltcG9ydC5tZXRhLnVybCkpXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwcm94eToge1xyXG4gICAgICAvLyBcdUM2MjRcdUQ1M0NcdUIxMzcgQVBJIFx1RDUwNFx1Qjg1RFx1QzJEQyBcdUMxMjRcdUM4MTVcclxuICAgICAgJy9hcGkvb3BpbmV0Jzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly93d3cub3BpbmV0LmNvLmtyJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaVxcL29waW5ldC8sICcnKVxyXG4gICAgICB9LFxyXG4gICAgICAnL2FwaS9pdHMnOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2FwaS5qZWp1aXRzLmdvLmtyJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaVxcL2l0cy8sICcnKVxyXG4gICAgICB9LFxyXG4gICAgICAvLyBcdUNFNzRcdUNFNzRcdUM2MjQgQVBJIFx1RDUwNFx1Qjg1RFx1QzJEQyBcdUMxMjRcdUM4MTVcclxuICAgICAgJy9hcGkva2FrYW8nOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9kYXBpLmtha2FvLmNvbScsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGlcXC9rYWthby8sICcnKSxcclxuICAgICAgICBjb25maWd1cmU6IChwcm94eSwgb3B0aW9ucykgPT4ge1xyXG4gICAgICAgICAgLy8gXHVENTA0XHVCODVEXHVDMkRDIFx1QzY5NFx1Q0NBRCBcdUM4MDRcdUM1RDAgXHVDMkU0XHVENTg5XHVCNDE4XHVCMjk0IFx1Qzc3NFx1QkNBNFx1RDJCOCBcdUQ1NzhcdUI0RTRcdUI3RUNcclxuICAgICAgICAgIHByb3h5Lm9uKCdwcm94eVJlcScsIChwcm94eVJlcSwgcmVxLCByZXMpID0+IHtcclxuICAgICAgICAgICAgLy8gXHVDNkQwXHVCQ0Y4IFx1QzY5NFx1Q0NBRFx1Qzc1OCBBdXRob3JpemF0aW9uIFx1RDVFNFx1QjM1NFx1Qjk3QyBcdUM3MjBcdUM5QzBcclxuICAgICAgICAgICAgY29uc3QgYXV0aEhlYWRlciA9IHJlcS5oZWFkZXJzWydhdXRob3JpemF0aW9uJ107XHJcbiAgICAgICAgICAgIGlmIChhdXRoSGVhZGVyKSB7XHJcbiAgICAgICAgICAgICAgcHJveHlSZXEuc2V0SGVhZGVyKCdBdXRob3JpemF0aW9uJywgYXV0aEhlYWRlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgLy8gY2FmZTI0IEFQSSBcdUQ1MDRcdUI4NURcdUMyREMgXHVDMTI0XHVDODE1XHJcbiAgICAgICcvYXBpL2NhZmUyNCc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwczovL2dyYXAuY28ua3InLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpXFwvY2FmZTI0LywgJy9hcGknKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59KSJdLAogICJtYXBwaW5ncyI6ICI7QUFBMlQsU0FBUyxlQUFlLFdBQVc7QUFFOVYsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxTQUFTO0FBQ2hCLE9BQU8saUJBQWlCO0FBSitLLElBQU0sMkNBQTJDO0FBT3hQLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLElBQUk7QUFBQSxJQUNKLFlBQVk7QUFBQSxFQUNkO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLElBQ3REO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sT0FBTztBQUFBO0FBQUEsTUFFTCxlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxTQUFTLENBQUMsU0FBUyxLQUFLLFFBQVEsa0JBQWtCLEVBQUU7QUFBQSxNQUN0RDtBQUFBLE1BQ0EsWUFBWTtBQUFBLFFBQ1YsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDLFNBQVMsS0FBSyxRQUFRLGVBQWUsRUFBRTtBQUFBLE1BQ25EO0FBQUE7QUFBQSxNQUVBLGNBQWM7QUFBQSxRQUNaLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsQ0FBQyxTQUFTLEtBQUssUUFBUSxpQkFBaUIsRUFBRTtBQUFBLFFBQ25ELFdBQVcsQ0FBQyxPQUFPLFlBQVk7QUFFN0IsZ0JBQU0sR0FBRyxZQUFZLENBQUMsVUFBVSxLQUFLLFFBQVE7QUFFM0Msa0JBQU0sYUFBYSxJQUFJLFFBQVEsZUFBZTtBQUM5QyxnQkFBSSxZQUFZO0FBQ2QsdUJBQVMsVUFBVSxpQkFBaUIsVUFBVTtBQUFBLFlBQ2hEO0FBQUEsVUFDRixDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQTtBQUFBLE1BRUEsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDLFNBQVMsS0FBSyxRQUFRLGtCQUFrQixNQUFNO0FBQUEsTUFDMUQ7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
