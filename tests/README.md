# 武器特效完整测试系统

这是一个全面的武器特效测试系统，涵盖了游戏中所有53种武器特效的测试验证，确保战斗系统的正确性和稳定性。测试覆盖率达到**85%以上**（45+个特效）。

## 📁 文件结构

```
tests/
├── README.md                    # 本文档  
├── weaponBonusTests.ts         # 主测试运行器
├── testUtils.ts                # 测试工具函数
├── mockData.ts                 # 测试模拟数据
├── demo.ts                     # 测试演示程序
├── reportLogger.ts             # 日志记录模块
├── loggerDemo.ts               # 日志系统演示
├── testCases/                  # 具体测试用例
│   ├── basicBonuses.test.ts    # 基础特效测试 ✅
│   ├── probabilityBonuses.test.ts # 概率特效测试 ✅
│   ├── complexBonuses.test.ts  # 复杂特效测试 ✅
│   ├── statusEffects.test.ts   # 状态效果测试 ✅
│   └── conditionalBonuses.test.ts # 条件特效测试 ✅
└── reports/                    # 测试报告输出目录
    ├── *.log                   # 文本日志文件
    ├── *.html                  # HTML可视化报告
    └── *.json                  # JSON结构化报告
```

## 🚀 快速开始

### 运行完整测试套件
```typescript
import { runAllWeaponBonusTests } from './tests/weaponBonusTests';
runAllWeaponBonusTests();
```

### 快速测试模式
```typescript
import { runQuickWeaponBonusTests } from './tests/weaponBonusTests';
runQuickWeaponBonusTests();
```

### 运行特定类型测试
```typescript
import { runSpecificBonusTypeTests } from './tests/weaponBonusTests';

// 支持中英文
runSpecificBonusTypeTests('basic');      // 或 '基础'
runSpecificBonusTypeTests('probability'); // 或 '概率'
runSpecificBonusTypeTests('complex');    // 或 '复杂'
runSpecificBonusTypeTests('status');     // 或 '状态'
runSpecificBonusTypeTests('conditional'); // 或 '条件'
```

### 生成测试报告
```typescript
import { generateTestReport } from './tests/weaponBonusTests';
generateTestReport();
```

### 运行演示程序
```bash
# 设置演示类型并运行
DEMO_TYPE=all npx ts-node tests/demo.ts      # 完整测试套件
DEMO_TYPE=quick npx ts-node tests/demo.ts    # 快速测试
DEMO_TYPE=basic npx ts-node tests/demo.ts    # 基础特效测试
DEMO_TYPE=report npx ts-node tests/demo.ts   # 生成测试报告
```

## 🧪 测试类型与覆盖率

### 1. 基础特效测试 ✅ (9个特效)
测试简单数值修改的特效：
- **Powerful**: 伤害增加百分比
- **Empower**: 力量属性增加
- **Quicken**: 速度属性增加
- **Deadeye**: 暴击伤害增加
- **Expose**: 暴击率增加
- **Penetrate**: 护甲穿透
- **Bloodlust**: 伤害回血
- **Specialist**: 单发弹夹伤害加成
- **Conserve**: 弹药保存

### 2. 概率特效测试 ✅ (9个特效)
测试基于概率触发的特效：
- **Puncture**: 概率忽略护甲
- **Sure Shot**: 概率必中
- **Deadly**: 概率致命一击 (+500%伤害)
- **Double Tap**: 概率连击两次
- **Fury**: 概率多次攻击
- **Double-edged**: 概率双倍伤害但自伤
- **Stun**: 概率眩晕敌人
- **Home Run**: 概率格挡临时物品
- **Parry**: 概率格挡近战攻击

### 3. 复杂特效测试 ✅ (9个特效)
测试需要多回合或复杂条件的特效：
- **Execute**: 低血量目标即死
- **Berserk**: 增加伤害但降低命中率
- **Grace**: 增加命中率但降低伤害
- **Frenzy**: 连续命中增加伤害和精确度
- **Focus**: 连续失误增加命中率
- **Finale**: 每回合不使用武器增加伤害
- **Wind-up**: 蓄力后增加伤害
- **Rage**: 概率性多次攻击 (2-8次)
- **Smurf**: 基于等级差异增加伤害

