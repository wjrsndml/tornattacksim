# Torn 战斗模拟器

一个基于 Next.js 15 的现代化 Torn 游戏战斗模拟器，使用蒙特卡洛算法进行精确的战斗预测。

## ✨ 主要特性

- **现代技术栈**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **高性能计算**: Web Workers 多线程模拟，支持最多 100,000 次战斗计算
- **详细统计**: 胜率分析、平均回合数、生命值分布图表
- **完整配置**: 全面的玩家属性、武器装备、护甲、技能配置
- **战斗日志**: 详细的战斗过程记录和 CSV 导出功能
- **响应式设计**: 支持桌面和移动设备的现代化界面

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

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

### 代码检查

```bash
# 运行 Biome 代码检查
npm run lint

# 自动修复代码格式问题
npm run lint:fix

# TypeScript 类型检查
npm run check
```

## 📁 项目结构

```text
├── app/
│   ├── components/              # React 组件
│   │   ├── PlayerConfig.tsx     # 玩家配置组件
│   │   ├── SimulationResults.tsx # 模拟结果展示
│   │   ├── LifeHistogram.tsx    # 生命值分布图
│   │   ├── BattleLogExport.tsx  # 战斗日志导出
│   │   ├── WeaponSelector.tsx   # 武器选择器
│   │   ├── ArmourSelector.tsx   # 护甲选择器
│   │   └── ui/                  # 基础 UI 组件
│   ├── lib/                     # 核心逻辑
│   │   ├── fightSimulator.ts    # 战斗模拟核心
│   │   ├── clientSimulator.ts   # 客户端模拟器
│   │   ├── dataLoader.ts        # 数据加载器
│   │   └── fightSimulatorTypes.ts # 类型定义
│   ├── utils/                   # 工具函数
│   │   └── fightWorker.ts       # Web Worker 实现
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 主页面
│   └── globals.css              # 全局样式
├── public/                      # 静态资源
│   ├── weapons.json             # 武器数据
│   ├── armour.json              # 护甲数据
│   ├── mods.json                # 武器改装数据
│   ├── companies.json           # 公司数据
│   └── armourCoverage.json      # 护甲覆盖数据
└── ...
```

## ⚔️ 核心功能

### 战斗模拟引擎

- **蒙特卡洛算法**: 支持 100 到 100,000 次模拟，提供统计学意义的结果
- **多线程计算**: 使用 Web Workers 确保界面流畅性
- **精确战斗公式**: 完整实现 Torn 游戏的战斗机制

### 玩家配置系统

#### 基础属性

- 力量、防御、速度、敏捷四大属性
- 生命值设置
- 被动技能加成

#### 武器装备

- **主武器**: 步枪、冲锋枪、手枪等
- **副武器**: 备用武器选择
- **近战武器**: 穿刺、切割、粉碎武器
- **临时武器**: 手榴弹等一次性武器
- **武器改装**: 瞄准镜、激光、枪托等

#### 护甲系统

- 头盔、护甲、手套、裤子、靴子
- 护甲覆盖率计算
- 防护值设置

#### 技能与加成

- **教育技能**: 伤害、精准度、弹药控制等
- **派系加成**: 精准度和伤害提升
- **公司特效**: 各种公司特殊效果
- **房产加成**: 房产提供的战斗加成
- **功勋加成**: 功勋点数带来的技能提升

### 结果分析

#### 统计数据

- 详细胜率分析
- 平均战斗回合数
- 双方剩余生命值统计

#### 可视化图表

- 生命值分布直方图
- 自定义区间大小
- 死亡率与存活率分析

#### 战斗日志

- 完整的战斗过程记录
- 支持查看特定战斗详情
- CSV 格式数据导出

## 🛠️ 技术栈

### 前端框架

- **Next.js 15**: 最新的 React 全栈框架
- **React 19**: 最新的 React 版本，支持并发特性
- **TypeScript**: 完整的类型安全保障

### UI 与样式

- **Tailwind CSS**: 现代化的原子 CSS 框架
- **shadcn/ui**: 高质量的 React 组件库
- **Lucide React**: 专业的图标库
- **Chart.js**: 数据可视化图表

### 开发工具

- **Biome**: 快速的代码检查和格式化工具
- **Husky**: Git hooks 自动化
- **TypeScript**: 严格的类型检查

### 性能优化

- **Web Workers**: 多线程计算，避免主线程阻塞
- **SSR/SSG**: Next.js 的服务端渲染优化
- **代码分割**: 自动的懒加载和性能优化

## 📊 数据架构

### 游戏数据

所有游戏数据以 JSON 格式存储在 `/public/` 目录下：

- `weapons.json`: 包含所有武器的属性数据
- `armour.json`: 护甲装备的防护值和属性
- `mods.json`: 武器改装配件的效果数据
- `companies.json`: 公司特效和加成数据
- `armourCoverage.json`: 身体部位的护甲覆盖率

### 类型系统

完整的 TypeScript 类型定义确保数据一致性和开发体验。

## 🚀 部署

### Vercel 部署（推荐）

1. 将项目推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 自动构建和部署

或使用 Vercel CLI：

```bash
npm i -g vercel
vercel
```

### 其他平台

项目是标准的 Next.js 应用，支持部署到任何支持 Node.js 的平台。

## 🔧 开发指南

### 代码规范

项目使用 Biome 进行代码检查和格式化：

```bash
# 检查代码质量
npm run lint

# 自动修复问题
npm run lint:fix

# 格式化代码
npm run format
```

### 组件开发

- 所有组件使用 TypeScript 和 Tailwind CSS
- 遵循 React 19 的最佳实践
- 使用 shadcn/ui 组件库保持一致性

### 数据更新

游戏数据更新只需修改 `/public/` 目录下的 JSON 文件，无需修改代码。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发环境设置

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

## 📄 许可证

此项目保留所有权利。

## 📞 联系方式

如有问题或建议，请联系项目维护者。
