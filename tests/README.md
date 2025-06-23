# 武器特效自动化测试框架

这是一个专门用于测试武器特效系统的自动化测试框架，可以全面验证各种武器特效的正确性和稳定性。

## 📁 文件结构

```
tests/
├── README.md                    # 本文档
├── weaponBonusTests.ts         # 主测试入口
├── testUtils.ts                # 测试工具函数
├── mockData.ts                 # 测试模拟数据
├── reportLogger.ts             # 日志记录模块
├── loggerDemo.ts               # 日志系统演示
├── testCases/                  # 具体测试用例
│   ├── basicBonuses.test.ts    # 基础特效测试
│   ├── probabilityBonuses.test.ts # 概率特效测试
│   ├── complexBonuses.test.ts  # 复杂特效测试（待实现）
│   └── statusEffects.test.ts   # 状态效果测试（待实现）
└── reports/                    # 测试报告输出目录
    ├── *.log                   # 文本日志文件
    ├── *.html                  # HTML可视化报告
    └── *.json                  # JSON结构化报告
```

## 🚀 快速开始

### 运行所有测试
```bash
npm run test:weapons
```

### 快速测试模式
```bash
npm run test:weapons --quick
```

### 只运行基础特效测试
```bash
npm run test:weapons --basic
```

### 只运行概率特效测试
```bash
npm run test:weapons --probability
```

### 运行日志系统演示
```bash
npm run test:logger:demo
```

## 🧪 测试类型

### 1. 基础特效测试
测试确定性的武器特效，如：
- **Powerful**: 伤害增加百分比
- **Empower**: 力量属性增加
- **Quicken**: 速度属性增加
- **Deadeye**: 暴击伤害增加
- **Expose**: 暴击率增加
- **Penetrate**: 护甲穿透
- **Bloodlust**: 伤害回血
- **Specialist**: 伤害增加但限制弹夹

### 2. 概率特效测试
测试概率触发的武器特效，如：
- **Puncture**: 概率忽略护甲
- **Sure Shot**: 概率必中
- **Deadly**: 概率致命一击
- **Double Tap**: 概率双击
- **Fury**: 概率双击（近战）
- **Stun**: 概率眩晕
- **Parry**: 概率格挡

### 3. 条件特效测试（待实现）
测试需要特定条件的武器特效，如：
- **Crusher**: 头部伤害加成
- **Blindside**: 满血目标伤害加成
- **Comeback**: 低血量伤害加成
- **Assassinate**: 首回合伤害加成

### 4. 状态特效测试（待实现）
测试产生状态效果的武器特效，如：
- **Disarm**: 缴械效果
- **Slow**: 减速效果
- **Motivation**: 属性提升buff

## 🔧 测试工具

### 核心函数

#### `testBonusEffect(bonusName, bonusValue, testConfig?)`
测试单个武器特效的效果
```typescript
const result = testBonusEffect("Powerful", 25);
console.log(result.success); // true/false
console.log(result.details); // 详细测试结果
```

#### `testProbabilityBonus(bonusName, bonusValue, iterations?, tolerance?)`
测试概率特效的触发率
```typescript
const result = testProbabilityBonus("Deadly", 10, 1000, 0.05);
console.log(`触发率: ${result.actualRate * 100}%`);
console.log(`期望率: ${result.expectedRate * 100}%`);
```

#### `runTestSuite(suiteName, tests)`
运行一组测试并生成报告
```typescript
const tests = [
  () => testBonusEffect("Powerful", 10),
  () => testBonusEffect("Powerful", 25),
];
const suite = runTestSuite("Powerful测试", tests);
```

### 辅助函数

#### `createTestPlayer(config?)`
创建测试用的玩家对象
```typescript
const player = createTestPlayer({
  life: 500,
  maxLife: 1000,
});
```

#### `createTestContext(config?)`
创建测试用的伤害上下文
```typescript
const context = createTestContext({
  bodyPart: "head",
  isCritical: true,
});
```

#### `createWeaponWithBonus(bonusName, bonusValue)`
创建带有特定特效的武器
```typescript
const weapon = createWeaponWithBonus("Powerful", 25);
```

## 📊 测试报告与日志系统

### 自动日志记录
测试框架自动将所有控制台输出同时保存到日志文件中：
- 📝 文本日志文件（.log）- 完整的测试过程记录
- 📄 HTML报告文件（.html）- 可视化的测试结果
- 📋 JSON报告文件（.json）- 机器可读的结构化数据

日志文件保存在 `tests/reports/` 目录下，文件名包含时间戳便于管理。

