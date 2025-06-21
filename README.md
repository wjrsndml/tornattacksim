# Torn Battle Simulator

一个基于 Next.js 的现代化 Torn 游戏战斗模拟器。

## 特性

- 🚀 基于 Next.js 14 和 React 18
- 💅 使用 Tailwind CSS 构建的现代化界面
- ⚡ 支持 Web Workers 进行高性能战斗模拟
- 📊 详细的统计数据和可视化结果
- 🎯 完整的玩家配置选项
- 📱 响应式设计，支持移动设备

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
npm start
```

## 部署到 Vercel

1. 将项目推送到 GitHub 仓库
2. 在 Vercel 中导入项目
3. 部署完成后即可访问

或者使用 Vercel CLI：

```bash
npm i -g vercel
vercel
```

## 项目结构

```
├── app/
│   ├── components/          # React 组件
│   │   ├── PlayerConfig.tsx # 玩家配置组件
│   │   └── SimulationResults.tsx # 结果显示组件
│   ├── api/
│   │   └── simulate/        # API 路由
│   ├── utils/               # 工具函数
│   ├── types.ts            # TypeScript 类型定义
│   ├── layout.tsx          # 布局组件
│   ├── page.tsx            # 主页面
│   └── globals.css         # 全局样式
├── public/
│   └── fightSimulator.js   # 战斗模拟器 Worker
├── fightSimulator.js       # 原始战斗逻辑（保持不变）
└── ...
```

## 核心功能

### 战斗模拟

核心战斗逻辑保存在 `fightSimulator.js` 中，该文件包含了复杂的战斗计算逻辑，保持原有功能不变。

### 玩家配置

支持配置：
- 基础属性（力量、防御、速度、敏捷）
- 生命值
- 被动加成
- 武器设置（主武器、副武器、近战武器、临时武器）
- 护甲配置
- 教育技能
- 派系加成
- 公司特效
- 房产加成
- 功勋加成

### 模拟结果

显示详细的统计信息：
- 胜率统计
- 平均回合数
- 生命值分布
- 战斗日志

## 技术栈

- **框架**: Next.js 14
- **UI**: React 18 + Tailwind CSS
- **语言**: TypeScript
- **部署**: Vercel
- **性能**: Web Workers

## 开发说明

### 战斗逻辑

`fightSimulator.js` 包含原始的战斗计算逻辑，该文件不应该被修改。新的 UI 层通过 Web Worker 与其通信。

### 组件开发

所有 UI 组件都使用 TypeScript 和 Tailwind CSS 构建，确保类型安全和样式一致性。

### API 设计

API 路由处理前端请求，转换数据格式后调用战斗模拟器。

## 贡献

如果发现 bug 或有改进建议，请联系 811。

## 许可证

保留所有权利。 