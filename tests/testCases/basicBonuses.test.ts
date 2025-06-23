import { BONUS_TEST_DATA, EXPECTED_RESULTS } from "../mockData";
import {
	formatTestSuite,
	runTestSuite,
	type TestResult,
	testBonusEffect,
} from "../testUtils";

// 基础特效测试函数
export function testBasicBonuses(): void {
	console.log("🧪 开始基础特效测试...\n");

	const allTests: (() => TestResult)[] = [];

	// 测试Powerful特效
	for (const value of BONUS_TEST_DATA.basic.find((b) => b.name === "Powerful")
		?.values || []) {
		allTests.push(() => {
			const result = testBonusEffect("Powerful", value);

			// 验证伤害计算
			if (result.success && result.details) {
				const expectedDamage = EXPECTED_RESULTS.powerfulDamage(100, value);
				if (result.details.modifiedDamage !== expectedDamage) {
					return {
						...result,
						success: false,
						error: `伤害计算错误: 期望 ${expectedDamage}, 实际 ${result.details.modifiedDamage}`,
					};
				}
			}

			return result;
		});
	}

	// 测试Empower特效
	for (const value of BONUS_TEST_DATA.basic.find((b) => b.name === "Empower")
		?.values || []) {
		allTests.push(() => {
			const result = testBonusEffect("Empower", value);

			// 验证力量计算
			if (result.success && result.details) {
				const expectedStrength = EXPECTED_RESULTS.empowerStrength(100, value);
				if (result.details.modifiedValue !== expectedStrength) {
					return {
						...result,
						success: false,
						error: `力量计算错误: 期望 ${expectedStrength}, 实际 ${result.details.modifiedValue}`,
					};
				}
			}

			return result;
		});
	}

	// 测试Quicken特效
	for (const value of BONUS_TEST_DATA.basic.find((b) => b.name === "Quicken")
		?.values || []) {
		allTests.push(() => {
			const result = testBonusEffect("Quicken", value);

			// 验证速度计算
			if (result.success && result.details) {
				const expectedSpeed = EXPECTED_RESULTS.empowerStrength(100, value); // 同样的计算公式
				if (result.details.modifiedValue !== expectedSpeed) {
					return {
						...result,
						success: false,
						error: `速度计算错误: 期望 ${expectedSpeed}, 实际 ${result.details.modifiedValue}`,
					};
				}
			}

			return result;
		});
	}

	// 测试Expose特效
	for (const value of BONUS_TEST_DATA.basic.find((b) => b.name === "Expose")
		?.values || []) {
		allTests.push(() => {
			const result = testBonusEffect("Expose", value);

			// 验证暴击率计算
			if (result.success && result.details) {
				const expectedCritChance = EXPECTED_RESULTS.exposeCritChance(10, value);
				if (result.details.modifiedCritChance !== expectedCritChance) {
					return {
						...result,
						success: false,
						error: `暴击率计算错误: 期望 ${expectedCritChance}, 实际 ${result.details.modifiedCritChance}`,
					};
				}
			}

			return result;
		});
	}

	// 测试Deadeye特效
	for (const value of BONUS_TEST_DATA.basic.find((b) => b.name === "Deadeye")
		?.values || []) {
		allTests.push(() => {
			const result = testBonusEffect("Deadeye", value, { isCritical: true });

			// 验证暴击伤害计算
			if (result.success && result.details) {
				const expectedCritDamage = 150 * (1 + value / 100);
				const actualCritDamage = result.details.modifiedCritDamage as number;
				if (Math.abs(actualCritDamage - expectedCritDamage) > 0.01) {
					return {
						...result,
						success: false,
						error: `暴击伤害计算错误: 期望 ${expectedCritDamage}, 实际 ${actualCritDamage}`,
					};
				}
			}

			return result;
		});
	}

	// 测试Penetrate特效
	for (const value of BONUS_TEST_DATA.basic.find((b) => b.name === "Penetrate")
		?.values || []) {
		allTests.push(() => {
			const result = testBonusEffect("Penetrate", value);

			// 验证护甲穿透计算
			if (result.success && result.details) {
				const expectedMitigation = EXPECTED_RESULTS.penetrateArmour(50, value);
				const actualMitigation = result.details.modifiedMitigation as number;
				if (Math.abs(actualMitigation - expectedMitigation) > 0.01) {
					return {
						...result,
						success: false,
						error: `护甲穿透计算错误: 期望 ${expectedMitigation}, 实际 ${actualMitigation}`,
					};
				}
			}

			return result;
		});
	}

	// 测试Bloodlust特效
	for (const value of BONUS_TEST_DATA.basic.find((b) => b.name === "Bloodlust")
		?.values || []) {
		allTests.push(() => {
			const result = testBonusEffect("Bloodlust", value);

			// 验证生命回复计算
			if (result.success && result.details) {
				const expectedHealing = EXPECTED_RESULTS.bloodlustHealing(100, value);
				if (result.details.healing !== expectedHealing) {
					return {
						...result,
						success: false,
						error: `生命回复计算错误: 期望 ${expectedHealing}, 实际 ${result.details.healing}`,
					};
				}
			}

			return result;
		});
	}

	// 测试Specialist特效
	for (const value of BONUS_TEST_DATA.basic.find((b) => b.name === "Specialist")
		?.values || []) {
		allTests.push(() => {
			const result = testBonusEffect("Specialist", value);

			// 验证伤害计算（与Powerful相同）
			if (result.success && result.details) {
				const expectedDamage = EXPECTED_RESULTS.powerfulDamage(100, value);
				if (result.details.modifiedDamage !== expectedDamage) {
					return {
						...result,
						success: false,
						error: `Specialist伤害计算错误: 期望 ${expectedDamage}, 实际 ${result.details.modifiedDamage}`,
					};
				}
			}

			return result;
		});
	}

	// 测试Conserve特效（弹药保存）
	for (const value of BONUS_TEST_DATA.basic.find((b) => b.name === "Conserve")
		?.values || []) {
		allTests.push(() => {
			const result = testBonusEffect("Conserve", value);

			// Conserve是概率性的，只验证返回值在合理范围内
			if (result.success && result.details) {
				const modifiedAmmo = result.details.modifiedAmmo as number;
				if (modifiedAmmo < 0 || modifiedAmmo > 1) {
					return {
						...result,
						success: false,
						error: `弹药消耗值超出范围: ${modifiedAmmo}`,
					};
				}
			}

			return result;
		});
	}

	// 运行所有测试
	const suite = runTestSuite("基础特效测试", allTests);
	console.log(formatTestSuite(suite));

	// 输出总结
	const { total, passed, failed, successRate } = suite.summary;
	console.log(`\n📊 基础特效测试总结:`);
	console.log(`   总计: ${total} 个测试`);
	console.log(`   通过: ${passed} 个`);
	console.log(`   失败: ${failed} 个`);
	console.log(`   成功率: ${(successRate * 100).toFixed(1)}%`);

	if (failed > 0) {
		console.log(`\n❌ 失败的测试:`);
		suite.results
			.filter((r) => !r.success)
			.forEach((r) => {
				console.log(`   - ${r.bonusName}: ${r.error || "未知错误"}`);
			});
	} else {
		console.log(`\n✅ 所有基础特效测试通过！`);
	}
}