### 4. 状态效果测试 ✅ (11个特效)
测试DOT效果、debuff效果等：
- **Bleed**: 流血DOT效果 (9回合衰减)
- **Disarm**: 缴械效果 (禁用武器N回合)
- **Slow**: 降低速度25% (x3层)
- **Cripple**: 降低敏捷25% (x3层)
- **Weaken**: 降低防御25% (x3层)
- **Wither**: 降低力量25% (x3层)
- **Eviscerate**: 目标受到额外伤害
- **Motivation**: 增加所有属性10% (最多5层)
- **Paralyzed**: 瘫痪 (50%概率失去回合)
- **Suppress**: 压制 (25%概率失去未来回合)
- **Irradiate**: 辐射中毒 (1-3小时)

### 5. 条件特效测试 ✅ (8个特效)
测试基于特定条件的特效：

**身体部位条件：**
- **Crusher**: 头部伤害加成
- **Cupid**: 心脏伤害加成
- **Achilles**: 脚部伤害加成
- **Throttle**: 喉咙伤害加成
- **Roshambo**: 腹股沟伤害加成

**其他条件：**
- **Blindside**: 目标满血时伤害加成
- **Comeback**: 自己低血量时伤害加成
- **Assassinate**: 第一回合伤害加成
- **Backstab**: 目标分心时双倍伤害

## 📊 测试覆盖率统计

### ✅ 已实现测试 (45+个特效)
- **基础特效**: 9个 - 100%覆盖
- **概率特效**: 9个 - 100%覆盖  
- **复杂特效**: 9个 - 100%覆盖
- **状态效果**: 11个 - 100%覆盖
- **条件特效**: 8个 - 100%覆盖

### ⚠️ 待补充测试 (~8个特效)
主要是非核心战斗功能的特效：
- **Revitalize**: 能量恢复
- **Plunder**: 抢劫增益
- **Warlord**: 尊重增益
- **Stricken**: 住院时间增加
- **Proficiency**: 经验增益
- 其他非战斗核心特效

**总体测试覆盖率：~85%** (45+/53)

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

## 🚧 持续改进计划

### ✅ 已完成功能
- [x] 基础特效测试模块
- [x] 概率特效测试模块  
- [x] 复杂特效测试模块
- [x] 状态效果测试模块
- [x] 条件特效测试模块
- [x] 测试覆盖率统计
- [x] 性能基准测试
- [x] 详细测试报告

### 🔄 改进中功能
- [ ] HTML格式可视化报告
- [ ] 历史结果对比
- [ ] CI/CD集成优化
- [ ] 剩余8个特效测试补充

### 🆕 计划新增功能
- [ ] 测试数据可视化图表
- [ ] 自动化回归测试
- [ ] 特效性能基准比较
- [ ] 错误模式分析报告

## 🤝 贡献指南

### 添加新特效测试
1. **确定特效类别** - 选择合适的测试文件
2. **更新测试数据** - 在 `mockData.ts` 中添加测试配置
3. **实现测试函数** - 参考现有测试模式
4. **集成到测试套件** - 在主测试函数中调用

### 代码质量要求
1. 每个测试都应该独立且可重复
2. 提供详细的错误信息和调试数据
3. 使用适当的容差和迭代次数
4. 包含边界值和异常情况测试

### 测试最佳实践
1. **测试隔离** - 使用 `clearTriggeredEffects()` 清理状态
2. **数据验证** - 验证输入输出的合理性
3. **错误处理** - 捕获异常并继续执行
4. **性能考虑** - 合理选择测试参数

---

## 📋 总结

这个**武器特效完整测试系统**已经实现了对游戏中85%以上武器特效的全面测试覆盖，包括：

🎯 **核心特效全覆盖**：所有影响战斗的关键特效都已纳入测试
📊 **测试质量保证**：多层次验证确保特效实现的正确性
🔧 **开发友好**：提供简单易用的API和详细的测试报告
⚡ **性能优化**：支持快速测试和精确测试模式

这套测试系统为游戏战斗系统的稳定性和正确性提供了强有力的保障。 