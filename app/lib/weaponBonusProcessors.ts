import type {
	BattleStats,
	DamageContext,
	FightPlayer,
	WeaponBonusProcessor,
	WeaponState,
} from "./fightSimulatorTypes";
import { getWeaponBonus } from "./weaponBonuses";

// 武器特效处理器注册表
const WEAPON_BONUS_PROCESSORS: Map<string, WeaponBonusProcessor> = new Map();

// 注册特效处理器
function registerProcessor(processor: WeaponBonusProcessor) {
	WEAPON_BONUS_PROCESSORS.set(processor.name, processor);
}

// 获取特效处理器
export function getWeaponBonusProcessor(
	name: string,
): WeaponBonusProcessor | undefined {
	return WEAPON_BONUS_PROCESSORS.get(name);
}

// 获取所有已注册的处理器
export function getAllProcessors(): WeaponBonusProcessor[] {
	return Array.from(WEAPON_BONUS_PROCESSORS.values());
}

// 1. Powerful - 增加伤害百分比
const PowerfulProcessor: WeaponBonusProcessor = {
	name: "Powerful",
	applyToDamage: (
		damage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		return Math.round(damage * (1 + bonusValue / 100));
	},
};

// 2. Empower - 使用武器时增加力量
const EmpowerProcessor: WeaponBonusProcessor = {
	name: "Empower",
	applyToStats: (stats: BattleStats, bonusValue: number) => {
		return {
			...stats,
			strength: Math.round(stats.strength * (1 + bonusValue / 100)),
		};
	},
};

// 3. Quicken - 使用武器时增加速度
const QuickenProcessor: WeaponBonusProcessor = {
	name: "Quicken",
	applyToStats: (stats: BattleStats, bonusValue: number) => {
		return {
			...stats,
			speed: Math.round(stats.speed * (1 + bonusValue / 100)),
		};
	},
};

// 4. Deadeye - 增加暴击伤害
const DeadeyeProcessor: WeaponBonusProcessor = {
	name: "Deadeye",
	applyToCritical: (
		critChance: number,
		critDamage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		const newCritDamage = critDamage * (1 + bonusValue / 100);
		return [critChance, newCritDamage];
	},
};

// 5. Expose - 增加暴击率
const ExposeProcessor: WeaponBonusProcessor = {
	name: "Expose",
	applyToCritical: (
		critChance: number,
		critDamage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		const newCritChance = Math.min(100, critChance + bonusValue);
		return [newCritChance, critDamage];
	},
};

// 6. Conserve - 增加弹药保存率
const ConserveProcessor: WeaponBonusProcessor = {
	name: "Conserve",
	applyToAmmo: (
		ammoConsumed: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		// 按保存率几率返回0消耗，否则正常消耗
		const saveChance = bonusValue / 100;
		const random = Math.random();
		return random < saveChance ? 0 : ammoConsumed;
	},
};

// 7. Specialist - 增加伤害但限制单弹夹
const SpecialistProcessor: WeaponBonusProcessor = {
	name: "Specialist",
	applyToDamage: (
		damage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		return Math.round(damage * (1 + bonusValue / 100));
	},
	modifyWeaponState: (weaponState: WeaponState, bonusValue: number) => {
		// 限制为单弹夹
		const modifiedState = { ...weaponState };
		if (
			typeof modifiedState.primary === "object" &&
			"clipsleft" in modifiedState.primary
		) {
			modifiedState.primary = { ...modifiedState.primary, clipsleft: 1 };
		}
		if (
			typeof modifiedState.secondary === "object" &&
			"clipsleft" in modifiedState.secondary
		) {
			modifiedState.secondary = { ...modifiedState.secondary, clipsleft: 1 };
		}
		return modifiedState;
	},
};

// 8. Penetrate - 忽略护甲百分比
const PenetrateProcessor: WeaponBonusProcessor = {
	name: "Penetrate",
	applyToArmourMitigation: (
		mitigation: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		return mitigation * (1 - bonusValue / 100);
	},
};

