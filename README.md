# 万联易达 · 供应商端 V1

C 端化风格的供应商工作台前端 Demo（纯前端界面与交互，无后端）。

## 技术栈

- Vue 3 + TypeScript + Vite
- Element Plus + @element-plus/icons-vue
- Lucide 图标
- Vue Router + Pinia

## 启动

```bash
npm install
npm run dev        # http://127.0.0.1:5175
npm run build
```

## V1 范围

- 顶栏 + 侧边导航 + 工作台主页
- 其余菜单为占位路由
- 悬浮「版本切换 / 验收工具」：版本、页面状态、分屏对比、验收清单

## 设计原则

- C 端质感：柔和层次、圆角、微渐变、动效反馈，避免经典 B 端灰蓝死板
- 品牌红为点缀主色，信息卡片用彩色语义点缀
- 交互反馈 150–300ms，尊重 prefers-reduced-motion
