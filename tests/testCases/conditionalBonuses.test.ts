import type {
	DamageContext,
	FightPlayer,
} from "../../app/lib/fightSimulatorTypes";
import {
	applyWeaponBonusesToDamage,
	clearTriggeredEffects,
} from "../../app/lib/weaponBonusProcessors";
import {
	BONUS_TEST_DATA,
	createFullHealthTarget,
	createLowHealthAttacker,
	createStandardAttacker,
	createStandardTarget,
} from "../mockData";
import {
	createTestContext,
	createTestPlayer,
	createWeaponWithBonus,
	formatTestSuite,
	runTestSuite,
	type TestResult,
} from "../testUtils";

// 条件特效测试函数
export function testConditionalBonuses(): void {
	console.log("🎯 开始条件特效测试...\n");

	const allTests: (() => TestResult)[] = [];

	// 测试身体部位相关特效
	const bodyPartBonuses = BONUS_TEST_DATA.conditional.filter((b) => b.bodyPart);
	for (const bonusData of bodyPartBonuses) {
		for (const value of bonusData.values) {
			allTests.push(() =>
				testBodyPartBonus(bonusData.name, value, bonusData.bodyPart as string),
			);
		}
	}

	// 测试条件相关特效
	const conditionBonuses = BONUS_TEST_DATA.conditional.filter(
		(b) => b.condition,
	);
	for (const bonusData of conditionBonuses) {
		for (const value of bonusData.values) {
			allTests.push(() =>
				testConditionBonus(
					bonusData.name,
					value,
					bonusData.condition as string,
				),
			);
		}
	}

	// 运行所有测试
	const suite = runTestSuite("条件特效测试", allTests);
	console.log(formatTestSuite(suite));

	// 输出总结
	const { total, passed, failed, successRate } = suite.summary;
	console.log(`\n📊 条件特效测试总结:`);
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
		console.log(`\n✅ 所有条件特效测试通过！`);
	}
}

