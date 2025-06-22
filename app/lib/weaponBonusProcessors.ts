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

// 全局变量用于跟踪当前回合触发的特效
let currentTurnTriggeredEffects: string[] = [];

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

// 清空当前回合触发的特效
export function clearTriggeredEffects() {
	currentTurnTriggeredEffects = [];
}

// 添加触发的特效
export function addTriggeredEffect(effectName: string) {
	if (!currentTurnTriggeredEffects.includes(effectName)) {
		currentTurnTriggeredEffects.push(effectName);
	}
}

// 获取当前回合触发的特效
export function getCurrentTurnTriggeredEffects(): string[] {
	return [...currentTurnTriggeredEffects];
}

// 1. Powerful - 增加伤害百分比
const PowerfulProcessor: WeaponBonusProcessor = {
	name: "Powerful",
	applyToDamage: (
		damage: number,
		bonusValue: number,
		_context: DamageContext,
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
		_context: DamageContext,
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
		_context: DamageContext,
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
		_context: DamageContext,
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
		_context: DamageContext,
	) => {
		return Math.round(damage * (1 + bonusValue / 100));
	},
	modifyWeaponState: (weaponState: WeaponState, _bonusValue: number) => {
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
		_context: DamageContext,
	) => {
		return mitigation * (1 - bonusValue / 100);
	},
};

// 9. Bloodlust - 根据伤害回复生命
const BloodlustProcessor: WeaponBonusProcessor = {
	name: "Bloodlust",
	applyPostDamage: (
		_attacker: FightPlayer,
		_target: FightPlayer,
		damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		// 返回正值表示对攻击者的生命回复
		return Math.round(damage * (bonusValue / 100));
	},
};

// ===== 中等难度特效 (14-31) =====

// 14. Crusher - 增加头部伤害
const CrusherProcessor: WeaponBonusProcessor = {
	name: "Crusher",
	applyToDamage: (
		damage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		if (context.bodyPart === "head") {
			return Math.round(damage * (1 + bonusValue / 100));
		}
		return damage;
	},
};

// 15. Cupid - 增加心脏伤害
const CupidProcessor: WeaponBonusProcessor = {
	name: "Cupid",
	applyToDamage: (
		damage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		if (context.bodyPart === "heart") {
			return Math.round(damage * (1 + bonusValue / 100));
		}
		return damage;
	},
};

// 16. Achilles - 增加脚部伤害
const AchillesProcessor: WeaponBonusProcessor = {
	name: "Achilles",
	applyToDamage: (
		damage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		if (context.bodyPart === "foot") {
			return Math.round(damage * (1 + bonusValue / 100));
		}
		return damage;
	},
};

// 17. Throttle - 增加喉咙伤害
const ThrottleProcessor: WeaponBonusProcessor = {
	name: "Throttle",
	applyToDamage: (
		damage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		if (context.bodyPart === "throat") {
			return Math.round(damage * (1 + bonusValue / 100));
		}
		return damage;
	},
};

// 18. Roshambo - 增加腹股沟伤害
const RoshamboProcessor: WeaponBonusProcessor = {
	name: "Roshambo",
	applyToDamage: (
		damage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		if (context.bodyPart === "groin") {
			return Math.round(damage * (1 + bonusValue / 100));
		}
		return damage;
	},
};

// 19. Puncture - 忽略护甲几率
const PunctureProcessor: WeaponBonusProcessor = {
	name: "Puncture",
	applyToArmourMitigation: (
		mitigation: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		const ignoreChance = bonusValue / 100;
		const random = Math.random();
		if (random < ignoreChance) {
			addTriggeredEffect("Puncture");
			return 0;
		}
		return mitigation;
	},
};

// 20. Sure Shot - 必中几率
const SureShotProcessor: WeaponBonusProcessor = {
	name: "Sure Shot",
	applyToHitChance: (
		hitChance: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		const guaranteedHitChance = bonusValue / 100;
		const random = Math.random();
		if (random < guaranteedHitChance) {
			addTriggeredEffect("Sure Shot");
			return 100;
		}
		return hitChance;
	},
};