// 9. Bloodlust - 根据伤害回复生命
const BloodlustProcessor: WeaponBonusProcessor = {
	name: "Bloodlust",
	applyPostDamage: (
		attacker: FightPlayer,
		target: FightPlayer,
		damage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		const healAmount = Math.round(damage * (bonusValue / 100));
		// 注意：这里需要在实际使用时修改攻击者的生命值
		// 由于这是纯函数，实际的生命值修改需要在调用方处理
	},
};

// 注册所有处理器
registerProcessor(PowerfulProcessor);
registerProcessor(EmpowerProcessor);
registerProcessor(QuickenProcessor);
registerProcessor(DeadeyeProcessor);
registerProcessor(ExposeProcessor);
registerProcessor(ConserveProcessor);
registerProcessor(SpecialistProcessor);
registerProcessor(PenetrateProcessor);
registerProcessor(BloodlustProcessor);

// 辅助函数：应用武器特效到属性
export function applyWeaponBonusesToStats(
	baseStats: BattleStats,
	weapon: { weaponBonuses?: Array<{ name: string; value: number }> },
): BattleStats {
	if (!weapon.weaponBonuses) return baseStats;

	let modifiedStats = { ...baseStats };

	for (const bonus of weapon.weaponBonuses) {
		const processor = getWeaponBonusProcessor(bonus.name);
		if (processor?.applyToStats) {
			modifiedStats = processor.applyToStats(modifiedStats, bonus.value);
		}
	}

	return modifiedStats;
}

// 辅助函数：应用武器特效到伤害
export function applyWeaponBonusesToDamage(
	baseDamage: number,
	weapon: { weaponBonuses?: Array<{ name: string; value: number }> },
	context: DamageContext,
): number {
	if (!weapon.weaponBonuses) return baseDamage;

	let modifiedDamage = baseDamage;

	for (const bonus of weapon.weaponBonuses) {
		const processor = getWeaponBonusProcessor(bonus.name);
		if (processor?.applyToDamage) {
			modifiedDamage = processor.applyToDamage(
				modifiedDamage,
				bonus.value,
				context,
			);
		}
	}

	return modifiedDamage;
}

// 辅助函数：应用武器特效到暴击
export function applyWeaponBonusesToCritical(
	baseCritChance: number,
	baseCritDamage: number,
	weapon: { weaponBonuses?: Array<{ name: string; value: number }> },
	context: DamageContext,
): [number, number] {
	if (!weapon.weaponBonuses) return [baseCritChance, baseCritDamage];

	let critChance = baseCritChance;
	let critDamage = baseCritDamage;

	for (const bonus of weapon.weaponBonuses) {
		const processor = getWeaponBonusProcessor(bonus.name);
		if (processor?.applyToCritical) {
			[critChance, critDamage] = processor.applyToCritical(
				critChance,
				critDamage,
				bonus.value,
				context,
			);
		}
	}

	return [critChance, critDamage];
}

// 辅助函数：应用武器特效到护甲减免
export function applyWeaponBonusesToArmour(
	baseMitigation: number,
	weapon: { weaponBonuses?: Array<{ name: string; value: number }> },
	context: DamageContext,
): number {
	if (!weapon.weaponBonuses) return baseMitigation;

	let modifiedMitigation = baseMitigation;

	for (const bonus of weapon.weaponBonuses) {
		const processor = getWeaponBonusProcessor(bonus.name);
		if (processor?.applyToArmourMitigation) {
			modifiedMitigation = processor.applyToArmourMitigation(
				modifiedMitigation,
				bonus.value,
				context,
			);
		}
	}

	return modifiedMitigation;
}

