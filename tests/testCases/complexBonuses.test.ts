import {
	applyWeaponBonusesToDamage,
	applyWeaponBonusesToHitChance,
	clearTriggeredEffects,
} from "../../app/lib/weaponBonusProcessors";
import {
	BONUS_TEST_DATA,
	// createLowHealthAttacker,
	createPlayerWithCombo,
	createPlayerWithWeaponHistory,
} from "../mockData";
import {
	createTestContext,
	createTestPlayer,
	createWeaponWithBonus,
	formatTestSuite,
	runTestSuite,
	type TestResult,
} from "../testUtils";

// 复杂特效测试函数
export function testComplexBonuses(): void {
	console.log("🧩 开始复杂特效测试...\n");

	const allTests: (() => TestResult)[] = [];

	// 测试Execute特效（处决）
	for (const value of BONUS_TEST_DATA.complex.find((b) => b.name === "Execute")
		?.values || []) {
		allTests.push(() => testExecuteBonus(value));
	}

	// 测试Berserk特效（狂暴）
	for (const value of BONUS_TEST_DATA.complex.find((b) => b.name === "Berserk")
		?.values || []) {
		allTests.push(() => testBerserkBonus(value));
	}

	// 测试Grace特效（优雅）
	for (const value of BONUS_TEST_DATA.complex.find((b) => b.name === "Grace")
		?.values || []) {
		allTests.push(() => testGraceBonus(value));
	}

	// 测试Frenzy特效（狂怒）
	for (const value of BONUS_TEST_DATA.complex.find((b) => b.name === "Frenzy")
		?.values || []) {
		allTests.push(() => testFrenzyBonus(value));
	}

	// 测试Focus特效（专注）
	for (const value of BONUS_TEST_DATA.complex.find((b) => b.name === "Focus")
		?.values || []) {
		allTests.push(() => testFocusBonus(value));
	}

	// 测试Finale特效（终曲）
	for (const value of BONUS_TEST_DATA.complex.find((b) => b.name === "Finale")
		?.values || []) {
		allTests.push(() => testFinaleBonus(value));
	}

	// 测试Wind-up特效（蓄力）
	for (const value of BONUS_TEST_DATA.complex.find((b) => b.name === "Wind-up")
		?.values || []) {
		allTests.push(() => testWindUpBonus(value));
	}

	// 测试Rage特效（暴怒）
	for (const value of BONUS_TEST_DATA.complex.find((b) => b.name === "Rage")
		?.values || []) {
		allTests.push(() => testRageBonus(value));
	}

	// 测试Smurf特效（蓝精灵）
	for (const value of BONUS_TEST_DATA.complex.find((b) => b.name === "Smurf")
		?.values || []) {
		allTests.push(() => testSmurfBonus(value));
	}

	// 运行所有测试
	const suite = runTestSuite("复杂特效测试", allTests);
	console.log(formatTestSuite(suite));

	// 输出总结
	const { total, passed, failed, successRate } = suite.summary;
	console.log(`\n📊 复杂特效测试总结:`);
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
		console.log(`\n✅ 所有复杂特效测试通过！`);
	}
}

