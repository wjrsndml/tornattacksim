import type {
	FightPlayer,
	// DamageContext,
	// WeaponData,
	// StatusEffectsV2,
} from "../app/lib/fightSimulatorTypes";

// 身体部位列表
export const BODY_PARTS = [
	"head",
	"left hand",
	"right hand",
	"left arm",
	"right arm",
	"chest",
	"stomach",
	"left leg",
	"right leg",
	"left foot",
	"right foot",
	"throat",
	"heart",
	"groin",
];

// 武器类别列表
export const WEAPON_CATEGORIES = [
	"CL", // Clubbing
	"HA", // Heavy Artillery
	"MG", // Machine Gun
	"MK", // Mechanical
	"PI", // Piercing
	"PS", // Pistol
	"RF", // Rifle
	"SG", // Shotgun
	"SL", // Slashing
	"SM", // Sub Machine Gun
];

// 基础武器模板
export const BASE_WEAPONS = {
	rifle: {
		name: "Test Rifle",
		category: "RF" as const,
		damage: 100,
		accuracy: 80,
		clipsize: 30,
		rateoffire: [1, 3] as [number, number],
	},
	pistol: {
		name: "Test Pistol",
		category: "PI" as const,
		damage: 60,
		accuracy: 85,
		clipsize: 15,
		rateoffire: [1, 2] as [number, number],
	},
	melee: {
		name: "Test Melee",
		category: "CL" as const,
		damage: 80,
		accuracy: 90,
	},
	temporary: {
		name: "Test Temporary",
		category: "HA" as const,
		damage: 150,
		accuracy: 70,
	},
};

// 特效测试数据
export const BONUS_TEST_DATA = {
	// 基础特效
	basic: [
		{ name: "Powerful", values: [5, 10, 25, 50] },
		{ name: "Empower", values: [10, 20, 30] },
		{ name: "Quicken", values: [10, 20, 30] },
		{ name: "Deadeye", values: [25, 50, 75] },
		{ name: "Expose", values: [5, 10, 15] },
		{ name: "Conserve", values: [10, 25, 50] },
		{ name: "Specialist", values: [15, 30, 45] },
		{ name: "Penetrate", values: [20, 40, 60] },
		{ name: "Bloodlust", values: [5, 10, 20] },
	],
	// 概率特效
	probability: [
		{ name: "Puncture", values: [10, 25, 50] },
		{ name: "Sure Shot", values: [15, 30, 45] },
		{ name: "Deadly", values: [5, 10, 15] },
		{ name: "Double Tap", values: [10, 20, 30] },
		{ name: "Fury", values: [15, 25, 35] },
		{ name: "Double-edged", values: [20, 30, 40] },
		{ name: "Stun", values: [10, 20, 30] },
		{ name: "Home Run", values: [25, 50, 75] },
		{ name: "Parry", values: [15, 30, 45] },
	],
	// 条件特效
	conditional: [
		{ name: "Crusher", values: [50, 75, 100], bodyPart: "head" },
		{ name: "Cupid", values: [40, 60, 80], bodyPart: "heart" },
		{ name: "Achilles", values: [30, 50, 70], bodyPart: "left foot" },
		{ name: "Throttle", values: [60, 80, 100], bodyPart: "throat" },
		{ name: "Roshambo", values: [75, 100, 125], bodyPart: "groin" },
		{ name: "Blindside", values: [25, 50, 75], condition: "full_health" },
		{ name: "Comeback", values: [50, 100, 150], condition: "low_health" },
		{ name: "Assassinate", values: [30, 60, 90], condition: "first_turn" },
	],
	// 状态特效
	status: [
		{ name: "Disarm", values: [10, 20, 30] },
		{ name: "Slow", values: [15, 25, 35] },
		{ name: "Cripple", values: [10, 20, 30] },
		{ name: "Weaken", values: [15, 25, 35] },
		{ name: "Wither", values: [10, 20, 30] },
		{ name: "Eviscerate", values: [15, 25, 35] },
		{ name: "Motivation", values: [20, 30, 40] },
		{ name: "Backstab", values: [100], condition: "distracted" },
	],
	// 复杂特效
	complex: [
		{ name: "Execute", values: [10, 20, 30] },
		{ name: "Berserk", values: [25, 50, 75] },
		{ name: "Grace", values: [20, 35, 50] },
		{ name: "Frenzy", values: [10, 15, 20] },
		{ name: "Focus", values: [15, 25, 35] },
		{ name: "Finale", values: [20, 40, 60] },
		{ name: "Wind-up", values: [50, 100, 150] },
		{ name: "Rage", values: [5, 10, 15] },
		{ name: "Smurf", values: [10, 20, 30] },
	],
};