// 辅助函数：应用武器特效到弹药消耗
export function applyWeaponBonusesToAmmo(
	baseAmmoConsumed: number,
	weapon: { weaponBonuses?: Array<{ name: string; value: number }> },
	context: DamageContext,
): number {
	if (!weapon.weaponBonuses) return baseAmmoConsumed;

	let modifiedAmmoConsumed = baseAmmoConsumed;

	for (const bonus of weapon.weaponBonuses) {
		const processor = getWeaponBonusProcessor(bonus.name);
		if (processor?.applyToAmmo) {
			modifiedAmmoConsumed = processor.applyToAmmo(
				modifiedAmmoConsumed,
				bonus.value,
				context,
			);
		}
	}

	return modifiedAmmoConsumed;
}

// 辅助函数：应用武器特效的后处理效果
export function applyWeaponBonusesPostDamage(
	attacker: FightPlayer,
	target: FightPlayer,
	damage: number,
	weapon: { weaponBonuses?: Array<{ name: string; value: number }> },
	context: DamageContext,
): number {
	if (!weapon.weaponBonuses) return 0;

	let totalHealing = 0;

	for (const bonus of weapon.weaponBonuses) {
		const processor = getWeaponBonusProcessor(bonus.name);
		if (processor?.applyPostDamage) {
			if (bonus.name === "Bloodlust") {
				// 特殊处理Bloodlust的生命回复
				totalHealing += Math.round(damage * (bonus.value / 100));
			}
			processor.applyPostDamage(attacker, target, damage, bonus.value, context);
		}
	}

	return totalHealing;
}

// 辅助函数：修改武器状态（用于Specialist等特效）
export function applyWeaponBonusesToWeaponState(
	baseWeaponState: WeaponState,
	weapon: { weaponBonuses?: Array<{ name: string; value: number }> },
): WeaponState {
	if (!weapon.weaponBonuses) return baseWeaponState;

	let modifiedState = { ...baseWeaponState };

	for (const bonus of weapon.weaponBonuses) {
		const processor = getWeaponBonusProcessor(bonus.name);
		if (processor?.modifyWeaponState) {
			modifiedState = processor.modifyWeaponState(modifiedState, bonus.value);
		}
	}

	return modifiedState;
}

// 辅助函数：检测和记录触发的特效
export function getTriggeredBonuses(
	weapon: { weaponBonuses?: Array<{ name: string; value: number }> },
	context: DamageContext,
): string[] {
	if (!weapon.weaponBonuses) return [];

	const triggeredBonuses: string[] = [];

	for (const bonus of weapon.weaponBonuses) {
		const processor = getWeaponBonusProcessor(bonus.name);
		if (!processor) continue;

		// 检查各种类型的特效是否会触发
		let triggered = false;

		// 属性修改类特效（总是触发）
		if (
			processor.applyToStats &&
			(bonus.name === "Empower" || bonus.name === "Quicken")
		) {
			triggered = true;
		}

		// 伤害修改类特效（命中时触发）
		if (
			processor.applyToDamage &&
			context.attacker &&
			(bonus.name === "Powerful" || bonus.name === "Specialist")
		) {
			triggered = true;
		}

		// 暴击相关特效（命中时触发）
		if (processor.applyToCritical && context.attacker) {
			if (bonus.name === "Deadeye" && context.isCritical) {
				triggered = true;
			} else if (bonus.name === "Expose") {
				triggered = true; // 暴击率提升总是生效
			}
		}

		// 护甲穿透特效（命中时触发）
		if (
			processor.applyToArmourMitigation &&
			context.attacker &&
			bonus.name === "Penetrate"
		) {
			triggered = true;
		}

		// 弹药保存特效（射击时有概率触发）
		if (processor.applyToAmmo && bonus.name === "Conserve") {
			// 这里简化处理，实际触发在弹药消耗时决定
			// 我们在弹药消耗日志中单独处理
		}

		// 生命回复特效（造成伤害时触发）
		if (
			processor.applyPostDamage &&
			bonus.name === "Bloodlust" &&
			context.attacker
		) {
			triggered = true;
		}

		if (triggered) {
			triggeredBonuses.push(
				`${bonus.name}(${bonus.value}${getWeaponBonus(bonus.name)?.unit || "%"})`,
			);
		}
	}

	return triggeredBonuses;
}
