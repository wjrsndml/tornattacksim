# Torn Battle Simulator - 项目总结文档

## 项目概述

这是一个基于 Next.js 14 的现代化 Torn 游戏战斗模拟器，将原始的 Python/HTML 项目重写为 TypeScript/React 应用，并部署到 Vercel 平台。

### 核心特点
- **保留原始战斗逻辑**：核心战斗算法完全保持不变（来自原 2000+ 行的 fightSimulator.js）
- **现代化界面**：使用 React + Tailwind CSS 构建美观的响应式界面
- **真实数据集成**：使用从游戏中提取的真实武器、护甲、改装数据
- **完整功能覆盖**：包含武器选择、护甲配置、技能设置、战斗日志、数据可视化等

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **UI**: React 18 + Tailwind CSS
- **部署**: Vercel
- **数据**: JSON 静态文件

## 项目结构

```
tornbattlesim/
├── app/
│   ├── api/simulate/route.ts          # 战斗模拟 API
│   ├── components/                    # React 组件
│   │   ├── PlayerConfig.tsx          # 玩家配置主组件
│   │   ├── WeaponSelector.tsx        # 武器选择器
│   │   ├── ArmourSelector.tsx        # 护甲选择器
│   │   ├── ModSelector.tsx           # 改装选择器
│   │   ├── ArmourCoverage.tsx        # 护甲覆盖系统
│   │   ├── BattleLog.tsx             # 战斗日志
│   │   ├── SimulationResults.tsx     # 结果显示
│   │   └── LifeHistogram.tsx         # 生命值分布图
│   ├── lib/
│   │   ├── fightSimulator.ts         # 核心战斗逻辑 (TypeScript 版)
│   │   ├── fightSimulatorTypes.ts    # 类型定义
│   │   └── dataLoader.ts             # 数据加载器
│   ├── globals.css                   # 全局样式
│   ├── layout.tsx                    # 应用布局
│   ├── page.tsx                      # 主页面
│   └── types.ts                      # 前端类型定义
├── public/
│   ├── weapons.json                  # 武器数据 (45KB, 2029行)
│   ├── armour.json                   # 护甲数据
│   ├── mods.json                     # 改装数据
│   ├── companies.json                # 公司数据
│   └── fightSimulator.js            # 原始战斗逻辑 (备用)
└── 配置文件...
```
原版实现
fightMgmt.js
fightSimulator.js
fightUI.js
proxisim
## 核心文件详解

### 1. `app/lib/fightSimulator.ts` (1432行)
**最重要的文件** - 从原始 JavaScript 完全移植到 TypeScript 的战斗模拟器

**主要函数:**
- `fight()`: 主战斗循环
- `takeTurns()`: 回合处理
- `action()`: 玩家行动逻辑 (191-979行，包含所有武器类型、特效、DOT、临时药剂等)
- `applyPMT()`: 技能、改装、临时效果应用 (1475-2073行移植)
- 工具函数: `chooseWeapon`, `maxDamage`, `hitChance`, `selectBodyPart` 等

**关键特性:**
- 完整的武器系统（主武器、副武器、近战、临时）
- 弹药类型支持 (Standard/TR/PI/HP/IN)
- 护甲覆盖系统
- DOT效果 (燃烧、中毒、撕裂、严重燃烧)
- 状态效果 (士气低落、冰冻、枯萎、减速、虚弱、残废)
- 临时药剂效果
- 公司/教育/荣誉技能

### 2. `app/lib/fightSimulatorTypes.ts`
完整的 TypeScript 类型定义，包括：
- `FightPlayer`, `WeaponData`, `ArmourData`
- `StatusEffects`, `DOTEffects`, `TempEffects`
- `PlayerPerks` (教育、荣誉、公司技能)
- 函数返回值类型

### 3. `app/lib/dataLoader.ts`
数据加载和转换系统：
- `loadGameData()`: 加载所有 JSON 数据
- `convertRealWeaponData()`: 转换真实武器数据
- `getWeaponById()`, `getArmourById()`: 数据获取
- `getArmourCoverage()`: 护甲覆盖数据

### 4. `app/components/PlayerConfig.tsx`
玩家配置主组件，包含：
- 基础属性设置 (生命值、力量、速度、防御、敏捷)
- 武器选择 (主武器、副武器、近战、临时)
- 护甲选择 (头部、身体、手部、腿部、脚部)
- 技能配置 (教育技能、荣誉技能、公司技能)