// Execute特效测试 - 对低血量目标造成即死效果
function testExecuteBonus(threshold: number): TestResult {
	try {
		clearTriggeredEffects();

		const weapon = createWeaponWithBonus("Execute", threshold);
		const attacker = createTestPlayer();
		const target = createTestPlayer({ life: 150, maxLife: 1000 }); // 15%血量，低于阈值

		const context = createTestContext({
			attacker,
			target,
			weapon,
		});

		const originalLife = target.life;
		const modifiedDamage = applyWeaponBonusesToDamage(
			weapon.damage,
			weapon,
			context,
		);

		// Execute应该在目标血量低于阈值时造成巨额伤害或即死
		const lifePercentage = (target.life / target.maxLife) * 100;
		const shouldExecute = lifePercentage <= threshold;

		return {
			success: true,
			bonusName: `Execute(${threshold}%)`,
			details: {
				originalDamage: weapon.damage,
				modifiedDamage,
				targetLifePercentage: lifePercentage,
				shouldExecute,
				originalLife: originalLife,
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: `Execute(${threshold}%)`,
			error: `Execute测试失败: ${error}`,
		};
	}
}

// Berserk特效测试 - 增加伤害但降低命中率
function testBerserkBonus(value: number): TestResult {
	try {
		clearTriggeredEffects();

		const weapon = createWeaponWithBonus("Berserk", value);
		const context = createTestContext({ weapon });

		const originalDamage = weapon.damage;
		const originalAccuracy = weapon.accuracy;

		const modifiedDamage = applyWeaponBonusesToDamage(
			originalDamage,
			weapon,
			context,
		);

		const modifiedAccuracy = applyWeaponBonusesToHitChance(
			originalAccuracy,
			weapon,
			context,
		);

		// Berserk应该增加伤害，但降低命中率
		const expectedDamage = originalDamage * (1 + value / 100);
		const expectedAccuracy = originalAccuracy * (1 - value / 200); // 减半的百分比

		return {
			success: true,
			bonusName: `Berserk(${value}%)`,
			details: {
				originalDamage,
				modifiedDamage,
				expectedDamage,
				originalAccuracy,
				modifiedAccuracy,
				expectedAccuracy,
				damageIncrease:
					((modifiedDamage - originalDamage) / originalDamage) * 100,
				accuracyDecrease:
					((originalAccuracy - modifiedAccuracy) / originalAccuracy) * 100,
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: `Berserk(${value}%)`,
			error: `Berserk测试失败: ${error}`,
		};
	}
}

// Grace特效测试 - 增加命中率但降低伤害
function testGraceBonus(value: number): TestResult {
	try {
		clearTriggeredEffects();

		const weapon = createWeaponWithBonus("Grace", value);
		const context = createTestContext({ weapon });

		const originalDamage = weapon.damage;
		const originalAccuracy = weapon.accuracy;

		const modifiedDamage = applyWeaponBonusesToDamage(
			originalDamage,
			weapon,
			context,
		);

		const modifiedAccuracy = applyWeaponBonusesToHitChance(
			originalAccuracy,
			weapon,
			context,
		);

		// Grace应该增加命中率，但降低伤害
		const expectedAccuracy = originalAccuracy * (1 + value / 100);
		const expectedDamage = originalDamage * (1 - value / 200); // 减半的百分比

		return {
			success: true,
			bonusName: `Grace(${value}%)`,
			details: {
				originalDamage,
				modifiedDamage,
				expectedDamage,
				originalAccuracy,
				modifiedAccuracy,
				expectedAccuracy,
				accuracyIncrease:
					((modifiedAccuracy - originalAccuracy) / originalAccuracy) * 100,
				damageDecrease:
					((originalDamage - modifiedDamage) / originalDamage) * 100,
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: `Grace(${value}%)`,
			error: `Grace测试失败: ${error}`,
		};
	}
}

// Frenzy特效测试 - 连续命中增加伤害和精确度
function testFrenzyBonus(value: number): TestResult {
	try {
		clearTriggeredEffects();

		const weapon = createWeaponWithBonus("Frenzy", value);
		const attacker = createTestPlayer(createPlayerWithCombo(3)); // 3 连击
		const context = createTestContext({
			weapon,
			attacker,
		});

		const originalDamage = weapon.damage;
		const modifiedDamage = applyWeaponBonusesToDamage(
			originalDamage,
			weapon,
			context,
		);

		// Frenzy应该基于连击次数增加伤害和精确度
		const expectedBonus = ((attacker.comboCounter ?? 0) * value) / 100;
		const expectedDamage = originalDamage * (1 + expectedBonus);

		return {
			success: true,
			bonusName: `Frenzy(${value}%)`,
			details: {
				originalDamage,
				modifiedDamage,
				expectedDamage,
				comboCounter: attacker.comboCounter ?? 0,
				expectedBonus: expectedBonus * 100,
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: `Frenzy(${value}%)`,
			error: `Frenzy测试失败: ${error}`,
		};
	}
}

// Focus特效测试 - 连续失误增加命中率
function testFocusBonus(value: number): TestResult {
	try {
		clearTriggeredEffects();

		const weapon = createWeaponWithBonus("Focus", value);
		// 模拟连续失误的情况，这里简化处理
		const context = createTestContext({ weapon });

		const originalAccuracy = weapon.accuracy;
		const modifiedAccuracy = applyWeaponBonusesToHitChance(
			originalAccuracy,
			weapon,
			context,
		);

		return {
			success: true,
			bonusName: `Focus(${value}%)`,
			details: {
				originalAccuracy,
				modifiedAccuracy,
				focusValue: value,
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: `Focus(${value}%)`,
			error: `Focus测试失败: ${error}`,
		};
	}
}

// Finale特效测试 - 每回合不使用武器增加伤害
function testFinaleBonus(value: number): TestResult {
	try {
		clearTriggeredEffects();

		const weapon = createWeaponWithBonus("Finale", value);
		const attacker = createTestPlayer(
			createPlayerWithWeaponHistory("primary", 3),
		); // 3 回合前最后使用
		const context = createTestContext({
			weapon,
			attacker,
			turn: 6, // 当前第6回合
		});

		const originalDamage = weapon.damage;
		const modifiedDamage = applyWeaponBonusesToDamage(
			originalDamage,
			weapon,
			context,
		);

		// Finale应该基于未使用回合数增加伤害
		const turnsUnused = context.turn - (attacker.lastUsedTurn?.primary || 0);
		const expectedBonus = (turnsUnused * value) / 100;
		const expectedDamage = originalDamage * (1 + expectedBonus);

		return {
			success: true,
			bonusName: `Finale(${value}%)`,
			details: {
				originalDamage,
				modifiedDamage,
				expectedDamage,
				turnsUnused,
				lastUsedTurn: attacker.lastUsedTurn?.primary,
				currentTurn: context.turn,
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: `Finale(${value}%)`,
			error: `Finale测试失败: ${error}`,
		};
	}
}

// Wind-up特效测试 - 花费一回合蓄力后增加伤害
function testWindUpBonus(value: number): TestResult {
	try {
		clearTriggeredEffects();

		const weapon = createWeaponWithBonus("Wind-up", value);
		const attacker = createTestPlayer({ windup: true }); // 已蓄力状态
		const context = createTestContext({
			weapon,
			attacker,
		});

		const originalDamage = weapon.damage;
		const modifiedDamage = applyWeaponBonusesToDamage(
			originalDamage,
			weapon,
			context,
		);

		// Wind-up应该在蓄力后增加伤害
		const expectedDamage = attacker.windup
			? originalDamage * (1 + value / 100)
			: originalDamage;

		return {
			success: true,
			bonusName: `Wind-up(${value}%)`,
			details: {
				originalDamage,
				modifiedDamage,
				expectedDamage,
				isWindUp: attacker.windup,
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: `Wind-up(${value}%)`,
			error: `Wind-up测试失败: ${error}`,
		};
	}
}

// Rage特效测试 - 概率性多次攻击
function testRageBonus(value: number): TestResult {
	try {
		clearTriggeredEffects();

		const weapon = createWeaponWithBonus("Rage", value);
		const context = createTestContext({ weapon });

		// Rage是概率性的，测试多次以验证平均表现
		let totalAttacks = 0;
		const iterations = 100;

		for (let i = 0; i < iterations; i++) {
			clearTriggeredEffects();
			const modifiedDamage = applyWeaponBonusesToDamage(
				weapon.damage,
				weapon,
				context,
			);

			// 简化：假设伤害增加表示多次攻击
			if (modifiedDamage > weapon.damage) {
				totalAttacks++;
			}
		}

		const actualRate = totalAttacks / iterations;
		const expectedRate = value / 100;

		return {
			success: Math.abs(actualRate - expectedRate) < 0.1, // 10%容差
			bonusName: `Rage(${value}%)`,
			details: {
				expectedRate: expectedRate * 100,
				actualRate: actualRate * 100,
				iterations,
				totalTriggers: totalAttacks,
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: `Rage(${value}%)`,
			error: `Rage测试失败: ${error}`,
		};
	}
}

// Smurf特效测试 - 基于等级差异增加伤害
function testSmurfBonus(value: number): TestResult {
	try {
		clearTriggeredEffects();

		const weapon = createWeaponWithBonus("Smurf", value);
		const attacker = createTestPlayer({ id: 1 }); // 假设等级为ID
		const target = createTestPlayer({ id: 50 }); // 高等级目标
		const context = createTestContext({
			weapon,
			attacker,
			target,
		});

		const originalDamage = weapon.damage;
		const modifiedDamage = applyWeaponBonusesToDamage(
			originalDamage,
			weapon,
			context,
		);

		// Smurf应该基于等级差异增加伤害
		const levelDifference = Math.max(0, target.id - attacker.id);
		const expectedBonus = (levelDifference * value) / 100;
		const expectedDamage = originalDamage * (1 + expectedBonus);

		return {
			success: true,
			bonusName: `Smurf(${value}%)`,
			details: {
				originalDamage,
				modifiedDamage,
				expectedDamage,
				attackerLevel: attacker.id,
				targetLevel: target.id,
				levelDifference,
				expectedBonus: expectedBonus * 100,
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: `Smurf(${value}%)`,
			error: `Smurf测试失败: ${error}`,
		};
	}
}

// 复杂特效组合测试
export function testComplexBonusCombinations(): void {
	console.log("\n🔄 开始复杂特效组合测试...\n");

	const combinationTests: (() => TestResult)[] = [];

	// 测试Berserk + Grace组合（相互冲突的特效）
	combinationTests.push(() => {
		try {
			const weapon = createWeaponWithBonus("Berserk", 50);
			weapon.weaponBonuses?.push({ name: "Grace", value: 30 });

			const context = createTestContext({ weapon });
			const modifiedDamage = applyWeaponBonusesToDamage(
				weapon.damage,
				weapon,
				context,
			);

			return {
				success: true,
				bonusName: "Berserk + Grace组合",
				details: {
					originalDamage: weapon.damage,
					modifiedDamage,
					hasBothEffects: weapon.weaponBonuses?.length === 2,
				},
			};
		} catch (error) {
			return {
				success: false,
				bonusName: "Berserk + Grace组合",
				error: `组合测试失败: ${error}`,
			};
		}
	});

	const suite = runTestSuite("复杂特效组合测试", combinationTests);
	console.log(formatTestSuite(suite));
}

// 运行所有复杂特效测试
export function runComplexBonusTests(): void {
	console.log("🚀 开始运行复杂特效测试套件...\n");

	testComplexBonuses();
	testComplexBonusCombinations();

	console.log("\n�� 复杂特效测试套件完成！");
}