// 21. Deadly - 致命一击几率
const DeadlyProcessor: WeaponBonusProcessor = {
	name: "Deadly",
	applyToDamage: (
		damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		const deadlyChance = bonusValue / 100;
		const random = Math.random();
		if (random < deadlyChance) {
			addTriggeredEffect("Deadly");
			return Math.round(damage * 5); // 500%伤害
		}
		return damage;
	},
};

// 22. Double Tap - 双击几率
const DoubleTapProcessor: WeaponBonusProcessor = {
	name: "Double Tap",
	applyPostDamage: (
		_attacker: FightPlayer,
		_target: FightPlayer,
		_damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		const doubleTapChance = bonusValue / 100;
		const random = Math.random();
		if (random < doubleTapChance) {
			addTriggeredEffect("Double Tap");
			// 这里只标记触发，实际的额外攻击需要在战斗引擎中处理
		}
		return 0;
	},
};

// 23. Fury - 双击几率 (近战版)
const FuryProcessor: WeaponBonusProcessor = {
	name: "Fury",
	applyPostDamage: (
		_attacker: FightPlayer,
		_target: FightPlayer,
		_damage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		const furyChance = bonusValue / 100;
		const random = Math.random();
		// 只在近战武器上触发
		const isMelee = ["CL", "PI", "SL"].includes(context.weapon.category);
		if (isMelee && random < furyChance) {
			addTriggeredEffect("Fury");
			// 这里只标记触发，实际的额外攻击需要在战斗引擎中处理
		}
		return 0;
	},
};

// 24. Double-edged - 双倍伤害但自伤
const DoubleEdgedProcessor: WeaponBonusProcessor = {
	name: "Double-edged",
	applyToDamage: (
		damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		const doubleEdgedChance = bonusValue / 100;
		const random = Math.random();
		if (random < doubleEdgedChance) {
			addTriggeredEffect("Double-edged");
			return Math.round(damage * 2); // 双倍伤害
		}
		return damage;
	},
	applyPostDamage: (
		_attacker: FightPlayer,
		_target: FightPlayer,
		damage: number,
		_bonusValue: number,
		_context: DamageContext,
	) => {
		// 只有在Double-edged特效触发时才造成自伤
		if (getCurrentTurnTriggeredEffects().includes("Double-edged")) {
			const selfDamage = Math.round(damage * 0.25); // 自伤25%
			// 返回负值表示对攻击者造成伤害
			return -selfDamage;
		}
		return 0;
	},
};

// 25. Execute - 低血量秒杀
const ExecuteProcessor: WeaponBonusProcessor = {
	name: "Execute",
	applyPostDamage: (
		_attacker: FightPlayer,
		target: FightPlayer,
		damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		const executeThreshold = bonusValue / 100;
		const targetHealthPercent = target.life / target.maxLife;
		if (targetHealthPercent <= executeThreshold && damage > 0) {
			addTriggeredEffect("Execute");
			// 直接击败目标 - 这个需要在战斗引擎中处理
		}
		return 0;
	},
};

// 26. Blindside - 满血伤害加成
const BlindsideProcessor: WeaponBonusProcessor = {
	name: "Blindside",
	applyToDamage: (
		damage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		// 检查目标是否满血
		if (context.target.life >= context.target.maxLife) {
			return Math.round(damage * (1 + bonusValue / 100));
		}
		return damage;
	},
};

// 27. Comeback - 低血量伤害加成
const ComebackProcessor: WeaponBonusProcessor = {
	name: "Comeback",
	applyToDamage: (
		damage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		// 检查自己血量是否低于25%
		const attackerHealthPercent =
			context.attacker.life / context.attacker.maxLife;
		if (attackerHealthPercent <= 0.25) {
			return Math.round(damage * (1 + bonusValue / 100));
		}
		return damage;
	},
};

