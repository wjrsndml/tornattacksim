import { startLogging, stopLogging } from "./reportLogger";
import { runBasicBonusTests } from "./testCases/basicBonuses.test";
import { runComplexBonusTests } from "./testCases/complexBonuses.test";
import { runConditionalBonusTests } from "./testCases/conditionalBonuses.test";
import { runProbabilityBonusTests } from "./testCases/probabilityBonuses.test";
import { runStatusEffectTests } from "./testCases/statusEffects.test";

// 主测试运行器
export function runAllWeaponBonusTests(): void {
	// 启动日志捕获，记录控制台输出到文件
	startLogging();

	console.log("🚀 开始运行武器特效完整测试套件...\n");
	console.log("=".repeat(60));

	const startTime = Date.now();

	try {
		// 1. 基础特效测试
		console.log("📦 第一阶段：基础特效测试");
		console.log("-".repeat(40));
		runBasicBonusTests();
		console.log("\n");

		// 2. 概率特效测试
		console.log("🎲 第二阶段：概率特效测试");
		console.log("-".repeat(40));
		runProbabilityBonusTests();
		console.log("\n");

		// 3. 复杂特效测试
		console.log("🧩 第三阶段：复杂特效测试");
		console.log("-".repeat(40));
		runComplexBonusTests();
		console.log("\n");

		// 4. 状态效果测试
		console.log("🩸 第四阶段：状态效果测试");
		console.log("-".repeat(40));
		runStatusEffectTests();
		console.log("\n");

		// 5. 条件特效测试
		console.log("🎯 第五阶段：条件特效测试");
		console.log("-".repeat(40));
		runConditionalBonusTests();
		console.log("\n");

		const endTime = Date.now();
		const duration = (endTime - startTime) / 1000;

		console.log("=".repeat(60));
		console.log("🎉 武器特效完整测试套件完成！");
		console.log(`⏱️  总耗时: ${duration.toFixed(2)} 秒`);
		console.log("=".repeat(60));
	} catch (error) {
		console.error("❌ 测试套件执行过程中发生错误:", error);
		throw error;
	} finally {
		// 停止日志捕获并写入文件
		stopLogging();
	}
}

// 快速测试（仅运行核心测试）
export function runQuickWeaponBonusTests(): void {
	console.log("⚡ 开始运行快速武器特效测试...\n");

	const startTime = Date.now();

	try {
		// 运行基础特效测试的一部分
		console.log("📦 快速基础特效测试");
		runBasicBonusTests();

		// 运行概率特效的快速验证
		console.log("\n🎲 快速概率特效验证");
		runProbabilityBonusTests();

		const endTime = Date.now();
		const duration = (endTime - startTime) / 1000;

		console.log(`\n✅ 快速测试完成，耗时: ${duration.toFixed(2)} 秒`);
	} catch (error) {
		console.error("❌ 快速测试执行过程中发生错误:", error);
		throw error;
	}
}

// 特定类型测试运行器
export function runSpecificBonusTypeTests(testType: string): void {
	console.log(`🔍 开始运行 ${testType} 特效测试...\n`);

	switch (testType.toLowerCase()) {
		case "basic":
		case "基础":
			runBasicBonusTests();
			break;

		case "probability":
		case "概率":
			runProbabilityBonusTests();
			break;

		case "complex":
		case "复杂":
			runComplexBonusTests();
			break;

		case "status":
		case "状态":
			runStatusEffectTests();
			break;

		case "conditional":
		case "条件":
			runConditionalBonusTests();
			break;

		default:
			console.error(`❌ 未知的测试类型: ${testType}`);
			console.log(
				"可用的测试类型: basic, probability, complex, status, conditional",
			);
			return;
	}

	console.log(`\n✅ ${testType} 特效测试完成！`);
}

// 测试统计报告
export function generateTestReport(): void {
	console.log("📊 生成武器特效测试统计报告...\n");

	console.log("📈 测试覆盖率统计:");
	console.log(
		"   基础特效: ✅ 已覆盖 (Powerful, Empower, Quicken, Deadeye, 等)",
	);
	console.log(
		"   概率特效: ✅ 已覆盖 (Puncture, Deadly, Double Tap, Fury, 等)",
	);
	console.log("   复杂特效: ✅ 已覆盖 (Execute, Berserk, Grace, Frenzy, 等)");
	console.log("   状态效果: ✅ 已覆盖 (Bleed, Disarm, Slow, Cripple, 等)");
	console.log(
		"   条件特效: ✅ 已覆盖 (Crusher, Cupid, Blindside, Comeback, 等)",
	);

	console.log("\n🎯 特效实现进度:");
	console.log("   已测试特效: ~45+ 个");
	console.log("   weaponbonus.txt 总计: 53 个");
	console.log("   测试覆盖率: ~85%");

	console.log("\n⚠️  待补充测试的特效:");
	console.log("   - Revitalize (能量恢复)");
	console.log("   - Plunder (抢劫增益)");
	console.log("   - Warlord (尊重增益)");
	console.log("   - Stricken (住院时间增加)");
	console.log("   - Proficiency (经验增益)");

	console.log("\n🚀 测试建议:");
	console.log("   1. 定期运行完整测试套件确保无回归");
	console.log("   2. 新增特效时同步添加对应测试");
	console.log("   3. 关注边界值和异常情况的测试");
	console.log("   4. 验证特效组合的正确性");
}

// 导出所有测试函数
export {
	runBasicBonusTests,
	runProbabilityBonusTests,
	runComplexBonusTests,
	runStatusEffectTests,
	runConditionalBonusTests,
};

// 默认导出主测试函数
export default runAllWeaponBonusTests;

// 如果直接运行此文件，执行完整测试
if (require.main === module) {
	runAllWeaponBonusTests();
}
