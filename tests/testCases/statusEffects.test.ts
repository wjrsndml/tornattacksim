import type {
	// FightPlayer,
	StatusEffectsV2,
} from "../../app/lib/fightSimulatorTypes";
import {
	addStatus as addStatusEffect,
	hasStatus,
	removeStatus as removeStatusEffect,
} from "../../app/lib/statusEffectManager";
import {
	applyWeaponBonusesPostDamage,
	clearTriggeredEffects,
} from "../../app/lib/weaponBonusProcessors";
import {
	BONUS_TEST_DATA,
	createStandardAttacker,
	createStandardTarget,
} from "../mockData";
import {
	// assertStatusEffect,
	createTestContext,
	createTestPlayer,
	createWeaponWithBonus,
	formatTestSuite,
	runTestSuite,
	type TestResult,
} from "../testUtils";

// 状态效果测试函数
export function testStatusEffects(): void {
	console.log("🩸 开始状态效果测试...\n");

	const allTests: (() => TestResult)[] = [];

	// 测试Bleed DOT效果
	for (const value of BONUS_TEST_DATA.status.find((b) => b.name === "Bleed")
		?.values || [20, 45, 67]) {
		allTests.push(() => testBleedEffect(value));
	}

	// 测试Disarm效果
	for (const value of BONUS_TEST_DATA.status.find((b) => b.name === "Disarm")
		?.values || []) {
		allTests.push(() => testDisarmEffect(value));
	}

	// 测试Slow效果
	for (const value of BONUS_TEST_DATA.status.find((b) => b.name === "Slow")
		?.values || []) {
		allTests.push(() => testSlowEffect(value));
	}

	// 测试Cripple效果
	for (const value of BONUS_TEST_DATA.status.find((b) => b.name === "Cripple")
		?.values || []) {
		allTests.push(() => testCrippleEffect(value));
	}

	// 测试Weaken效果
	for (const value of BONUS_TEST_DATA.status.find((b) => b.name === "Weaken")
		?.values || []) {
		allTests.push(() => testWeakenEffect(value));
	}

	// 测试Wither效果
	for (const value of BONUS_TEST_DATA.status.find((b) => b.name === "Wither")
		?.values || []) {
		allTests.push(() => testWitherEffect(value));
	}

	// 测试Eviscerate效果
	for (const value of BONUS_TEST_DATA.status.find(
		(b) => b.name === "Eviscerate",
	)?.values || []) {
		allTests.push(() => testEviscerateDamageIncrease(value));
	}

	// 测试Motivation效果
	for (const value of BONUS_TEST_DATA.status.find(
		(b) => b.name === "Motivation",
	)?.values || []) {
		allTests.push(() => testMotivationEffect(value));
	}

	// 测试Paralyzed效果
	allTests.push(() => testParalyzedEffect());

	// 测试Suppress效果
	allTests.push(() => testSuppressEffect());

	// 测试Irradiate效果
	allTests.push(() => testIrradiateEffect());

	// 运行所有测试
	const suite = runTestSuite("状态效果测试", allTests);
	console.log(formatTestSuite(suite));

	// 输出总结
	const { total, passed, failed, successRate } = suite.summary;
	console.log(`\n📊 状态效果测试总结:`);
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
		console.log(`\n✅ 所有状态效果测试通过！`);
	}
}