// 边界值测试
export function testBasicBonusesBoundary(): void {
	console.log("\n🔍 开始基础特效边界值测试...\n");

	const boundaryTests: (() => TestResult)[] = [];

	// 测试0%值
	boundaryTests.push(() => testBonusEffect("Powerful", 0));
	boundaryTests.push(() => testBonusEffect("Empower", 0));
	boundaryTests.push(() => testBonusEffect("Expose", 0));

	// 测试极大值
	boundaryTests.push(() => testBonusEffect("Powerful", 999));
	boundaryTests.push(() => testBonusEffect("Penetrate", 100)); // 100%穿透

	// 测试负值（应该被处理或报错）
	boundaryTests.push(() => {
		try {
			return testBonusEffect("Powerful", -10);
		} catch (_error) {
			return {
				success: true, // 预期会出错
				bonusName: "Powerful",
				error: "负值测试 - 预期行为",
			};
		}
	});

	const suite = runTestSuite("基础特效边界值测试", boundaryTests);
	console.log(formatTestSuite(suite));
}

// 组合特效测试
export function testBasicBonusesCombination(): void {
	console.log("\n🔗 开始基础特效组合测试...\n");

	// 这里可以测试多个特效同时存在的情况
	// 由于当前testBonusEffect只支持单个特效，这部分暂时留空
	// 未来可以扩展支持多特效武器的测试

	console.log("组合特效测试功能待实现...");
}

// 主测试入口
export function runBasicBonusTests(): void {
	console.log("🚀 开始运行基础特效测试套件...\n");

	testBasicBonuses();
	testBasicBonusesBoundary();
	testBasicBonusesCombination();

	console.log("\n🏁 基础特效测试套件完成！");
}

// 如果直接运行此文件
if (require.main === module) {
	runBasicBonusTests();
}