// 测试身体部位相关特效
function testBodyPartBonus(
	bonusName: string,
	value: number,
	bodyPart: string,
): TestResult {
	try {
		clearTriggeredEffects();

		const weapon = createWeaponWithBonus(bonusName, value);
		const attacker = createTestPlayer(createStandardAttacker());
		const target = createTestPlayer(createStandardTarget());

		// 测试正确的身体部位
		const correctPartContext = createTestContext({
			attacker,
			target,
			weapon,
			bodyPart,
		});

		// 测试错误的身体部位
		const wrongBodyPart = bodyPart === "head" ? "chest" : "head";
		const wrongPartContext = createTestContext({
			attacker,
			target,
			weapon,
			bodyPart: wrongBodyPart,
		});

		const originalDamage = weapon.damage;
		const correctPartDamage = applyWeaponBonusesToDamage(
			originalDamage,
			weapon,
			correctPartContext,
		);

		const wrongPartDamage = applyWeaponBonusesToDamage(
			originalDamage,
			weapon,
			wrongPartContext,
		);

		// 正确部位应该有加成，错误部位不应该有加成
		const hasCorrectBonus = correctPartDamage > originalDamage;
		const hasWrongBonus = wrongPartDamage > originalDamage;

		const expectedDamage = originalDamage * (1 + value / 100);
		const isCorrectCalculation =
			Math.abs(correctPartDamage - expectedDamage) < 0.01;

		return {
			success: hasCorrectBonus && !hasWrongBonus && isCorrectCalculation,
			bonusName: `${bonusName}(${value}%) - ${bodyPart}`,
			details: {
				originalDamage,
				correctPartDamage,
				wrongPartDamage,
				expectedDamage,
				targetBodyPart: bodyPart,
				wrongBodyPart,
				hasCorrectBonus,
				hasWrongBonus,
				isCorrectCalculation,
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: `${bonusName}(${value}%) - ${bodyPart}`,
			error: `身体部位特效测试失败: ${error}`,
		};
	}
}

// 测试条件相关特效
function testConditionBonus(
	bonusName: string,
	value: number,
	condition: string,
): TestResult {
	try {
		clearTriggeredEffects();

		const weapon = createWeaponWithBonus(bonusName, value);
		let attacker: FightPlayer;
		let target: FightPlayer;
		let context: DamageContext;

		switch (condition) {
			case "full_health":
				// Blindside - 目标满血时增加伤害
				attacker = createTestPlayer(createStandardAttacker());
				target = createTestPlayer(createFullHealthTarget());
				context = createTestContext({ attacker, target, weapon });
				break;

			case "low_health":
				// Comeback - 自己血量低时增加伤害
				attacker = createTestPlayer(createLowHealthAttacker());
				target = createTestPlayer(createStandardTarget());
				context = createTestContext({ attacker, target, weapon });
				break;

			case "first_turn":
				// Assassinate - 第一回合增加伤害
				attacker = createTestPlayer(createStandardAttacker());
				target = createTestPlayer(createStandardTarget());
				context = createTestContext({ attacker, target, weapon, turn: 1 });
				break;

			case "distracted":
				// Backstab - 目标分心时双倍伤害
				attacker = createTestPlayer(createStandardAttacker());
				target = createTestPlayer(createStandardTarget());
				// 这里简化处理，假设目标处于分心状态
				context = createTestContext({ attacker, target, weapon });
				break;

			default:
				throw new Error(`未知条件: ${condition}`);
		}

		const originalDamage = weapon.damage;
		const modifiedDamage = applyWeaponBonusesToDamage(
			originalDamage,
			weapon,
			context,
		);

		// 计算期望伤害
		let expectedDamage = originalDamage;
		let shouldTrigger = false;

		switch (condition) {
			case "full_health":
				shouldTrigger = target.life === target.maxLife;
				expectedDamage = shouldTrigger
					? originalDamage * (1 + value / 100)
					: originalDamage;
				break;

			case "low_health":
				shouldTrigger = attacker.life / attacker.maxLife <= 0.25; // 25%血量以下
				expectedDamage = shouldTrigger
					? originalDamage * (1 + value / 100)
					: originalDamage;
				break;

			case "first_turn":
				shouldTrigger = context.turn === 1;
				expectedDamage = shouldTrigger
					? originalDamage * (1 + value / 100)
					: originalDamage;
				break;

			case "distracted":
				// Backstab特殊处理 - 双倍伤害
				shouldTrigger = true; // 简化假设目标分心
				expectedDamage = shouldTrigger ? originalDamage * 2 : originalDamage;
				break;
		}

		const isCorrectCalculation =
			Math.abs(modifiedDamage - expectedDamage) < 0.01;

		return {
			success: isCorrectCalculation,
			bonusName: `${bonusName}(${value}%) - ${condition}`,
			details: {
				originalDamage,
				modifiedDamage,
				expectedDamage,
				condition,
				shouldTrigger,
				isCorrectCalculation,
				conditionMet: shouldTrigger,
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: `${bonusName}(${value}%) - ${condition}`,
			error: `条件特效测试失败: ${error}`,
		};
	}
}

// 特殊身体部位特效详细测试
export function testSpecialBodyPartBonuses(): void {
	console.log("\n🎯 开始特殊身体部位特效详细测试...\n");

	const specialTests: (() => TestResult)[] = [];

	// 测试所有身体部位的Crusher特效
	const bodyParts = [
		"head",
		"chest",
		"left arm",
		"right arm",
		"left leg",
		"right leg",
	];
	for (const bodyPart of bodyParts) {
		specialTests.push(() => {
			try {
				const weapon = createWeaponWithBonus("Crusher", 100); // 100%增加头部伤害
				const context = createTestContext({ weapon, bodyPart });

				const originalDamage = weapon.damage;
				const modifiedDamage = applyWeaponBonusesToDamage(
					originalDamage,
					weapon,
					context,
				);

				const shouldBonus = bodyPart === "head";
				const expectedDamage = shouldBonus
					? originalDamage * 2
					: originalDamage;

				return {
					success: Math.abs(modifiedDamage - expectedDamage) < 0.01,
					bonusName: `Crusher - ${bodyPart}`,
					details: {
						bodyPart,
						originalDamage,
						modifiedDamage,
						expectedDamage,
						shouldHaveBonus: shouldBonus,
					},
				};
			} catch (error) {
				return {
					success: false,
					bonusName: `Crusher - ${bodyPart}`,
					error: `特殊身体部位测试失败: ${error}`,
				};
			}
		});
	}

	const suite = runTestSuite("特殊身体部位特效测试", specialTests);
	console.log(formatTestSuite(suite));
}

// 血量条件特效详细测试
export function testHealthConditionBonuses(): void {
	console.log("\n❤️ 开始血量条件特效详细测试...\n");

	const healthTests: (() => TestResult)[] = [];

	// 测试不同血量百分比下的Comeback特效
	const healthPercentages = [100, 75, 50, 25, 10];
	for (const healthPercent of healthPercentages) {
		healthTests.push(() => {
			try {
				const weapon = createWeaponWithBonus("Comeback", 100); // 100%伤害增加
				const attacker = createTestPlayer({
					...createStandardAttacker(),
					life: (healthPercent / 100) * 1000, // 基于百分比设置生命值
					maxLife: 1000,
				});

				const context = createTestContext({ weapon, attacker });

				const originalDamage = weapon.damage;
				const modifiedDamage = applyWeaponBonusesToDamage(
					originalDamage,
					weapon,
					context,
				);

				const shouldTrigger = healthPercent <= 25; // 25%以下触发
				const expectedDamage = shouldTrigger
					? originalDamage * 2
					: originalDamage;

				return {
					success: Math.abs(modifiedDamage - expectedDamage) < 0.01,
					bonusName: `Comeback - ${healthPercent}%血量`,
					details: {
						healthPercent,
						originalDamage,
						modifiedDamage,
						expectedDamage,
						shouldTrigger,
						actualLifeRatio: attacker.life / attacker.maxLife,
					},
				};
			} catch (error) {
				return {
					success: false,
					bonusName: `Comeback - ${healthPercent}%血量`,
					error: `血量条件测试失败: ${error}`,
				};
			}
		});
	}

	// 测试不同血量百分比下的Blindside特效
	for (const healthPercent of healthPercentages) {
		healthTests.push(() => {
			try {
				const weapon = createWeaponWithBonus("Blindside", 100); // 100%伤害增加
				const target = createTestPlayer({
					...createStandardTarget(),
					life: (healthPercent / 100) * 1000,
					maxLife: 1000,
				});

				const context = createTestContext({ weapon, target });

				const originalDamage = weapon.damage;
				const modifiedDamage = applyWeaponBonusesToDamage(
					originalDamage,
					weapon,
					context,
				);

				const shouldTrigger = healthPercent === 100; // 满血时触发
				const expectedDamage = shouldTrigger
					? originalDamage * 2
					: originalDamage;

				return {
					success: Math.abs(modifiedDamage - expectedDamage) < 0.01,
					bonusName: `Blindside - 目标${healthPercent}%血量`,
					details: {
						targetHealthPercent: healthPercent,
						originalDamage,
						modifiedDamage,
						expectedDamage,
						shouldTrigger,
						actualLifeRatio: target.life / target.maxLife,
					},
				};
			} catch (error) {
				return {
					success: false,
					bonusName: `Blindside - 目标${healthPercent}%血量`,
					error: `目标血量条件测试失败: ${error}`,
				};
			}
		});
	}

	const suite = runTestSuite("血量条件特效测试", healthTests);
	console.log(formatTestSuite(suite));
}

// 回合条件特效测试
export function testTurnConditionBonuses(): void {
	console.log("\n🕐 开始回合条件特效测试...\n");

	const turnTests: (() => TestResult)[] = [];

	// 测试Assassinate在不同回合的表现
	const turns = [1, 2, 3, 5, 10];
	for (const turn of turns) {
		turnTests.push(() => {
			try {
				const weapon = createWeaponWithBonus("Assassinate", 100); // 100%伤害增加
				const context = createTestContext({ weapon, turn });

				const originalDamage = weapon.damage;
				const modifiedDamage = applyWeaponBonusesToDamage(
					originalDamage,
					weapon,
					context,
				);

				const shouldTrigger = turn === 1; // 仅第一回合触发
				const expectedDamage = shouldTrigger
					? originalDamage * 2
					: originalDamage;

				return {
					success: Math.abs(modifiedDamage - expectedDamage) < 0.01,
					bonusName: `Assassinate - 第${turn}回合`,
					details: {
						turn,
						originalDamage,
						modifiedDamage,
						expectedDamage,
						shouldTrigger,
					},
				};
			} catch (error) {
				return {
					success: false,
					bonusName: `Assassinate - 第${turn}回合`,
					error: `回合条件测试失败: ${error}`,
				};
			}
		});
	}

	const suite = runTestSuite("回合条件特效测试", turnTests);
	console.log(formatTestSuite(suite));
}

// 条件特效组合测试
export function testConditionalBonusCombinations(): void {
	console.log("\n🔗 开始条件特效组合测试...\n");

	const combinationTests: (() => TestResult)[] = [];

	// 测试满足多个条件的情况
	combinationTests.push(() => {
		try {
			const weapon = createWeaponWithBonus("Crusher", 50); // 头部+50%
			weapon.weaponBonuses?.push({ name: "Assassinate", value: 60 }); // 第一回合+60%

			const context = createTestContext({
				weapon,
				bodyPart: "head", // 满足Crusher条件
				turn: 1, // 满足Assassinate条件
			});

			const originalDamage = weapon.damage;
			const modifiedDamage = applyWeaponBonusesToDamage(
				originalDamage,
				weapon,
				context,
			);

			// 两个效果应该叠加
			const expectedDamage = originalDamage * 1.5 * 1.6; // +50% * +60%

			return {
				success: Math.abs(modifiedDamage - expectedDamage) < 0.01,
				bonusName: "Crusher + Assassinate组合",
				details: {
					originalDamage,
					modifiedDamage,
					expectedDamage,
					bodyPart: "head",
					turn: 1,
					bothConditionsMet: true,
				},
			};
		} catch (error) {
			return {
				success: false,
				bonusName: "Crusher + Assassinate组合",
				error: `条件组合测试失败: ${error}`,
			};
		}
	});

	const suite = runTestSuite("条件特效组合测试", combinationTests);
	console.log(formatTestSuite(suite));
}

// 运行所有条件特效测试
export function runConditionalBonusTests(): void {
	console.log("🚀 开始运行条件特效测试套件...\n");

	testConditionalBonuses();
	testSpecialBodyPartBonuses();
	testHealthConditionBonuses();
	testTurnConditionBonuses();
	testConditionalBonusCombinations();

	console.log("\n�� 条件特效测试套件完成！");
}
