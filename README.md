# Komari Minecraft

从零实现的 Komari 浅色主题监控面板。页面数据通过 Komari RPC API 加载，不内置生产环境 mock 数据。

## 开发

```bash
npm install
npm run dev
```

提交前可运行完整检查：

```bash
npm run verify
```

该命令依次执行测试、生产构建和 Git 空白字符检查。

独立 Vite 开发服务需要把 API 代理到 Komari 实例。复制 `.env.example` 为 `.env.local`，将地址改成你的 Komari 地址：

```bash
KOMARI_URL=http://127.0.0.1:端口 npm run dev
```

也可以在 `.env.local` 中配置 `KOMARI_URL` 或 `VITE_KOMARI_URL`。未配置时页面仍可启动，但需要通过同源部署或开发代理连接 Komari 服务。

页面包含节点筛选、刷新指标、导航切换、加载/错误/空状态和响应式布局。