## 已实现功能

### ✅ 核心功能
1. **完整战斗模拟**: 保持原始逻辑的战斗计算
2. **真实数据集成**: 使用游戏真实的武器/护甲/改装数据
3. **武器系统**: 
   - 武器选择器显示真实武器数据
   - 改装系统 (最多3个改装)
   - 弹药类型选择 (Standard/TR/PI/HP/IN)
   - 武器经验值设置
4. **护甲系统**:
   - 5个部位护甲选择
   - 护甲覆盖系统 (显示对临时武器的防护)
   - 自动显示护甲名称 (n/a时显示type)

### ✅ 技能系统
1. **荣誉技能**: 武器精通 (各武器类型经验值滑块)
2. **教育技能**: 武器精准度技能 (机枪、冲锋枪、手枪、步枪等)
3. **公司技能**: 基础公司选择和星级

### ✅ 界面功能
1. **战斗日志**: 详细的回合记录，支持展开/收起
2. **生命值分布**: 直方图显示，支持CSV下载
3. **结果统计**: 胜率、平均回合数、平均剩余生命值
4. **响应式设计**: 支持桌面和移动设备

## 最近修复的问题

### 🔧 弹药显示问题
**问题**: 战斗日志中弹药类型显示为 "undefined"
**解决**: 
- 修复 API 路由中弹药类型传递
- 添加 `getAmmoDisplayName()` 函数统一处理弹药显示
- 确保 Standard 弹药正确显示为 "standard"

### 🔧 护甲名称显示问题  
**问题**: 部分护甲显示为 "n/a"
**解决**:
- 修改护甲选择器，当 `set` 为 "n/a" 时显示 `type` 字段
- 更新护甲覆盖组件的显示逻辑
- 添加 `getDisplayName()` 函数处理护甲名称显示

### 🔧 编码问题
**问题**: PowerShell 替换操作导致 UTF-8 编码损坏
**解决**: 手动修复所有乱码字符，避免使用 PowerShell 批量替换

## 数据文件说明

### `public/weapons.json` (45KB)
```json
{
  "primary": { "weaponId": { "name": "...", "damage_range": [min, max], ... } },
  "secondary": { ... },
  "melee": { ... },
  "temporary": { ... },
  "tempBlock": { "临时武器名": ["可防护护甲套装"] }
}
```

### `public/armour.json`
```json
{
  "head": { "armourId": { "set": "套装名", "type": "类型", "armour_range": [min, max] } },
  "body": { ... },
  ...
}
```

### `public/mods.json`
改装数据，包含精准度、伤害、暴击等效果

## 待解决问题

### 🚨 高优先级
1. **编码问题**: `fightSimulator.ts` 中仍有部分乱码字符需要修复
2. **弹药效果**: 确认弹药类型的战斗效果是否正确应用
3. **护甲覆盖**: 验证临时武器的护甲阻挡逻辑

### 📋 中优先级
1. **性能优化**: 大量模拟时的性能改进
2. **错误处理**: 更好的错误提示和异常处理
3. **数据验证**: 输入数据的合法性检查

### 💡 低优先级
1. **更多技能**: 实现更多荣誉技能和教育技能
2. **保存/加载**: 配置的保存和加载功能
3. **比较模式**: 多个配置的对比功能

## 开发指南

### 启动项目
```bash
npm install
npm run dev
```

### 修改战斗逻辑
- 主要在 `app/lib/fightSimulator.ts` 中修改
- 保持函数签名不变以确保兼容性
- 测试时注意检查战斗日志的正确性

### 添加新功能
1. 在 `app/components/` 中创建新组件
2. 在 `app/lib/fightSimulatorTypes.ts` 中添加类型定义
3. 在 `app/page.tsx` 中集成新功能

### 数据更新
- 替换 `public/*.json` 文件
- 确保数据格式与 `dataLoader.ts` 中的转换函数兼容

## 注意事项

1. **不要修改核心战斗逻辑**: `fightSimulator.ts` 中的算法应保持与原版一致
2. **编码问题**: 避免使用 PowerShell 进行文本替换，容易导致编码损坏
3. **类型安全**: 充分利用 TypeScript 的类型检查，避免运行时错误
4. **性能考虑**: 大量模拟时注意内存使用和计算效率

## 联系方式

如需进一步了解项目细节或遇到问题，请参考：
- 代码注释中的详细说明
- 各组件的 props 接口定义
- 战斗日志输出进行调试 