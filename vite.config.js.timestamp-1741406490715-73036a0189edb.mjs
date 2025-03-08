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
        rewrite: (path) => path.replace(/^\/api\/opinet/, "/api")
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxDSllcXFxcRGVza3RvcFxcXFxkZXZsb3BtZW50XFxcXGdyYXBcXFxcZ3JhcFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQ0pZXFxcXERlc2t0b3BcXFxcZGV2bG9wbWVudFxcXFxncmFwXFxcXGdyYXBcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0NKWS9EZXNrdG9wL2RldmxvcG1lbnQvZ3JhcC9ncmFwL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnXG5cbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcbmltcG9ydCB2dWVEZXZUb29scyBmcm9tICd2aXRlLXBsdWdpbi12dWUtZGV2dG9vbHMnXG5cbi8vIGh0dHBzOi8vdml0ZS5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHZ1ZSgpLFxuICAgIHZ1ZURldlRvb2xzKCksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSlcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwcm94eToge1xuICAgICAgLy8gXHVDNjI0XHVENTNDXHVCMTM3IEFQSSBcdUQ1MDRcdUI4NURcdUMyREMgXHVDMTI0XHVDODE1XG4gICAgICAnL2FwaS9vcGluZXQnOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly93d3cub3BpbmV0LmNvLmtyJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpXFwvb3BpbmV0LywgJy9hcGknKVxuICAgICAgfSxcbiAgICAgIC8vIFx1Q0U3NFx1Q0U3NFx1QzYyNCBBUEkgXHVENTA0XHVCODVEXHVDMkRDIFx1QzEyNFx1QzgxNVxuICAgICAgJy9hcGkva2FrYW8nOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHBzOi8vZGFwaS5rYWthby5jb20nLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGlcXC9rYWthby8sICcnKSxcbiAgICAgICAgY29uZmlndXJlOiAocHJveHksIG9wdGlvbnMpID0+IHtcbiAgICAgICAgICAvLyBcdUQ1MDRcdUI4NURcdUMyREMgXHVDNjk0XHVDQ0FEIFx1QzgwNFx1QzVEMCBcdUMyRTRcdUQ1ODlcdUI0MThcdUIyOTQgXHVDNzc0XHVCQ0E0XHVEMkI4IFx1RDU3OFx1QjRFNFx1QjdFQ1xuICAgICAgICAgIHByb3h5Lm9uKCdwcm94eVJlcScsIChwcm94eVJlcSwgcmVxLCByZXMpID0+IHtcbiAgICAgICAgICAgIC8vIFx1QzZEMFx1QkNGOCBcdUM2OTRcdUNDQURcdUM3NTggQXV0aG9yaXphdGlvbiBcdUQ1RTRcdUIzNTRcdUI5N0MgXHVDNzIwXHVDOUMwXG4gICAgICAgICAgICBjb25zdCBhdXRoSGVhZGVyID0gcmVxLmhlYWRlcnNbJ2F1dGhvcml6YXRpb24nXTtcbiAgICAgICAgICAgIGlmIChhdXRoSGVhZGVyKSB7XG4gICAgICAgICAgICAgIHByb3h5UmVxLnNldEhlYWRlcignQXV0aG9yaXphdGlvbicsIGF1dGhIZWFkZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgLy8gY2FmZTI0IEFQSSBcdUQ1MDRcdUI4NURcdUMyREMgXHVDMTI0XHVDODE1XG4gICAgICAnL2FwaS9jYWZlMjQnOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHBzOi8vYWthcHdoZGdyYXAuY2FmZTI0LmNvbScsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaVxcL2NhZmUyNC8sICcvYXBpJylcbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEyVCxTQUFTLGVBQWUsV0FBVztBQUU5VixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFNBQVM7QUFDaEIsT0FBTyxpQkFBaUI7QUFKK0ssSUFBTSwyQ0FBMkM7QUFPeFAsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsSUFBSTtBQUFBLElBQ0osWUFBWTtBQUFBLEVBQ2Q7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssY0FBYyxJQUFJLElBQUksU0FBUyx3Q0FBZSxDQUFDO0FBQUEsSUFDdEQ7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixPQUFPO0FBQUE7QUFBQSxNQUVMLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsQ0FBQyxTQUFTLEtBQUssUUFBUSxrQkFBa0IsTUFBTTtBQUFBLE1BQzFEO0FBQUE7QUFBQSxNQUVBLGNBQWM7QUFBQSxRQUNaLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsQ0FBQyxTQUFTLEtBQUssUUFBUSxpQkFBaUIsRUFBRTtBQUFBLFFBQ25ELFdBQVcsQ0FBQyxPQUFPLFlBQVk7QUFFN0IsZ0JBQU0sR0FBRyxZQUFZLENBQUMsVUFBVSxLQUFLLFFBQVE7QUFFM0Msa0JBQU0sYUFBYSxJQUFJLFFBQVEsZUFBZTtBQUM5QyxnQkFBSSxZQUFZO0FBQ2QsdUJBQVMsVUFBVSxpQkFBaUIsVUFBVTtBQUFBLFlBQ2hEO0FBQUEsVUFDRixDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQTtBQUFBLE1BRUEsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDLFNBQVMsS0FBSyxRQUFRLGtCQUFrQixNQUFNO0FBQUEsTUFDMUQ7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
