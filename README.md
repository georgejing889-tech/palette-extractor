# ColorExtract - 智能配色提取工具

专业的图片配色提取工具，AI 快速分析图片主色，生成专业色板方案。

**在线使用：<https://colorextract.cn>**（免费，无需注册，图片全程本地处理不上传）

## 功能特性

- 🎨 智能提取 5-10 个主色，支持锁定颜色
- 🎯 多种提取模式：均衡、鲜艳、柔和、明亮、暗调
- 📋 一键复制 HEX / RGB / HSL 色值
- 🧩 一键复制 CSS 变量、Tailwind 配置
- 💾 导出 PNG 色板图和 JSON 配置
- 👁 内置色盲模拟器，预览配色在常见色觉缺陷下的效果
- ♿ WCAG 对比度检测器，检查文字可读性是否达标
- 🚀 本地处理，图片不上传任何服务器，保护隐私
- 🌐 中英双语，支持 `/en/` 英文独立 URL
- 📱 响应式设计，移动端友好

## 技术栈

- React 19 + TypeScript
- Vite 8 + Tailwind CSS 4
- 本地图片处理（Canvas，无服务器上传）
- 预渲染（SSG）生成静态 SEO 页面，爬虫无需执行 JS

## 开发

```bash
npm install
npm run dev      # 本地开发
npm run build    # 构建（含预渲染）+ 输出到 dist/
npm run lint     # oxlint 代码检查
```

## 部署

```bash
npm run build
```

构建产物在 `dist/` 目录，用任意静态服务器托管即可（本项目用 Node `server.mjs` 或 nginx）。

## 项目结构

```
src/
  components/    UI 组件（上传、色板、导出、色盲/对比度面板等）
  lib/           路由、i18n 双语字典
scripts/
  prerender.mjs  静态预渲染脚本（生成 SEO 页面）
public/          静态资源（favicon、sitemap.xml、robots.txt）
```

## License

MIT
