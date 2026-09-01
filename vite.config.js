import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const komariUrl = env.KOMARI_URL || env.VITE_KOMARI_URL;

  return {
    plugins: [vue()],
    // 独立 Vite 开发服务通过代理访问 Komari，生产部署仍使用同源相对路径。
    server: komariUrl
      ? {
          proxy: {
            "/api": {
              target: komariUrl,
              changeOrigin: true,
              ws: true,
              // Nginx 可能会校验 Origin；开发页的 localhost Origin 会被拒绝。
              configure(proxy) {
                proxy.on("proxyReq", (proxyReq) => {
                  proxyReq.setHeader("Origin", komariUrl);
                });
              },
            },
          },
        }
      : undefined,
  };
});
