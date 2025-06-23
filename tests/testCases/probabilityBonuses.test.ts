import { BONUS_TEST_DATA, PERFORMANCE_TEST_CONFIG } from "../mockData";
import {
	formatTestSuite,
	type ProbabilityTestResult,
	runTestSuite,
	type TestResult,
	testProbabilityBonus,
} from "../testUtils";

// 概率特效测试函数
export function testProbabilityBonuses(): void {
	console.log("🎲 开始概率特效测试...\n");

	const allTests: (() => TestResult)[] = [];

	// 获取测试配置
	const config = PERFORMANCE_TEST_CONFIG.standard;

	// 测试所有概率特效
	for (const bonusData of BONUS_TEST_DATA.probability) {
		for (const value of bonusData.values) {
			allTests.push(() => {
				const result = testProbabilityBonus(
					bonusData.name,
					value,
					config.iterations,
					config.tolerance,
				);

				// 为概率测试结果添加额外信息
				return {
					...result,
					details: {
						...result.details,
						expectedRate: `${(result.expectedRate * 100).toFixed(1)}%`,
						actualRate: `${(result.actualRate * 100).toFixed(1)}%`,
						tolerance: `±${(result.tolerance * 100).toFixed(1)}%`,
						iterations: result.iterations,
					},
				};
			});
		}
	}

	// 运行所有测试
	const suite = runTestSuite("概率特效测试", allTests);
	console.log(formatTestSuite(suite));

	// 输出详细的概率统计
	console.log("\n📈 概率特效统计详情:");
	suite.results
		.filter((r): r is TestResult & ProbabilityTestResult => "actualRate" in r)
		.forEach((result) => {
			const status = result.success ? "✅" : "❌";
			const expectedPercent = (result.expectedRate * 100).toFixed(1);
			const actualPercent = (result.actualRate * 100).toFixed(1);
			const diff = Math.abs(result.actualRate - result.expectedRate) * 100;

			console.log(
				`${status} ${result.bonusName}: 期望 ${expectedPercent}%, 实际 ${actualPercent}%, 差异 ${diff.toFixed(1)}%`,
			);
		});

	// 输出总结
	const { total, passed, failed, successRate } = suite.summary;
	console.log(`\n📊 概率特效测试总结:`);
	console.log(`   总计: ${total} 个测试`);
	console.log(`   通过: ${passed} 个`);
	console.log(`   失败: ${failed} 个`);
	console.log(`   成功率: ${(successRate * 100).toFixed(1)}%`);

	if (failed > 0) {
		console.log(`\n❌ 超出容差的测试:`);
		suite.results
			.filter((r) => !r.success)
			.forEach((r) => {
				console.log(`   - ${r.bonusName}: ${r.error || "概率偏差过大"}`);
			});
	} else {
		console.log(`\n✅ 所有概率特效测试通过！`);
	}
}

// 极端概率测试
export function testExtremeProbabilities(): void {
	console.log("\n🎯 开始极端概率测试...\n");

	const extremeTests: (() => TestResult)[] = [];

	// 测试0%概率（永不触发）
	extremeTests.push(() => {
		const result = testProbabilityBonus("Deadly", 0, 1000, 0.01);

		// 0%概率应该永远不触发
		if (result.triggerCount > 0) {
			return {
				...result,
				success: false,
				error: `0%概率却触发了 ${result.triggerCount} 次`,
			};
		}

		return { ...result, success: true };
	});

	// 测试100%概率（必定触发）
	extremeTests.push(() => {
		const result = testProbabilityBonus("Sure Shot", 100, 1000, 0.01);

		// 100%概率应该每次都触发
		if (result.triggerCount !== result.iterations) {
			return {
				...result,
				success: false,
				error: `100%概率却只触发了 ${result.triggerCount}/${result.iterations} 次`,
			};
		}

		return { ...result, success: true };
	});

	// 测试极低概率
	extremeTests.push(() => {
		const result = testProbabilityBonus("Deadly", 1, 10000, 0.5); // 1%概率，高容差
		return result;
	});

	// 测试极高概率
	extremeTests.push(() => {
		const result = testProbabilityBonus("Puncture", 99, 1000, 0.05); // 99%概率
		return result;
	});

	const suite = runTestSuite("极端概率测试", extremeTests);
	console.log(formatTestSuite(suite));
}

