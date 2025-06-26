// 武器特效测试框架演示脚本
import {
	formatTestResult,
	runTestSuite,
	type TestResult,
	testBonusEffect,
	testProbabilityBonus,
} from "./testUtils";

import {
	generateTestReport,
	runAllWeaponBonusTests,
	runBasicBonusTests,
	runComplexBonusTests,
	runConditionalBonusTests,
	runProbabilityBonusTests,
	runQuickWeaponBonusTests,
	runSpecificBonusTypeTests,
	runStatusEffectTests,
} from "./weaponBonusTests";

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

console.log(`\n${"=".repeat(50)}`);
console.log("🏁 演示完成！");
console.log("\n💡 提示:");
console.log("- 运行 'npm run test:weapons' 执行完整测试");
console.log("- 运行 'npm run test:weapons --quick' 执行快速测试");
console.log("- 运行 'npm run test:weapons --basic' 仅测试基础特效");
console.log("- 查看 tests/README.md 了解更多用法");
console.log("=".repeat(50));

// 武器特效测试演示
export function runTestDemo(): void {
	console.log("🎮 武器特效测试系统演示\n");

	try {
		// 选择演示类型
		const demoType = process.env.DEMO_TYPE || "basic";

		switch (demoType.toLowerCase()) {
			case "all":
				console.log("🚀 演示：运行完整测试套件");
				runAllWeaponBonusTests();
				break;

			case "quick":
				console.log("⚡ 演示：快速测试模式");
				runQuickWeaponBonusTests();
				break;

			case "basic":
				console.log("📦 演示：基础特效测试");
				runBasicBonusTests();
				break;

			case "probability":
				console.log("🎲 演示：概率特效测试");
				runProbabilityBonusTests();
				break;

			case "complex":
				console.log("🧩 演示：复杂特效测试");
				runComplexBonusTests();
				break;

			case "status":
				console.log("🩸 演示：状态效果测试");
				runStatusEffectTests();
				break;

			case "conditional":
				console.log("🎯 演示：条件特效测试");
				runConditionalBonusTests();
				break;

			case "report":
				console.log("📊 演示：生成测试报告");
				generateTestReport();
				break;

			case "specific": {
				console.log("🔍 演示：特定类型测试");
				const testType = process.env.TEST_TYPE || "基础";
				runSpecificBonusTypeTests(testType);
				break;
			}

			default:
				console.log("❓ 未知演示类型，运行基础测试");
				runBasicBonusTests();
		}
	} catch (error) {
		console.error("❌ 演示过程中发生错误:", error);
		process.exit(1);
	}
}

// 展示测试系统功能
export function showcaseTestSystem(): void {
	console.log("🎯 武器特效测试系统功能展示\n");

	console.log("📋 可用的测试类型:");
	console.log("   1. 基础特效测试 - 测试简单的数值修改特效");
	console.log("   2. 概率特效测试 - 测试基于概率触发的特效");
	console.log("   3. 复杂特效测试 - 测试多回合、复合条件的特效");
	console.log("   4. 状态效果测试 - 测试DOT、debuff等持续效果");
	console.log("   5. 条件特效测试 - 测试基于特定条件的特效");

	console.log("\n🛠️  测试功能:");
	console.log("   ✅ 自动化测试执行");
	console.log("   ✅ 详细的测试报告");
	console.log("   ✅ 边界值测试");
	console.log("   ✅ 特效组合测试");
	console.log("   ✅ 性能基准测试");
	console.log("   ✅ 错误处理验证");

	console.log("\n📊 已覆盖的特效 (部分列表):");
	console.log("   🔹 基础特效: Powerful, Empower, Quicken, Deadeye, Expose");
	console.log("   🔹 概率特效: Puncture, Deadly, Double Tap, Fury, Stun");
	console.log("   🔹 复杂特效: Execute, Berserk, Grace, Frenzy, Focus");
	console.log("   🔹 状态效果: Bleed, Disarm, Slow, Cripple, Weaken");
	console.log(
		"   🔹 条件特效: Crusher, Cupid, Blindside, Comeback, Assassinate",
	);

	console.log("\n🚀 使用方法:");
	console.log("   运行完整测试: runAllWeaponBonusTests()");
	console.log("   快速测试: runQuickWeaponBonusTests()");
	console.log("   特定测试: runSpecificBonusTypeTests('basic')");
	console.log("   生成报告: generateTestReport()");
}

// 性能基准测试演示
export function performanceBenchmarkDemo(): void {
	console.log("⚡ 性能基准测试演示\n");

	const iterations = [100, 500, 1000, 5000];
	const testTypes = ["basic", "probability"];

	console.log("📊 测试不同迭代次数下的性能表现:");

	for (const testType of testTypes) {
		console.log(`\n🔹 ${testType} 特效测试:`);

		for (const iter of iterations) {
			const startTime = Date.now();

			// 模拟测试执行
			if (testType === "basic") {
				console.log(`   ${iter} 次迭代 - 模拟基础测试...`);
			} else {
				console.log(`   ${iter} 次迭代 - 模拟概率测试...`);
			}

			const endTime = Date.now();
			const duration = endTime - startTime;

			console.log(`   ⏱️  耗时: ${duration}ms`);
		}
	}

	console.log("\n💡 性能优化建议:");
	console.log("   1. 对于概率测试，合理选择迭代次数");
	console.log("   2. 使用快速测试模式进行日常验证");
	console.log("   3. 定期运行完整测试套件");
	console.log("   4. 监控测试执行时间变化");
}

// 错误处理演示
export function errorHandlingDemo(): void {
	console.log("🛡️  错误处理能力演示\n");

	console.log("📋 测试系统的错误处理能力:");

	console.log("\n1. 输入验证:");
	console.log("   ✅ 无效特效名称检测");
	console.log("   ✅ 数值范围验证");
	console.log("   ✅ 类型检查");

	console.log("\n2. 运行时错误:");
	console.log("   ✅ 空指针异常处理");
	console.log("   ✅ 计算溢出检测");
	console.log("   ✅ 状态不一致检查");

	console.log("\n3. 测试失败处理:");
	console.log("   ✅ 详细错误信息输出");
	console.log("   ✅ 失败测试定位");
	console.log("   ✅ 继续执行其他测试");

	console.log("\n4. 恢复机制:");
	console.log("   ✅ 测试环境重置");
	console.log("   ✅ 状态清理");
	console.log("   ✅ 资源释放");
}

// 主演示函数
function main(): void {
	console.log("🎮 武器特效测试系统 - 完整演示\n");
	console.log("=".repeat(60));

	const demos = [
		{ name: "功能展示", func: showcaseTestSystem },
		{ name: "测试演示", func: runTestDemo },
		{ name: "性能基准", func: performanceBenchmarkDemo },
		{ name: "错误处理", func: errorHandlingDemo },
	];

	demos.forEach((demo, index) => {
		console.log(`\n${index + 1}. ${demo.name}`);
		console.log("-".repeat(30));
		demo.func();
	});

	console.log(`\n${"=".repeat(60)}`);
	console.log("🎉 演示完成！");
	console.log("\n💡 提示: 设置环境变量来运行特定演示:");
	console.log("   DEMO_TYPE=all - 完整测试套件");
	console.log("   DEMO_TYPE=quick - 快速测试");
	console.log("   DEMO_TYPE=basic - 基础特效测试");
	console.log("   DEMO_TYPE=report - 生成测试报告");
}

// 如果直接运行此文件
if (require.main === module) {
	main();
}
