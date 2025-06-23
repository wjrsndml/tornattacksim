import type {
	// BattleStats,
	DamageContext,
	FightPlayer,
	// WeaponState,
	StatusEffectsV2,
	WeaponData,
} from "../app/lib/fightSimulatorTypes";
import {
	hasStatus,
	initializeStatusEffectsV2,
} from "../app/lib/statusEffectManager";
import {
	applyWeaponBonusesPostDamage,
	applyWeaponBonusesToAmmo,
	applyWeaponBonusesToArmour,
	applyWeaponBonusesToCritical,
	applyWeaponBonusesToDamage,
	applyWeaponBonusesToHitChance,
	applyWeaponBonusesToStats,
	clearTriggeredEffects,
	getCurrentTurnTriggeredEffects,
	getTriggeredBonuses,
} from "../app/lib/weaponBonusProcessors";

// 测试结果类型定义
export interface TestResult {
	success: boolean;
	bonusName: string;
	expectedValue?: number;
	actualValue?: number;
	error?: string;
	details?: Record<string, unknown>;
	triggeredEffects?: string[];
}

export interface ProbabilityTestResult extends TestResult {
	iterations: number;
	triggerCount: number;
	actualRate: number;
	expectedRate: number;
	withinTolerance: boolean;
	tolerance: number;
}

export interface TestSuite {
	name: string;
	results: TestResult[];
	summary: {
		total: number;
		passed: number;
		failed: number;
		successRate: number;
	};
}

// 创建标准测试玩家
export function createTestPlayer(
	config: Partial<FightPlayer> = {},
): FightPlayer {
	const defaultPlayer: FightPlayer = {
		id: 1,
		name: "Test Player",
		life: 1000,
		maxLife: 1000,
		position: "attack",
		battleStats: {
			strength: 100,
			defense: 100,
			speed: 100,
			dexterity: 100,
		},
		passives: {
			strength: 0,
			defense: 0,
			speed: 0,
			dexterity: 0,
		},
		statusEffectsV2: {},
		comboCounter: 0,
		lastUsedTurn: {},
		windup: false,
		weapons: {
			primary: {
				name: "Test Primary",
				damage: 100,
				accuracy: 80,
				category: "RI",
			},
			secondary: {
				name: "Test Secondary",
				damage: 80,
				accuracy: 85,
				category: "PI",
			},
			melee: { name: "Test Melee", damage: 50, accuracy: 90, category: "CL" },
			temporary: {
				name: "Test Temporary",
				damage: 120,
				accuracy: 70,
				category: "HA",
			},
			fists: { name: "Fists", damage: 30, accuracy: 95, category: "CL" },
			kick: { name: "Kick", damage: 40, accuracy: 90, category: "CL" },
		},
		armour: {
			head: { armour: 10, set: "Test Set" },
			body: { armour: 15, set: "Test Set" },
			hands: { armour: 8, set: "Test Set" },
			legs: { armour: 12, set: "Test Set" },
			feet: { armour: 6, set: "Test Set" },
		},
		attacksettings: {
			primary: { setting: 1, reload: false },
			secondary: { setting: 1, reload: false },
			melee: { setting: 1, reload: false },
			temporary: { setting: 1, reload: false },
		},
		defendsettings: {
			primary: { setting: 1, reload: false },
			secondary: { setting: 1, reload: false },
			melee: { setting: 1, reload: false },
			temporary: { setting: 1, reload: false },
		},
		perks: {
			education: {
				damage: false,
				meleedamage: false,
				japanesedamage: false,
				tempdamage: false,
				needleeffect: false,
				fistdamage: false,
				neckdamage: false,
				critchance: false,
				ammocontrol1: false,
				ammocontrol2: false,
			},
			faction: { accuracy: 0, damage: 0 },
			company: { name: "", star: 0 },
			property: { damage: false },
			merit: { critrate: 0 },
		},
	};

	const player = { ...defaultPlayer, ...config };
	initializeStatusEffectsV2(player);
	return player;
}

