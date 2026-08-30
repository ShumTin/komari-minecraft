# Komari Minecraft

从零实现的 Komari 浅色主题监控面板原型。当前版本使用本地 mock 数据，未连接 Komari API，方便先完成页面与交互验证。

## 开发

```bash
npm install
npm run dev
```

页面包含节点筛选、刷新 mock 指标、导航切换和响应式布局，后续可将 `src/main.jsx` 中的 mock 数据替换为真实接口。