// 创建标准测试玩家的辅助函数
export function createStandardAttacker(): Partial<FightPlayer> {
	return {
		id: 1,
		name: "Attacker",
		life: 1000,
		maxLife: 1000,
		position: "attack",
		battleStats: {
			strength: 100,
			defense: 100,
			speed: 100,
			dexterity: 100,
		},
		statusEffectsV2: {},
		comboCounter: 0,
		lastUsedTurn: {},
		windup: false,
	};
}

export function createStandardTarget(): Partial<FightPlayer> {
	return {
		id: 2,
		name: "Target",
		life: 1000,
		maxLife: 1000,
		position: "defend",
		battleStats: {
			strength: 100,
			defense: 100,
			speed: 100,
			dexterity: 100,
		},
		statusEffectsV2: {},
		comboCounter: 0,
		lastUsedTurn: {},
		windup: false,
	};
}

// 特殊条件玩家
export function createLowHealthTarget(): Partial<FightPlayer> {
	return {
		...createStandardTarget(),
		life: 200, // 20% 血量
		maxLife: 1000,
	};
}

export function createFullHealthTarget(): Partial<FightPlayer> {
	return {
		...createStandardTarget(),
		life: 1000, // 100% 血量
		maxLife: 1000,
	};
}

export function createLowHealthAttacker(): Partial<FightPlayer> {
	return {
		...createStandardAttacker(),
		life: 200, // 20% 血量，触发Comeback
		maxLife: 1000,
	};
}

// 带状态的玩家
export function createPlayerWithDistraction(): Partial<FightPlayer> {
	const player = createStandardTarget();
	if (!player.statusEffectsV2) {
		player.statusEffectsV2 = {};
	}
	player.statusEffectsV2.distracted = { turns: 3, stacks: 1 };
	return player;
}

// 连击计数器玩家
export function createPlayerWithCombo(
	comboCount: number,
): Partial<FightPlayer> {
	return {
		...createStandardAttacker(),
		comboCounter: comboCount,
	};
}

// 武器使用历史玩家
export function createPlayerWithWeaponHistory(
	slot: string,
	lastTurn: number,
): Partial<FightPlayer> {
	const player = createStandardAttacker();
	player.lastUsedTurn = { [slot]: lastTurn };
	return player;
}