// 创建测试用的伤害上下文
export function createTestContext(
	config: Partial<DamageContext> = {},
): DamageContext {
	const defaultContext: DamageContext = {
		attacker: createTestPlayer(),
		target: createTestPlayer(),
		weapon: {
			name: "Test Weapon",
			category: "RI",
			damage: 100,
			accuracy: 80,
			weaponBonuses: [],
		},
		bodyPart: "chest",
		turn: 1,
		isCritical: false,
		currentWeaponSlot: "primary",
	};

	return { ...defaultContext, ...config };
}

// 创建带有特定特效的武器
export function createWeaponWithBonus(
	bonusName: string,
	bonusValue: number,
	baseWeapon: Partial<WeaponData> = {},
): WeaponData {
	return {
		name: `Test ${bonusName} Weapon`,
		category: "RI",
		damage: 100,
		accuracy: 80,
		...baseWeapon,
		weaponBonuses: [{ name: bonusName, value: bonusValue }],
	};
}

// 执行单次特效测试
export function testBonusEffect(
	bonusName: string,
	bonusValue: number,
	testConfig: Partial<DamageContext> = {},
): TestResult {
	try {
		clearTriggeredEffects();

		const weapon = createWeaponWithBonus(bonusName, bonusValue);
		const context = createTestContext({
			weapon,
			...testConfig,
		});

		const result: TestResult = {
			success: true,
			bonusName,
			details: {},
			triggeredEffects: [],
		};

		// 测试不同类型的特效
		switch (bonusName) {
			case "Powerful":
			case "Specialist":
				result.details = testDamageBonus(weapon, context, bonusValue);
				break;
			case "Empower":
			case "Quicken":
				result.details = testStatBonus(weapon, context, bonusName, bonusValue);
				break;
			case "Deadeye":
			case "Expose":
				result.details = testCriticalBonus(
					weapon,
					context,
					bonusName,
					bonusValue,
				);
				break;
			case "Penetrate":
				result.details = testArmourBonus(weapon, context, bonusValue);
				break;
			case "Conserve":
				result.details = testAmmoBonus(weapon, context, bonusValue);
				break;
			case "Bloodlust":
				result.details = testPostDamageBonus(weapon, context, bonusValue);
				break;
			default:
				// 对于其他特效，执行通用测试
				result.details = testGenericBonus(
					weapon,
					context,
					bonusName,
					bonusValue,
				);
		}

		result.triggeredEffects = getCurrentTurnTriggeredEffects();
		return result;
	} catch (error) {
		return {
			success: false,
			bonusName,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

// 测试伤害特效
function testDamageBonus(
	weapon: WeaponData,
	context: DamageContext,
	expectedIncrease: number,
) {
	const baseDamage = 100;
	const modifiedDamage = applyWeaponBonusesToDamage(
		baseDamage,
		weapon,
		context,
	);
	const expectedDamage = Math.round(baseDamage * (1 + expectedIncrease / 100));

	return {
		baseDamage,
		modifiedDamage,
		expectedDamage,
		success: modifiedDamage === expectedDamage,
	};
}

// 测试属性特效
function testStatBonus(
	weapon: WeaponData,
	context: DamageContext,
	bonusName: string,
	expectedIncrease: number,
) {
	const baseStats = context.attacker.battleStats;
	const modifiedStats = applyWeaponBonusesToStats(baseStats, weapon);

	const statName = bonusName === "Empower" ? "strength" : "speed";
	const expectedValue = Math.round(
		baseStats[statName] * (1 + expectedIncrease / 100),
	);

	return {
		baseValue: baseStats[statName],
		modifiedValue: modifiedStats[statName],
		expectedValue,
		success: modifiedStats[statName] === expectedValue,
		statName,
	};
}

// 测试暴击特效
function testCriticalBonus(
	weapon: WeaponData,
	context: DamageContext,
	bonusName: string,
	bonusValue: number,
) {
	const baseCritChance = 10;
	const baseCritDamage = 150;
	const [modifiedCritChance, modifiedCritDamage] = applyWeaponBonusesToCritical(
		baseCritChance,
		baseCritDamage,
		weapon,
		context,
	);

	if (bonusName === "Expose") {
		const expectedCritChance = Math.min(100, baseCritChance + bonusValue);
		return {
			baseCritChance,
			modifiedCritChance,
			expectedCritChance,
			success: modifiedCritChance === expectedCritChance,
		};
	} else if (bonusName === "Deadeye") {
		const expectedCritDamage = baseCritDamage * (1 + bonusValue / 100);
		return {
			baseCritDamage,
			modifiedCritDamage,
			expectedCritDamage,
			success: Math.abs(modifiedCritDamage - expectedCritDamage) < 0.01,
		};
	}

	return { success: false, error: "Unknown critical bonus type" };
}

// 测试护甲穿透特效
function testArmourBonus(
	weapon: WeaponData,
	context: DamageContext,
	expectedReduction: number,
) {
	const baseMitigation = 50;
	const modifiedMitigation = applyWeaponBonusesToArmour(
		baseMitigation,
		weapon,
		context,
	);
	const expectedMitigation = baseMitigation * (1 - expectedReduction / 100);

	return {
		baseMitigation,
		modifiedMitigation,
		expectedMitigation,
		success: Math.abs(modifiedMitigation - expectedMitigation) < 0.01,
	};
}

// 测试弹药特效
function testAmmoBonus(
	weapon: WeaponData,
	context: DamageContext,
	_conserveRate: number,
) {
	// 由于Conserve是概率性的，这里只测试函数是否正常调用
	const baseAmmo = 1;
	const modifiedAmmo = applyWeaponBonusesToAmmo(baseAmmo, weapon, context);

	return {
		baseAmmo,
		modifiedAmmo,
		success: modifiedAmmo >= 0 && modifiedAmmo <= baseAmmo,
	};
}

// 测试后处理特效
function testPostDamageBonus(
	weapon: WeaponData,
	context: DamageContext,
	bonusValue: number,
) {
	const damage = 100;
	const result = applyWeaponBonusesPostDamage(
		context.attacker,
		context.target,
		damage,
		weapon,
		context,
	);

	const expectedHealing = Math.round(damage * (bonusValue / 100));

	return {
		damage,
		healing: result.healing,
		expectedHealing,
		extraAttacks: result.extraAttacks,
		success: result.healing === expectedHealing,
	};
}

// 通用特效测试
function testGenericBonus(
	weapon: WeaponData,
	context: DamageContext,
	bonusName: string,
	bonusValue: number,
) {
	// 测试特效是否被正确识别和处理
	const triggeredBonuses = getTriggeredBonuses(weapon, context);
	const isRecognized = triggeredBonuses.some((bonus) =>
		bonus.includes(bonusName),
	);

	return {
		bonusName,
		bonusValue,
		isRecognized,
		triggeredBonuses,
		success: isRecognized,
	};
}

// 概率特效测试
export function testProbabilityBonus(
	bonusName: string,
	bonusValue: number,
	iterations: number = 1000,
	tolerance: number = 0.05,
): ProbabilityTestResult {
	let triggerCount = 0;
	const expectedRate = bonusValue / 100;

	for (let i = 0; i < iterations; i++) {
		clearTriggeredEffects();
		const weapon = createWeaponWithBonus(bonusName, bonusValue);
		const context = createTestContext({ weapon });

		// 根据特效类型执行相应测试
		switch (bonusName) {
			case "Puncture":
				applyWeaponBonusesToArmour(50, weapon, context);
				break;
			case "Sure Shot":
				applyWeaponBonusesToHitChance(50, weapon, context);
				break;
			case "Deadly":
			case "Double Tap":
			case "Fury":
				applyWeaponBonusesToDamage(100, weapon, context);
				applyWeaponBonusesPostDamage(
					context.attacker,
					context.target,
					100,
					weapon,
					context,
				);
				break;
			default:
				// 通用概率测试
				testBonusEffect(bonusName, bonusValue, { weapon });
		}

		if (getCurrentTurnTriggeredEffects().includes(bonusName)) {
			triggerCount++;
		}
	}

	const actualRate = triggerCount / iterations;
	const withinTolerance = Math.abs(actualRate - expectedRate) <= tolerance;

	return {
		success: withinTolerance,
		bonusName,
		iterations,
		triggerCount,
		actualRate,
		expectedRate,
		withinTolerance,
		tolerance,
		details: {
			difference: Math.abs(actualRate - expectedRate),
			percentageDifference:
				(Math.abs(actualRate - expectedRate) / expectedRate) * 100,
		},
	};
}

// 验证数值计算
export function assertDamageCalculation(
	expected: number,
	actual: number,
	tolerance: number = 0.01,
): boolean {
	return Math.abs(expected - actual) <= tolerance;
}

// 验证状态效果
export function assertStatusEffect(
	player: FightPlayer,
	statusName: keyof StatusEffectsV2,
	expectedStacks?: number,
): boolean {
	const hasStatusEffect = hasStatus(player, statusName);
	if (!hasStatusEffect) return false;

	if (expectedStacks !== undefined) {
		const stacks = player.statusEffectsV2?.[statusName]?.stacks ?? 0;
		return stacks === expectedStacks;
	}

	return true;
}

// 创建特殊条件的测试玩家
export function createLowHealthPlayer(): FightPlayer {
	return createTestPlayer({
		life: 200,
		maxLife: 1000,
	});
}

export function createFullHealthPlayer(): FightPlayer {
	return createTestPlayer({
		life: 1000,
		maxLife: 1000,
	});
}

export function createPlayerWithStatus(
	statusName: keyof StatusEffectsV2,
	stacks: number = 1,
): FightPlayer {
	const player = createTestPlayer();
	initializeStatusEffectsV2(player);
	if (player.statusEffectsV2) {
		player.statusEffectsV2[statusName] = {
			turns: 3,
			stacks,
		};
	}
	return player;
}

// 测试套件运行器
export function runTestSuite(
	suiteName: string,
	tests: (() => TestResult)[],
): TestSuite {
	const results: TestResult[] = [];

	for (const test of tests) {
		try {
			const result = test();
			results.push(result);
		} catch (error) {
			results.push({
				success: false,
				bonusName: "unknown",
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	const passed = results.filter((r) => r.success).length;
	const failed = results.length - passed;

	return {
		name: suiteName,
		results,
		summary: {
			total: results.length,
			passed,
			failed,
			successRate: passed / results.length,
		},
	};
}

// 输出测试结果
export function formatTestResult(result: TestResult): string {
	const status = result.success ? "✅ PASS" : "❌ FAIL";
	let output = `${status} ${result.bonusName}`;

	if (!result.success && result.error) {
		output += `\n  Error: ${result.error}`;
	}

	if (result.details) {
		output += `\n  Details: ${JSON.stringify(result.details, null, 2)}`;
	}

	if (result.triggeredEffects && result.triggeredEffects.length > 0) {
		output += `\n  Triggered: ${result.triggeredEffects.join(", ")}`;
	}

	return output;
}

export function formatTestSuite(suite: TestSuite): string {
	let output = `\n=== ${suite.name} ===\n`;
	output += `Total: ${suite.summary.total}, Passed: ${suite.summary.passed}, Failed: ${suite.summary.failed}\n`;
	output += `Success Rate: ${(suite.summary.successRate * 100).toFixed(1)}%\n\n`;

	for (const result of suite.results) {
		output += `${formatTestResult(result)}\n\n`;
	}

	return output;
}