// 28. Assassinate - 首回合伤害加成
const AssassinateProcessor: WeaponBonusProcessor = {
	name: "Assassinate",
	applyToDamage: (
		damage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		if (context.turn === 1) {
			return Math.round(damage * (1 + bonusValue / 100));
		}
		return damage;
	},
};

// 29. Stun - 眩晕几率
const StunProcessor: WeaponBonusProcessor = {
	name: "Stun",
	applyPostDamage: (
		_attacker: FightPlayer,
		_target: FightPlayer,
		damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		const stunChance = bonusValue / 100;
		const random = Math.random();
		if (random < stunChance && damage > 0) {
			addTriggeredEffect("Stun");
			// 设置眩晕状态 - 这个需要在战斗引擎中处理状态效果
		}
		return 0;
	},
};

// 30. Home Run - 反弹临时物品
const HomeRunProcessor: WeaponBonusProcessor = {
	name: "Home Run",
	applyToHitChance: (
		hitChance: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		// 如果对方使用临时武器，有几率反弹
		if (context.currentWeaponSlot === "temporary") {
			const deflectChance = bonusValue / 100;
			const random = Math.random();
			if (random < deflectChance) {
				addTriggeredEffect("Home Run");
				// 反弹攻击，设置命中率为0
				return 0;
			}
		}
		return hitChance;
	},
};