// 快速概率验证测试
export function testQuickProbabilityValidation(): void {
	console.log("\n⚡ 开始快速概率验证测试...\n");

	const quickTests: (() => TestResult)[] = [];
	const config = PERFORMANCE_TEST_CONFIG.quick;

	// 选择几个代表性的概率特效进行快速测试
	const quickTestBonuses = [
		{ name: "Deadly", value: 10 },
		{ name: "Double Tap", value: 25 },
		{ name: "Puncture", value: 50 },
		{ name: "Stun", value: 20 },
	];

	for (const bonus of quickTestBonuses) {
		quickTests.push(() => {
			return testProbabilityBonus(
				bonus.name,
				bonus.value,
				config.iterations,
				config.tolerance,
			);
		});
	}

	const suite = runTestSuite("快速概率验证测试", quickTests);
	console.log(formatTestSuite(suite));

	// 输出快速测试建议
	const failedCount = suite.results.filter((r) => !r.success).length;
	if (failedCount > 0) {
		console.log(
			`\n⚠️  快速测试发现 ${failedCount} 个问题，建议运行完整的概率测试`,
		);
	} else {
		console.log(`\n✅ 快速概率验证通过，概率系统运行正常`);
	}
}

// 概率特效稳定性测试
export function testProbabilityStability(): void {
	console.log("\n🔄 开始概率特效稳定性测试...\n");

	const stabilityTests: (() => TestResult)[] = [];

	// 多次运行同一个概率测试，检查结果的稳定性
	const testBonus = "Double Tap";
	const testValue = 20;
	const testRuns = 5;
	const results: number[] = [];

	for (let i = 0; i < testRuns; i++) {
		stabilityTests.push(() => {
			const result = testProbabilityBonus(testBonus, testValue, 1000, 0.05);
			results.push(result.actualRate);

			return {
				...result,
				bonusName: `${testBonus} Run ${i + 1}`,
			};
		});
	}

	const suite = runTestSuite("概率稳定性测试", stabilityTests);
	console.log(formatTestSuite(suite));

	// 分析稳定性
	if (results.length === testRuns) {
		const mean = results.reduce((a, b) => a + b, 0) / results.length;
		const variance =
			results.reduce((acc, val) => acc + (val - mean) ** 2, 0) / results.length;
		const stdDev = Math.sqrt(variance);

		console.log(`\n📊 ${testBonus}(${testValue}%) 稳定性分析:`);
		console.log(`   平均触发率: ${(mean * 100).toFixed(2)}%`);
		console.log(`   标准差: ${(stdDev * 100).toFixed(2)}%`);
		console.log(`   变异系数: ${((stdDev / mean) * 100).toFixed(2)}%`);

		// 判断稳定性
		const isStable = stdDev < 0.02; // 标准差小于2%认为稳定
		console.log(`   稳定性评估: ${isStable ? "✅ 稳定" : "⚠️  不稳定"}`);
	}
}

// 特定特效深度测试
export function testSpecificBonusInDepth(
	bonusName: string,
	value: number,
): void {
	console.log(`\n🔬 开始 ${bonusName}(${value}%) 深度测试...\n`);

	const tests: (() => TestResult)[] = [];
	const iterations = [100, 500, 1000, 5000, 10000];

	// 测试不同迭代次数下的表现
	for (const iter of iterations) {
		tests.push(() => {
			const result = testProbabilityBonus(bonusName, value, iter, 0.05);
			return {
				...result,
				bonusName: `${bonusName} (${iter} iterations)`,
			};
		});
	}

	const suite = runTestSuite(`${bonusName} 深度测试`, tests);
	console.log(formatTestSuite(suite));

	// 分析收敛性
	const rates = suite.results
		.filter((r): r is TestResult & ProbabilityTestResult => "actualRate" in r)
		.map((r) => r.actualRate);

	if (rates.length === iterations.length) {
		console.log(`\n📈 ${bonusName} 收敛性分析:`);
		rates.forEach((rate, index) => {
			const iter = iterations[index];
			if (iter !== undefined) {
				const percent = (rate * 100).toFixed(2);
				const expected = value;
				const diff = Math.abs(rate * 100 - expected).toFixed(2);
				console.log(
					`   ${iter.toString().padStart(5)} 次: ${percent}% (偏差 ${diff}%)`,
				);
			}
		});
	}
}

// 主测试入口
export function runProbabilityBonusTests(): void {
	console.log("🚀 开始运行概率特效测试套件...\n");

	// 快速验证
	testQuickProbabilityValidation();

	// 完整概率测试
	testProbabilityBonuses();

	// 极端情况测试
	testExtremeProbabilities();

	// 稳定性测试
	testProbabilityStability();

	console.log("\n🏁 概率特效测试套件完成！");
}

// 单独测试特定特效的函数
export function runSpecificBonusTest(bonusName: string, value: number): void {
	testSpecificBonusInDepth(bonusName, value);
}

// 如果直接运行此文件
if (require.main === module) {
	// 可以通过命令行参数指定特定测试
	const args = process.argv.slice(2);
	if (args.length >= 2 && args[0] && args[1]) {
		const bonusName = args[0];
		const value = parseInt(args[1], 10);
		if (!Number.isNaN(value)) {
			runSpecificBonusTest(bonusName, value);
			process.exit(0);
		}
	}

	// 默认运行完整测试套件
	runProbabilityBonusTests();
}
