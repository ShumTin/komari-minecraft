# Komari Minecraft

从零实现的 Komari 浅色主题监控面板原型。当前版本使用本地 mock 数据，未连接 Komari API，方便先完成页面与交互验证。

## 开发

```bash
npm install
npm run dev
```

独立 Vite 开发服务需要把 API 代理到 Komari 实例。复制 `.env.example` 为 `.env.local`，将地址改成你的 Komari 地址：

```bash
KOMARI_URL=http://127.0.0.1:端口 npm run dev
```

也可以在 `.env.local` 中配置 `KOMARI_URL` 或 `VITE_KOMARI_URL`。未配置时页面仍可启动，但会使用 mock 数据回退。

页面包含节点筛选、刷新 mock 指标、导航切换和响应式布局，后续可将 `src/main.jsx` 中的 mock 数据替换为真实接口。