### 控制台输出示例
```
=== 基础特效测试 ===
Total: 36, Passed: 35, Failed: 1
Success Rate: 97.2%

✅ PASS Powerful(5%)
✅ PASS Powerful(10%)
❌ FAIL Powerful(25%)
  Error: 伤害计算错误: 期望 125, 实际 124
```

### 概率测试报告
```
📈 概率特效统计详情:
✅ Deadly: 期望 10.0%, 实际 9.8%, 差异 0.2%
✅ Double Tap: 期望 25.0%, 实际 24.7%, 差异 0.3%
❌ Puncture: 期望 50.0%, 实际 47.2%, 差异 2.8%
```

### 日志系统功能
- **双重输出**: 同时显示在控制台和保存到文件
- **时间戳**: 每条日志都带有精确的时间信息
- **分级记录**: 支持 LOG、INFO、WARN、ERROR 等级别
- **HTML报告**: 生成美观的可视化测试报告
- **JSON导出**: 便于自动化分析和CI集成
- **性能统计**: 自动记录测试耗时和性能指标

## ⚙️ 配置选项

### 测试配置
```typescript
interface TestConfig {
  runBasic?: boolean;        // 运行基础特效测试
  runProbability?: boolean;  // 运行概率特效测试
  runConditional?: boolean;  // 运行条件特效测试
  runStatus?: boolean;       // 运行状态特效测试
  runComplex?: boolean;      // 运行复杂特效测试
  verbose?: boolean;         // 详细输出
  quick?: boolean;          // 快速模式
}
```

### 性能配置
```typescript
// 快速测试（开发时用）
const quickConfig = {
  iterations: 100,
  tolerance: 0.1, // 10%容差
};

// 标准测试
const standardConfig = {
  iterations: 1000,
  tolerance: 0.05, // 5%容差
};

// 精确测试（CI时用）
const preciseConfig = {
  iterations: 10000,
  tolerance: 0.02, // 2%容差
};
```

## 🎯 使用示例

### 测试新增的特效
```typescript
// 1. 在 mockData.ts 中添加测试数据
export const BONUS_TEST_DATA = {
  basic: [
    // ... 现有数据
    { name: "NewBonus", values: [10, 20, 30] },
  ],
};

// 2. 在相应的测试文件中添加测试用例
for (const value of BONUS_TEST_DATA.basic.find(b => b.name === "NewBonus")?.values || []) {
  allTests.push(() => testBonusEffect("NewBonus", value));
}
```

### 调试特定特效
```typescript
// 直接测试特定特效
const result = testBonusEffect("Disarm", 15, {
  bodyPart: "left hand",
});

if (!result.success) {
  console.log("测试失败:", result.error);
  console.log("详细信息:", result.details);
}
```

### 验证概率特效的准确性
```typescript
// 测试多个数值的概率特效
const values = [5, 10, 15, 20, 25];
for (const value of values) {
  const result = testProbabilityBonus("Deadly", value, 5000, 0.03);
  console.log(`Deadly(${value}%): ${result.success ? "✅" : "❌"} ${(result.actualRate * 100).toFixed(1)}%`);
}
```

## 🔍 故障排除

### 常见问题

1. **类型错误**
   - 确保导入了正确的类型定义
   - 检查 `fightSimulatorTypes.ts` 中的接口定义

2. **概率测试失败**
   - 增加迭代次数或提高容差
   - 检查随机数生成器是否正常工作

3. **特效未触发**
   - 验证特效处理器是否正确注册
   - 检查触发条件是否满足

### 调试技巧

1. **启用详细输出**
   ```bash
   npm run test:weapons --verbose
   ```

2. **单独测试问题特效**
   ```typescript
   testSpecificBonusInDepth("ProblematicBonus", 25);
   ```

3. **检查触发的特效**
   ```typescript
   const result = testBonusEffect("SomeBonus", 20);
   console.log("触发的特效:", result.triggeredEffects);
   ```

## 🚧 待实现功能

- [ ] 条件特效测试模块
- [ ] 状态效果测试模块
- [ ] 复杂特效测试模块
- [ ] HTML格式测试报告
- [ ] 测试覆盖率统计
- [ ] 性能基准测试
- [ ] 历史结果对比
- [ ] CI/CD集成

## 🤝 贡献指南

1. 添加新的测试用例时，请在 `mockData.ts` 中添加相应的测试数据
2. 为新特效编写测试时，请参考现有的测试模式
3. 确保所有测试都有适当的错误处理和详细的错误信息
4. 概率测试应该包含多个数值和适当的容差设置

---

这个测试框架提供了全面、直观的武器特效测试能力，帮助确保游戏机制的正确性和稳定性。 