// 31. Parry - 格挡近战攻击
const ParryProcessor: WeaponBonusProcessor = {
	name: "Parry",
	applyToDamage: (
		damage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		// 只对近战攻击有效
		const isMeleeAttack = ["CL", "PI", "SL"].includes(context.weapon.category);
		if (isMeleeAttack) {
			const parryChance = bonusValue / 100;
			const random = Math.random();
			if (random < parryChance) {
				addTriggeredEffect("Parry");
				return 0; // 格挡成功，伤害为0
			}
		}
		return damage;
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

// 注册中等难度特效处理器
registerProcessor(CrusherProcessor);
registerProcessor(CupidProcessor);
registerProcessor(AchillesProcessor);
registerProcessor(ThrottleProcessor);
registerProcessor(RoshamboProcessor);
registerProcessor(PunctureProcessor);
registerProcessor(SureShotProcessor);
registerProcessor(DeadlyProcessor);
registerProcessor(DoubleTapProcessor);
registerProcessor(FuryProcessor);
registerProcessor(DoubleEdgedProcessor);
registerProcessor(ExecuteProcessor);
registerProcessor(BlindsideProcessor);
registerProcessor(ComebackProcessor);
registerProcessor(AssassinateProcessor);
registerProcessor(StunProcessor);
registerProcessor(HomeRunProcessor);
registerProcessor(ParryProcessor);

// 辅助函数：应用武器特效到命中率
export function applyWeaponBonusesToHitChance(
	baseHitChance: number,
	weapon: { weaponBonuses?: Array<{ name: string; value: number }> },
	context: DamageContext,
): number {
	if (!weapon.weaponBonuses) return baseHitChance;

	let modifiedHitChance = baseHitChance;

	for (const bonus of weapon.weaponBonuses) {
		const processor = getWeaponBonusProcessor(bonus.name);
		if (processor?.applyToHitChance) {
			modifiedHitChance = processor.applyToHitChance(
				modifiedHitChance,
				bonus.value,
				context,
			);
		}
	}

	return modifiedHitChance;
}

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
			const result = processor.applyPostDamage(
				attacker,
				target,
				damage,
				bonus.value,
				context,
			);

			if (bonus.name === "Bloodlust") {
				// Bloodlust的生命回复
				totalHealing += result;
			} else if (bonus.name === "Double-edged" && result < 0) {
				// Double-edged的自伤（负值表示对攻击者造成伤害）
				totalHealing += result; // 负值减少攻击者生命值
			}
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
	const currentTriggeredEffects = getCurrentTurnTriggeredEffects();

	for (const bonus of weapon.weaponBonuses) {
		const processor = getWeaponBonusProcessor(bonus.name);
		if (!processor) continue;

		// 检查各种类型的特效是否会触发
		let triggered = false;

		// 检查是否是当前回合触发的概率特效
		if (currentTriggeredEffects.includes(bonus.name)) {
			triggered = true;
		}
		// 属性修改类特效（总是触发）
		else if (
			processor.applyToStats &&
			(bonus.name === "Empower" || bonus.name === "Quicken")
		) {
			triggered = true;
		}
		// 伤害修改类特效（命中时触发）
		else if (processor.applyToDamage && context.attacker) {
			// 基础伤害特效
			if (bonus.name === "Powerful" || bonus.name === "Specialist") {
				triggered = true;
			}
			// 部位特效 - 只有命中对应部位时才显示
			else if (bonus.name === "Crusher" && context.bodyPart === "head") {
				triggered = true;
			} else if (bonus.name === "Cupid" && context.bodyPart === "heart") {
				triggered = true;
			} else if (bonus.name === "Achilles" && context.bodyPart === "foot") {
				triggered = true;
			} else if (bonus.name === "Throttle" && context.bodyPart === "throat") {
				triggered = true;
			} else if (bonus.name === "Roshambo" && context.bodyPart === "groin") {
				triggered = true;
			}
			// 条件伤害特效 - 只有满足条件时才显示
			else if (
				bonus.name === "Blindside" &&
				context.target.life >= context.target.maxLife
			) {
				triggered = true;
			} else if (
				bonus.name === "Comeback" &&
				context.attacker.life / context.attacker.maxLife <= 0.25
			) {
				triggered = true;
			} else if (bonus.name === "Assassinate" && context.turn === 1) {
				triggered = true;
			}
		}
		// 暴击相关特效（命中时触发）
		else if (processor.applyToCritical && context.attacker) {
			if (bonus.name === "Deadeye" && context.isCritical) {
				triggered = true;
			} else if (bonus.name === "Expose") {
				triggered = true; // 暴击率提升总是生效
			}
		}
		// 护甲穿透特效（命中时触发）
		else if (processor.applyToArmourMitigation && context.attacker) {
			if (bonus.name === "Penetrate") {
				triggered = true;
			}
		}
		// 生命回复特效（造成伤害时触发）
		else if (
			processor.applyPostDamage &&
			context.attacker &&
			bonus.name === "Bloodlust"
		) {
			triggered = true;
		}

		if (triggered) {
			// 为概率特效添加特殊描述
			let bonusText = `${bonus.name}(${bonus.value}${getWeaponBonus(bonus.name)?.unit || "%"})`;
			if (currentTriggeredEffects.includes(bonus.name)) {
				const effectText = getBonusEffectText(bonus.name, bonus.value);
				bonusText += ` - ${effectText}`;
			}
			triggeredBonuses.push(bonusText);
		}
	}

	return triggeredBonuses;
}

// 新增：检测概率特效触发的辅助函数
export function checkProbabilityBonus(
	_bonusName: string,
	value: number,
): boolean {
	const chance = value / 100;
	return Math.random() < chance;
}

// 新增：获取特效触发时的描述文本
export function getBonusEffectText(
	bonusName: string,
	_value: number,
	_context?: unknown,
): string {
	switch (bonusName) {
		case "Puncture":
			return "armor ignored";
		case "Sure Shot":
			return "guaranteed hit";
		case "Deadly":
			return "deadly strike";
		case "Double Tap":
		case "Fury":
			return "double attack";
		case "Double-edged":
			return "double damage with self-injury";
		case "Execute":
			return "execution";
		case "Stun":
			return "target stunned";
		case "Home Run":
			return "temporary weapon deflected";
		case "Parry":
			return "attack parried";
		default:
			return `${bonusName} triggered`;
	}
}
