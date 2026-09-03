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

## 后台主题设置与安装

运行 `npm run package:theme`，将 `release/komari-theme-minecraft-v0.1.0.zip` 上传到 Komari 后台主题管理并启用。需要支持 managed 配置的 Komari（1.0.5 及以上），配置表单由后台生成。

也可在“导入远程主题”中填写 GitHub 仓库地址。仓库的最新正式 Release 必须附带上述主题 ZIP，Komari 会从 Release 下载主题包；仅推送源码不能用于这种导入方式。本地打包命令需要 PowerShell 7（`pwsh`）。

主题设置包含默认外观（system/light/dark/mc）、资产币种、背景图片、三网任务名以及总览各项开关。背景支持 `浅色URL|深色URL`，MC 使用深色图片，留空恢复原背景。三网名称全部留空时自动匹配；填写名称后严格按完整任务名选择，缺失显示 `--`。关闭三网后显示各任务平均延迟和平均丢包率，详情图表仍展示全部任务。

前台每 30 秒、手动刷新以及切回标签页时读取设置；本地外观选择优先于后台默认。要恢复后台默认，可清除浏览器的 `komari-appearance` 本地存储项。配置读取失败会显示提示并保留上次配置。

资产通过 ExchangeRate-API 的 CNY 参考汇率折算，成功请求在当前页面缓存 24 小时。剩余价值按剩余时间占计费周期的比例计算（最高为一个周期价格），一次性付费保留原价值；缺少汇率或计费信息时显示不完整估值提示。公开配置中不要存放私密信息。