// 测试场景配置
export const TEST_SCENARIOS = {
	// 基础伤害测试
	basicDamage: {
		attacker: createStandardAttacker(),
		target: createStandardTarget(),
		weapon: BASE_WEAPONS.rifle,
		bodyPart: "chest",
		turn: 1,
		isCritical: false,
	},
	// 暴击测试
	criticalHit: {
		attacker: createStandardAttacker(),
		target: createStandardTarget(),
		weapon: BASE_WEAPONS.rifle,
		bodyPart: "chest",
		turn: 1,
		isCritical: true,
	},
	// 部位特效测试
	headshot: {
		attacker: createStandardAttacker(),
		target: createStandardTarget(),
		weapon: BASE_WEAPONS.rifle,
		bodyPart: "head",
		turn: 1,
		isCritical: false,
	},
	// 满血目标测试
	fullHealthTarget: {
		attacker: createStandardAttacker(),
		target: createFullHealthTarget(),
		weapon: BASE_WEAPONS.rifle,
		bodyPart: "chest",
		turn: 1,
		isCritical: false,
	},
	// 低血量攻击者测试
	lowHealthAttacker: {
		attacker: createLowHealthAttacker(),
		target: createStandardTarget(),
		weapon: BASE_WEAPONS.rifle,
		bodyPart: "chest",
		turn: 1,
		isCritical: false,
	},
	// 首回合测试
	firstTurn: {
		attacker: createStandardAttacker(),
		target: createStandardTarget(),
		weapon: BASE_WEAPONS.rifle,
		bodyPart: "chest",
		turn: 1,
		isCritical: false,
	},
	// 近战测试
	meleeAttack: {
		attacker: createStandardAttacker(),
		target: createStandardTarget(),
		weapon: BASE_WEAPONS.melee,
		bodyPart: "chest",
		turn: 1,
		isCritical: false,
	},
	// 手部攻击测试（用于Disarm）
	handAttack: {
		attacker: createStandardAttacker(),
		target: createStandardTarget(),
		weapon: BASE_WEAPONS.rifle,
		bodyPart: "left hand",
		turn: 1,
		isCritical: false,
	},
	// 分心目标测试（用于Backstab）
	distractedTarget: {
		attacker: createStandardAttacker(),
		target: createPlayerWithDistraction(),
		weapon: BASE_WEAPONS.melee,
		bodyPart: "chest",
		turn: 1,
		isCritical: false,
	},
};

// 边界值测试数据
export const BOUNDARY_TEST_VALUES = {
	// 0%概率（永不触发）
	zeroPercent: 0,
	// 100%概率（必定触发）
	hundredPercent: 100,
	// 极小值
	minimal: 1,
	// 极大值
	maximal: 999,
	// 常见测试值
	common: [5, 10, 15, 20, 25, 30, 50, 75],
};

// 性能测试配置
export const PERFORMANCE_TEST_CONFIG = {
	// 快速测试（开发时用）
	quick: {
		iterations: 100,
		tolerance: 0.1, // 10%容差
	},
	// 标准测试
	standard: {
		iterations: 1000,
		tolerance: 0.05, // 5%容差
	},
	// 精确测试（CI时用）
	precise: {
		iterations: 10000,
		tolerance: 0.02, // 2%容差
	},
};

// 预期结果计算器
export const EXPECTED_RESULTS = {
	// 计算Powerful特效的预期伤害
	powerfulDamage: (baseDamage: number, bonusPercent: number) =>
		Math.round(baseDamage * (1 + bonusPercent / 100)),

	// 计算Empower特效的预期力量
	empowerStrength: (baseStrength: number, bonusPercent: number) =>
		Math.round(baseStrength * (1 + bonusPercent / 100)),

	// 计算Expose特效的预期暴击率
	exposeCritChance: (baseCritChance: number, bonusValue: number) =>
		Math.min(100, baseCritChance + bonusValue),

	// 计算Penetrate特效的预期护甲减免
	penetrateArmour: (baseMitigation: number, penetrationPercent: number) =>
		baseMitigation * (1 - penetrationPercent / 100),

	// 计算Bloodlust特效的预期治疗
	bloodlustHealing: (damage: number, bonusPercent: number) =>
		Math.round(damage * (bonusPercent / 100)),
};

// 导出所有测试数据的集合
export const ALL_TEST_DATA = {
	bodyParts: BODY_PARTS,
	weaponCategories: WEAPON_CATEGORIES,
	baseWeapons: BASE_WEAPONS,
	bonusData: BONUS_TEST_DATA,
	scenarios: TEST_SCENARIOS,
	boundaryValues: BOUNDARY_TEST_VALUES,
	performanceConfig: PERFORMANCE_TEST_CONFIG,
	expectedResults: EXPECTED_RESULTS,
};
