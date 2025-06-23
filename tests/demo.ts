// 武器特效测试框架演示脚本
import {
	formatTestResult,
	runTestSuite,
	type TestResult,
	testBonusEffect,
	testProbabilityBonus,
} from "./testUtils";

console.log("🎮 武器特效测试框架演示");
console.log("=".repeat(50));

// 演示1: 基础特效测试
console.log("\n📦 演示1: 基础特效测试");
console.log("-".repeat(30));

// 测试Powerful特效
const powerfulResult = testBonusEffect("Powerful", 25);
console.log(formatTestResult(powerfulResult));

// 测试Empower特效
const empowerResult = testBonusEffect("Empower", 20);
console.log(formatTestResult(empowerResult));

// 演示2: 概率特效测试
console.log("\n🎲 演示2: 概率特效测试");
console.log("-".repeat(30));

// 测试Deadly特效的触发率
const deadlyResult = testProbabilityBonus("Deadly", 10, 1000, 0.05);
console.log(
	`Deadly(10%): 期望触发率 ${(deadlyResult.expectedRate * 100).toFixed(1)}%, 实际触发率 ${(deadlyResult.actualRate * 100).toFixed(1)}%`,
);
console.log(`测试结果: ${deadlyResult.success ? "✅ 通过" : "❌ 失败"}`);

// 演示3: 批量测试
console.log("\n📊 演示3: 批量测试");
console.log("-".repeat(30));

const batchTests: (() => TestResult)[] = [
	() => testBonusEffect("Powerful", 10),
	() => testBonusEffect("Powerful", 25),
	() => testBonusEffect("Powerful", 50),
	() => testBonusEffect("Empower", 15),
	() => testBonusEffect("Quicken", 20),
];

const suite = runTestSuite("批量测试演示", batchTests);
console.log(
	`\n批量测试结果: ${suite.summary.passed}/${suite.summary.total} 通过`,
);

// 演示4: 条件特效测试
console.log("\n🎯 演示4: 条件特效测试");
console.log("-".repeat(30));

// 测试头部伤害特效
const crusherResult = testBonusEffect("Crusher", 75, {
	bodyPart: "head",
});
console.log(
	"Crusher(头部攻击):",
	crusherResult.success ? "✅ 生效" : "❌ 未生效",
);

// 测试非头部攻击
const crusherResult2 = testBonusEffect("Crusher", 75, {
	bodyPart: "chest",
});
console.log(
	"Crusher(胸部攻击):",
	crusherResult2.success ? "✅ 生效" : "❌ 未生效",
);

// 演示5: 错误处理
console.log("\n⚠️  演示5: 错误处理");
console.log("-".repeat(30));

try {
	// 测试不存在的特效
	const invalidResult = testBonusEffect("NonexistentBonus", 10);
	console.log(
		"不存在的特效测试:",
		invalidResult.success ? "意外成功" : `失败 - ${invalidResult.error}`,
	);
} catch (error) {
	console.log("捕获到错误:", error);
}

// 演示6: 性能对比
console.log("\n⚡ 演示6: 性能对比");
console.log("-".repeat(30));

const startTime = Date.now();

// 快速测试
const quickResult = testProbabilityBonus("Double Tap", 20, 100, 0.1);
const quickTime = Date.now() - startTime;

const midTime = Date.now();

// 精确测试
const preciseResult = testProbabilityBonus("Double Tap", 20, 5000, 0.03);
const preciseTime = Date.now() - midTime;

console.log(
	`快速测试 (100次): ${quickTime}ms, 结果: ${(quickResult.actualRate * 100).toFixed(1)}%`,
);
console.log(
	`精确测试 (5000次): ${preciseTime}ms, 结果: ${(preciseResult.actualRate * 100).toFixed(1)}%`,
);

console.log("\n" + "=".repeat(50));
console.log("🏁 演示完成！");
console.log("\n💡 提示:");
console.log("- 运行 'npm run test:weapons' 执行完整测试");
console.log("- 运行 'npm run test:weapons --quick' 执行快速测试");
console.log("- 运行 'npm run test:weapons --basic' 仅测试基础特效");
console.log("- 查看 tests/README.md 了解更多用法");
console.log("=".repeat(50));
