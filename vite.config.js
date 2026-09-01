import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const komariUrl = env.KOMARI_URL || env.VITE_KOMARI_URL;
  const adminUrl = command === "serve" && komariUrl
    ? `${komariUrl.replace(/\/+$/, "")}/admin`
    : "/admin";

  return {
    plugins: [vue()],
    // 开发环境直接打开 Komari 后台，生产环境使用同源路径。
    define: {
      __KOMARI_ADMIN_URL__: JSON.stringify(adminUrl),
    },
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
                proxy.on("proxyReqWs", (proxyReq) => {
                  proxyReq.setHeader("Origin", komariUrl);
                });
              },
            },
            "/favicon.ico": {
              target: komariUrl,
              changeOrigin: true,
            },
          },
        }
      : undefined,
  };
});