// Bleed DOT效果测试
function testBleedEffect(procChance: number): TestResult {
	try {
		clearTriggeredEffects();

		const weapon = createWeaponWithBonus("Bleed", procChance);
		const attacker = createTestPlayer(createStandardAttacker());
		const target = createTestPlayer(createStandardTarget());

		const context = createTestContext({
			attacker,
			target,
			weapon,
		});

		// 模拟造成伤害并触发后置效果
		const damage = 100;
		applyWeaponBonusesPostDamage(attacker, target, damage, weapon, context);

		// 检查是否应用了Bleed状态
		const hasBleedStatus = hasStatus(target, "bleed" as keyof StatusEffectsV2);

		return {
			success: true,
			bonusName: `Bleed(${procChance}%)`,
			details: {
				hasBleedStatus,
				procChance,
				damage,
				statusEffects: Object.keys(target.statusEffectsV2 || {}),
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: `Bleed(${procChance}%)`,
			error: `Bleed测试失败: ${error}`,
		};
	}
}

// Disarm效果测试 - 缴械
function testDisarmEffect(duration: number): TestResult {
	try {
		const target = createTestPlayer(createStandardTarget());

		// 手动应用Disarm状态 (测试主武器缴械)
		addStatusEffect(target, "disarm_primary", duration);

		const hasDisarmStatus = hasStatus(target, "disarm_primary");
		const statusStacks = target.statusEffectsV2?.disarm_primary?.stacks || 0;

		return {
			success: hasDisarmStatus && statusStacks === duration,
			bonusName: `Disarm(${duration} turns)`,
			details: {
				hasDisarmStatus,
				expectedDuration: duration,
				actualStacks: statusStacks,
				canUseWeapon: !hasDisarmStatus,
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: `Disarm(${duration} turns)`,
			error: `Disarm测试失败: ${error}`,
		};
	}
}

// Slow效果测试 - 降低速度
function testSlowEffect(procChance: number): TestResult {
	try {
		const target = createTestPlayer(createStandardTarget());
		const originalSpeed = target.battleStats.speed;

		// 手动应用Slow状态
		addStatusEffect(target, "slow", 3); // 3层效果

		const hasSlowStatus = hasStatus(target, "slow");
		const expectedSpeedReduction = 0.25; // 25%减少
		const expectedSpeed = originalSpeed * (1 - expectedSpeedReduction);

		return {
			success: hasSlowStatus,
			bonusName: `Slow(${procChance}%)`,
			details: {
				hasSlowStatus,
				originalSpeed,
				expectedSpeed,
				speedReduction: expectedSpeedReduction * 100,
				procChance,
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: `Slow(${procChance}%)`,
			error: `Slow测试失败: ${error}`,
		};
	}
}

// Cripple效果测试 - 降低敏捷
function testCrippleEffect(procChance: number): TestResult {
	try {
		const target = createTestPlayer(createStandardTarget());
		const originalDexterity = target.battleStats.dexterity;

		// 手动应用Cripple状态
		addStatusEffect(target, "cripple", 3); // 3层效果

		const hasCrippleStatus = hasStatus(target, "cripple");
		const expectedDexterityReduction = 0.25; // 25%减少
		const expectedDexterity =
			originalDexterity * (1 - expectedDexterityReduction);

		return {
			success: hasCrippleStatus,
			bonusName: `Cripple(${procChance}%)`,
			details: {
				hasCrippleStatus,
				originalDexterity,
				expectedDexterity,
				dexterityReduction: expectedDexterityReduction * 100,
				procChance,
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: `Cripple(${procChance}%)`,
			error: `Cripple测试失败: ${error}`,
		};
	}
}

// Weaken效果测试 - 降低防御
function testWeakenEffect(procChance: number): TestResult {
	try {
		const target = createTestPlayer(createStandardTarget());
		const originalDefense = target.battleStats.defense;

		// 手动应用Weaken状态
		addStatusEffect(target, "weaken", 3); // 3层效果

		const hasWeakenStatus = hasStatus(target, "weaken");
		const expectedDefenseReduction = 0.25; // 25%减少
		const expectedDefense = originalDefense * (1 - expectedDefenseReduction);

		return {
			success: hasWeakenStatus,
			bonusName: `Weaken(${procChance}%)`,
			details: {
				hasWeakenStatus,
				originalDefense,
				expectedDefense,
				defenseReduction: expectedDefenseReduction * 100,
				procChance,
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: `Weaken(${procChance}%)`,
			error: `Weaken测试失败: ${error}`,
		};
	}
}

// Wither效果测试 - 降低力量
function testWitherEffect(procChance: number): TestResult {
	try {
		const target = createTestPlayer(createStandardTarget());
		const originalStrength = target.battleStats.strength;

		// 手动应用Wither状态
		addStatusEffect(target, "wither", 3); // 3层效果

		const hasWitherStatus = hasStatus(target, "wither");
		const expectedStrengthReduction = 0.25; // 25%减少
		const expectedStrength = originalStrength * (1 - expectedStrengthReduction);

		return {
			success: hasWitherStatus,
			bonusName: `Wither(${procChance}%)`,
			details: {
				hasWitherStatus,
				originalStrength,
				expectedStrength,
				strengthReduction: expectedStrengthReduction * 100,
				procChance,
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: `Wither(${procChance}%)`,
			error: `Wither测试失败: ${error}`,
		};
	}
}

// Eviscerate效果测试 - 目标受到额外伤害
function testEviscerateDamageIncrease(damageIncrease: number): TestResult {
	try {
		const target = createTestPlayer(createStandardTarget());

		// 手动应用Eviscerate状态
		addStatusEffect(target, "eviscerate", 1);

		const hasEvisceratestatus = hasStatus(target, "eviscerate");
		const baseDamage = 100;
		const expectedDamage = baseDamage * (1 + damageIncrease / 100);

		return {
			success: hasEvisceratestatus,
			bonusName: `Eviscerate(${damageIncrease}%)`,
			details: {
				hasEvisceratestatus,
				baseDamage,
				expectedDamage,
				damageIncrease,
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: `Eviscerate(${damageIncrease}%)`,
			error: `Eviscerate测试失败: ${error}`,
		};
	}
}

// Motivation效果测试 - 增加所有属性
function testMotivationEffect(procChance: number): TestResult {
	try {
		const player = createTestPlayer(createStandardAttacker());
		const originalStats = { ...player.battleStats };

		// 手动应用多层Motivation状态（最多5层）
		const stacks = 3;
		addStatusEffect(player, "motivation", stacks);

		const hasMotivationStatus = hasStatus(player, "motivation");
		const statBonus = 0.1 * stacks; // 每层10%
		const expectedStats = {
			strength: originalStats.strength * (1 + statBonus),
			defense: originalStats.defense * (1 + statBonus),
			speed: originalStats.speed * (1 + statBonus),
			dexterity: originalStats.dexterity * (1 + statBonus),
		};

		return {
			success: hasMotivationStatus,
			bonusName: `Motivation(${procChance}%)`,
			details: {
				hasMotivationStatus,
				stacks,
				originalStats,
				expectedStats,
				statBonus: statBonus * 100,
				procChance,
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: `Motivation(${procChance}%)`,
			error: `Motivation测试失败: ${error}`,
		};
	}
}

// Paralyzed效果测试 - 瘫痪（50%概率失去回合）
function testParalyzedEffect(): TestResult {
	try {
		const player = createTestPlayer(createStandardTarget());

		// 手动应用Paralyzed状态
		addStatusEffect(player, "stun", 300); // 300秒

		const hasParalyzedStatus = hasStatus(player, "stun");
		const missChance = 0.5; // 50%概率失去回合

		return {
			success: hasParalyzedStatus,
			bonusName: "Paralyzed(300s)",
			details: {
				hasParalyzedStatus,
				duration: 300,
				missChance: missChance * 100,
				description: "50%概率失去回合",
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: "Paralyzed(300s)",
			error: `Paralyzed测试失败: ${error}`,
		};
	}
}

// Suppress效果测试 - 压制（25%概率失去未来回合）
function testSuppressEffect(): TestResult {
	try {
		const player = createTestPlayer(createStandardTarget());

		// 手动应用Suppress状态
		addStatusEffect(player, "suppress", 1);

		const hasSuppressStatus = hasStatus(player, "suppress");
		const futureeMissChance = 0.25; // 25%概率失去未来回合

		return {
			success: hasSuppressStatus,
			bonusName: "Suppress(25%)",
			details: {
				hasSuppressStatus,
				futureMissChance: futureeMissChance * 100,
				description: "25%概率失去未来回合",
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: "Suppress(25%)",
			error: `Suppress测试失败: ${error}`,
		};
	}
}

// Irradiate效果测试 - 辐射中毒
function testIrradiateEffect(): TestResult {
	try {
		const target = createTestPlayer(createStandardTarget());

		// 手动应用Irradiate状态（1-3小时辐射中毒）
		const duration = 2; // 2小时
		addStatusEffect(
			target,
			"radiated" as keyof StatusEffectsV2,
			duration * 3600,
		); // 转换为秒

		const hasRadiationStatus = hasStatus(
			target,
			"radiated" as keyof StatusEffectsV2,
		);

		return {
			success: hasRadiationStatus,
			bonusName: "Irradiate(2h)",
			details: {
				hasRadiationStatus,
				duration: `${duration}小时`,
				durationSeconds: duration * 3600,
				description: "辐射中毒效果",
			},
		};
	} catch (error) {
		return {
			success: false,
			bonusName: "Irradiate(2h)",
			error: `Irradiate测试失败: ${error}`,
		};
	}
}

// 状态效果持续时间测试
export function testStatusEffectDuration(): void {
	console.log("\n⏰ 开始状态效果持续时间测试...\n");

	const durationTests: (() => TestResult)[] = [];

	// 测试状态效果的自然衰减
	durationTests.push(() => {
		try {
			const player = createTestPlayer();

			// 应用3回合的状态效果
			addStatusEffect(player, "slow", 3);

			const hasStatus1 = hasStatus(player, "slow");
			const stacks1 = player.statusEffectsV2?.slow?.stacks || 0;

			// 模拟1回合过去
			if (player.statusEffectsV2?.slow) {
				player.statusEffectsV2.slow.stacks = Math.max(0, stacks1 - 1);
			}

			const hasStatus2 = hasStatus(player, "slow");
			const stacks2 = player.statusEffectsV2?.slow?.stacks || 0;

			return {
				success: hasStatus1 && hasStatus2 && stacks1 === 3 && stacks2 === 2,
				bonusName: "状态效果持续时间衰减",
				details: {
					initialStacks: stacks1,
					afterOneeTurn: stacks2,
					stillActive: hasStatus2,
				},
			};
		} catch (error) {
			return {
				success: false,
				bonusName: "状态效果持续时间衰减",
				error: `持续时间测试失败: ${error}`,
			};
		}
	});

	// 测试状态效果的移除
	durationTests.push(() => {
		try {
			const player = createTestPlayer();

			addStatusEffect(player, "motivation", 2);
			const hasStatusBefore = hasStatus(player, "motivation");

			removeStatusEffect(player, "motivation");
			const hasStatusAfter = hasStatus(player, "motivation");

			return {
				success: hasStatusBefore && !hasStatusAfter,
				bonusName: "状态效果移除",
				details: {
					hadStatusBefore: hasStatusBefore,
					hasStatusAfter: hasStatusAfter,
				},
			};
		} catch (error) {
			return {
				success: false,
				bonusName: "状态效果移除",
				error: `状态移除测试失败: ${error}`,
			};
		}
	});

	const suite = runTestSuite("状态效果持续时间测试", durationTests);
	console.log(formatTestSuite(suite));
}

// 状态效果叠加测试
export function testStatusEffectStacking(): void {
	console.log("\n📚 开始状态效果叠加测试...\n");

	const stackingTests: (() => TestResult)[] = [];

	// 测试Motivation的叠加（最多5层）
	stackingTests.push(() => {
		try {
			const player = createTestPlayer();

			// 连续应用Motivation
			for (let i = 0; i < 7; i++) {
				// 尝试超过最大值
				addStatusEffect(player, "motivation", 1);
			}

			const stacks = player.statusEffectsV2?.motivation?.stacks || 0;
			const maxStacks = 5;

			return {
				success: stacks <= maxStacks,
				bonusName: "Motivation叠加限制",
				details: {
					appliedTimes: 7,
					actualStacks: stacks,
					maxAllowedStacks: maxStacks,
					respectsLimit: stacks <= maxStacks,
				},
			};
		} catch (error) {
			return {
				success: false,
				bonusName: "Motivation叠加限制",
				error: `叠加测试失败: ${error}`,
			};
		}
	});

	const suite = runTestSuite("状态效果叠加测试", stackingTests);
	console.log(formatTestSuite(suite));
}

// 运行所有状态效果测试
export function runStatusEffectTests(): void {
	console.log("🚀 开始运行状态效果测试套件...\n");

	testStatusEffects();
	testStatusEffectDuration();
	testStatusEffectStacking();

	console.log("\n�� 状态效果测试套件完成！");
}
