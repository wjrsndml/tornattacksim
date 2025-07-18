import type {
	BattleStats,
	DamageContext,
	FightPlayer,
	StatusEffectsV2,
	WeaponBonusProcessor,
	WeaponState,
} from "./fightSimulatorTypes";
import {
	addStatus,
	hasStatus,
	initializeStatusEffectsV2,
} from "./statusEffectManager";
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
	applyToDamageBonus: (
		baseDamageBonus: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		return baseDamageBonus + bonusValue;
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

// 4. Deadeye - 增加暴击伤害（只在暴击时生效）
const DeadeyeProcessor: WeaponBonusProcessor = {
	name: "Deadeye",
	applyToDamageBonus: (
		baseDamageBonus: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		// 只在暴击时增加伤害加成
		if (context.isCritical) {
			return baseDamageBonus + bonusValue;
		}
		return baseDamageBonus;
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

// 7. Specialist - 增加伤害但限制单弹夹（只有第一个弹夹有伤害加成）
const SpecialistProcessor: WeaponBonusProcessor = {
	name: "Specialist",
	applyToDamageBonus: (
		baseDamageBonus: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		// 检查武器状态，只有在第一个弹夹时才增加伤害
		const weaponSlot = context.currentWeaponSlot;
		if (
			(weaponSlot === "primary" || weaponSlot === "secondary") &&
			context.weaponState
		) {
			const weaponState =
				context.weaponState[weaponSlot as "primary" | "secondary"];
			// 修复逻辑：检查当前弹夹是否为第一个弹夹
			// 如果clipsleft === 1，说明这是第一个（也是唯一的）弹夹，应该有伤害加成
			// 如果clipsleft === 0，说明弹夹已经用完，不应该有伤害加成
			if (
				weaponState &&
				"clipsleft" in weaponState &&
				weaponState.clipsleft === 1
			) {
				return baseDamageBonus + bonusValue;
			}
		}
		return baseDamageBonus;
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
		if (context.bodyPart.includes("foot")) {
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
			return { extraAttacks: 1 };
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
		_context: DamageContext,
	) => {
		const furyChance = bonusValue / 100;
		const random = Math.random();
		if (random < furyChance) {
			addTriggeredEffect("Fury");
			return { extraAttacks: 1 };
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
	applyToDamage: (
		damage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		// bonusValue是百分比阈值，比如15表示15%
		const executeThreshold = bonusValue;

		// 使用当前生命值而不是最大生命值
		const currentTargetLife =
			context.currentLife?.target ?? context.target.life;
		const maxTargetLife = context.target.maxLife || context.target.life;
		const targetHealthPercent = (currentTargetLife / maxTargetLife) * 100;

		// 如果目标血量百分比低于阈值且造成了伤害，执行秒杀
		if (targetHealthPercent <= executeThreshold && damage > 0) {
			addTriggeredEffect("Execute");
			// 返回目标当前生命值加上一些额外伤害，确保击杀
			return currentTargetLife;
		}
		return damage;
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
		// 使用当前生命值检查目标是否满血
		const currentTargetLife =
			context.currentLife?.target ?? context.target.life;
		const maxTargetLife = context.target.maxLife || context.target.life;

		// 检查目标是否满血
		if (currentTargetLife >= maxTargetLife) {
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
		// 使用当前生命值而不是最大生命值
		const currentAttackerLife =
			context.currentLife?.attacker ?? context.attacker.life;
		const maxAttackerLife = context.attacker.maxLife || context.attacker.life;
		const attackerHealthPercent = currentAttackerLife / maxAttackerLife;

		// 检查自己血量是否低于25%
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
		target: FightPlayer,
		damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		if (damage > 0) {
			const stunChance = bonusValue / 100;
			const random = Math.random();
			if (random < stunChance) {
				addTriggeredEffect("Stun");
				initializeStatusEffectsV2(target);
				addStatus(target, "stun", 2, 1); // 眩晕2回合，保证对手下回合跳过行动
			}
		}
		return 0;
	},
};

// 30. Home Run - 反弹临时物品
const HomeRunProcessor: WeaponBonusProcessor = {
	name: "Home Run",
	applyPostDamage: (
		_attacker: FightPlayer,
		target: FightPlayer,
		damage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		// 只有在成功造成伤害时才可能触发Home Run
		if (damage > 0) {
			// 关键：检查目标当前回合是否正在使用临时武器
			if (context.targetWeaponSlot === "temporary") {
				const targetTempWeapon = target.weapons.temporary;
				if (targetTempWeapon?.name && targetTempWeapon.name !== "None") {
					const deflectChance = bonusValue / 100;
					const random = Math.random();
					if (random < deflectChance) {
						// 检查是否为免疫Home Run的特殊临时武器
						const immuneTemps = [
							"Tyrosine",
							"Serotonin",
							"Melatonin",
							"Epinephrine",
						];
						const isImmune = immuneTemps.some((immuneTemp) =>
							targetTempWeapon.name.includes(immuneTemp),
						);

						if (!isImmune) {
							addTriggeredEffect("Home Run");
							// 注意：Home Run的实际效果需要在战斗引擎层面处理
							// 这里只是标记特效触发，实际的武器失效由战斗引擎处理
							// 避免直接修改玩家对象造成跨战斗影响
						}
					}
				}
			}
		}
		return 0; // 不产生额外治疗或额外攻击
	},
};

const meleeCategories = ["Clubbing", "Piercing", "Slashing", "CL", "PI", "SL"];

// 31. Parry - 格挡近战攻击
const ParryProcessor: WeaponBonusProcessor = {
	name: "Parry",
	applyToIncomingDamage: (
		incomingDamage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		const attackerWeapon = context.weapon;
		const isMeleeAttack = meleeCategories.includes(attackerWeapon.category);

		// 只有攻击方或防守方使用带有Parry特效的武器时才能格挡
		// 检查攻击者的武器是否有Parry特效
		const attackerHasParry = attackerWeapon.weaponBonuses?.some(
			(bonus) => bonus.name === "Parry",
		);
		// 检查防守者当前使用的武器是否有Parry特效
		const defenderHasParry =
			context.targetWeaponSlot &&
			context.target?.weapons[
				context.targetWeaponSlot as keyof typeof context.target.weapons
			]?.weaponBonuses?.some((bonus) => bonus.name === "Parry");

		if (
			isMeleeAttack &&
			incomingDamage > 0 &&
			(attackerHasParry || defenderHasParry)
		) {
			const parryChance = bonusValue / 100;
			if (Math.random() < parryChance) {
				addTriggeredEffect("Parry");
				return 0;
			}
		}
		return incomingDamage;
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
): { healing: number; extraAttacks: number } {
	if (!weapon.weaponBonuses) return { healing: 0, extraAttacks: 0 };

	let totalHealing = 0;
	let totalExtraAttacks = 0;

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

			if (typeof result === "number") {
				if (bonus.name === "Bloodlust") {
					// Bloodlust的生命回复
					totalHealing += result;
				} else if (bonus.name === "Double-edged" && result < 0) {
					// Double-edged的自伤（负值表示对攻击者造成伤害）
					totalHealing += result; // 负值减少攻击者生命值
				}
			} else if (typeof result === "object" && result.extraAttacks) {
				totalExtraAttacks += result.extraAttacks;
			}
		}
	}

	return { healing: totalHealing, extraAttacks: totalExtraAttacks };
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

// 新增：应用回合前钩子
export function applyWeaponBonusesBeforeTurn(
	attacker: FightPlayer,
	target: FightPlayer,
	weaponState: WeaponState,
	weapon: { weaponBonuses?: Array<{ name: string; value: number }> },
	context: DamageContext,
): boolean {
	if (!weapon.weaponBonuses) return false;

	for (const bonus of weapon.weaponBonuses) {
		const processor = getWeaponBonusProcessor(bonus.name);
		if (processor?.applyBeforeTurn) {
			const result = processor.applyBeforeTurn(
				attacker,
				target,
				weaponState,
				context,
			);
			if (result?.skip) {
				return true; // 跳过这回合
			}
		}
	}

	return false;
}

// 新增：应用回合结束钩子
export function applyWeaponBonusesOnTurnEnd(
	attacker: FightPlayer,
	target: FightPlayer,
	weapon: { weaponBonuses?: Array<{ name: string; value: number }> },
	context: DamageContext,
): void {
	if (!weapon.weaponBonuses) return;

	for (const bonus of weapon.weaponBonuses) {
		const processor = getWeaponBonusProcessor(bonus.name);
		if (processor?.onTurnEnd) {
			processor.onTurnEnd(attacker, target, context);
		}
	}
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
			// 部位特效 - 修复：支持带有left/right前缀的身体部位
			if (bonus.name === "Crusher" && context.bodyPart === "head") {
				triggered = true;
			} else if (bonus.name === "Cupid" && context.bodyPart === "heart") {
				triggered = true;
			} else if (
				bonus.name === "Achilles" &&
				context.bodyPart.includes("foot")
			) {
				triggered = true;
			} else if (bonus.name === "Throttle" && context.bodyPart === "throat") {
				triggered = true;
			} else if (bonus.name === "Roshambo" && context.bodyPart === "groin") {
				triggered = true;
			}
			// 条件伤害特效 - 只有满足条件时才显示
			else if (
				bonus.name === "Blindside" &&
				(context.currentLife?.target ?? context.target.life) >=
					(context.target.maxLife || context.target.life)
			) {
				triggered = true;
			} else if (
				bonus.name === "Comeback" &&
				(context.currentLife?.attacker ?? context.attacker.life) /
					(context.attacker.maxLife || context.attacker.life) <=
					0.25
			) {
				triggered = true;
			} else if (bonus.name === "Assassinate" && context.turn === 1) {
				triggered = true;
			} else if (
				bonus.name === "Execute" &&
				((context.currentLife?.target ?? context.target.life) /
					(context.target.maxLife || context.target.life)) *
					100 <=
					bonus.value
			) {
				triggered = true; // Execute在目标血量低于阈值时显示
			}
			// 新增困难特效的触发条件
			else if (bonus.name === "Berserk" || bonus.name === "Grace") {
				triggered = true; // 总是生效
			} else if (
				bonus.name === "Frenzy" &&
				(context.attacker.comboCounter || 0) > 0
			) {
				triggered = true;
			} else if (
				bonus.name === "Focus" &&
				(context.attacker.comboCounter || 0) > 0
			) {
				triggered = true;
			} else if (bonus.name === "Finale") {
				const lastUsedTurn =
					context.attacker.lastUsedTurn?.[context.currentWeaponSlot] || 0;
				const idleTurns = Math.max(0, context.turn - lastUsedTurn - 1);
				if (idleTurns > 0) triggered = true;
			} else if (bonus.name === "Wind-up" && context.attacker.windup) {
				triggered = true;
			} else if (bonus.name === "Smurf") {
				triggered = true; // 简化处理，总是显示
			}
		}
		// 暴击相关特效（命中时触发）
		else if (processor.applyToCritical && context.attacker) {
			if (bonus.name === "Expose") {
				triggered = true; // 暴击率提升总是生效
			}
		}
		// 伤害加成特效（命中时触发）
		else if (processor.applyToDamageBonus && context.attacker) {
			if (bonus.name === "Powerful") {
				triggered = true;
			} else if (
				bonus.name === "Specialist" &&
				context.weaponState &&
				(context.currentWeaponSlot === "primary" ||
					context.currentWeaponSlot === "secondary")
			) {
				// 修复Specialist显示逻辑：只有在第一个弹夹时才显示
				const weaponSlot = context.currentWeaponSlot;
				const weaponState =
					context.weaponState[weaponSlot as "primary" | "secondary"];
				if (
					weaponState &&
					"clipsleft" in weaponState &&
					weaponState.clipsleft === 1
				) {
					triggered = true;
				}
			} else if (bonus.name === "Deadeye" && context.isCritical) {
				triggered = true; // 只在暴击时显示
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
		// 防御性特效（受到攻击时可能触发）
		else if (processor.applyToIncomingDamage && bonus.name === "Parry") {
			const attackerWeapon = context.weapon;
			const isMeleeAttack = meleeCategories.includes(attackerWeapon.category);

			// 检查攻击者的武器是否有Parry特效
			const attackerHasParry = attackerWeapon.weaponBonuses?.some(
				(bonus) => bonus.name === "Parry",
			);
			// 检查防守者当前使用的武器是否有Parry特效
			const defenderHasParry =
				context.targetWeaponSlot &&
				context.target?.weapons[
					context.targetWeaponSlot as keyof typeof context.target.weapons
				]?.weaponBonuses?.some((bonus) => bonus.name === "Parry");

			if (isMeleeAttack && (attackerHasParry || defenderHasParry)) {
				triggered = true;
			}
		}
		// 状态效果类特效（applyPostDamage）- 修复日志显示问题
		else if (processor.applyPostDamage && context.attacker) {
			// 这些特效需要在造成伤害时显示触发状态，但只有真正触发时才显示
			if (
				[
					"Motivation",
					"Slow",
					"Cripple",
					"Weaken",
					"Wither",
					"Eviscerate",
				].includes(bonus.name)
			) {
				// 这些特效总是有概率触发，先显示
				triggered = true;
			} else if (bonus.name === "Stun") {
				// Stun只有在真正触发时才显示（通过currentTriggeredEffects检查）
				// 注意：此时applyPostDamage还未执行，所以这里不会显示
				// 真正的Stun状态日志将在applyPostDamage后由战斗引擎添加
				triggered = false;
			} else if (
				bonus.name === "Disarm" &&
				(context.bodyPart.includes("hand") || context.bodyPart.includes("arm"))
			) {
				triggered = true;
			}
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

// ===== 困难难度特效 (33-48) =====

// 33. Berserk - 增加伤害但减少命中
const BerserkProcessor: WeaponBonusProcessor = {
	name: "Berserk",
	applyToDamage: (
		damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		return Math.round(damage * (1 + bonusValue / 100));
	},
	applyToHitChance: (
		hitChance: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		// 命中率减少伤害加成的一半
		return Math.max(0, hitChance - bonusValue / 2);
	},
};

// 34. Grace - 增加命中但减少伤害
const GraceProcessor: WeaponBonusProcessor = {
	name: "Grace",
	applyToHitChance: (
		hitChance: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		return Math.min(100, hitChance + bonusValue);
	},
	applyToDamage: (
		damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		// 伤害减少命中加成的一半
		return Math.round(damage * (1 - bonusValue / 200));
	},
};

// 35. Frenzy - 连击加成
const FrenzyProcessor: WeaponBonusProcessor = {
	name: "Frenzy",
	applyToDamage: (
		damage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		const comboCounter = context.attacker.comboCounter || 0;
		if (comboCounter > 0) {
			const multiplier = 1 + (comboCounter * bonusValue) / 100;
			return Math.round(damage * multiplier);
		}
		return damage;
	},
	applyToHitChance: (
		hitChance: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		const comboCounter = context.attacker.comboCounter || 0;
		if (comboCounter > 0) {
			return Math.min(100, hitChance + comboCounter * bonusValue);
		}
		return hitChance;
	},
};

// 36. Focus - 连续miss加成
const FocusProcessor: WeaponBonusProcessor = {
	name: "Focus",
	applyToHitChance: (
		hitChance: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		const missCounter = context.attacker.comboCounter || 0;
		if (missCounter > 0) {
			return Math.min(100, hitChance + missCounter * bonusValue);
		}
		return hitChance;
	},
};

// 37. Finale - 未使用回合伤害加成
const FinaleProcessor: WeaponBonusProcessor = {
	name: "Finale",
	applyToDamage: (
		damage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		const lastUsedTurn =
			context.attacker.lastUsedTurn?.[context.currentWeaponSlot] || 0;
		const idleTurns = Math.max(0, context.turn - lastUsedTurn - 1);
		if (idleTurns > 0) {
			const multiplier =
				1 + Math.min((idleTurns * bonusValue) / 100, (bonusValue * 5) / 100);
			return Math.round(damage * multiplier);
		}
		return damage;
	},
};

// 38. Wind-up - 蓄力伤害加成
const WindupProcessor: WeaponBonusProcessor = {
	name: "Wind-up",
	applyBeforeTurn: (
		attacker: FightPlayer,
		_target: FightPlayer,
		_weaponState: WeaponState,
		_context: DamageContext,
	) => {
		if (!attacker.windup) {
			attacker.windup = true;
			return { skip: true };
		}
		return undefined;
	},
	applyToDamage: (
		damage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		if (context.attacker.windup) {
			context.attacker.windup = false;
			return Math.round(damage * (1 + bonusValue / 100));
		}
		return damage;
	},
};

// 39. Rage - 多重攻击几率
const RageProcessor: WeaponBonusProcessor = {
	name: "Rage",
	applyPostDamage: (
		_attacker: FightPlayer,
		_target: FightPlayer,
		_damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		const rageChance = bonusValue / 100;
		if (Math.random() < rageChance) {
			addTriggeredEffect("Rage");
			const extraAttacks = Math.floor(Math.random() * 7) + 2; // 2-8 额外攻击
			return { extraAttacks };
		}
		return 0;
	},
};

// 40. Motivation - 属性叠加buff
const MotivationProcessor: WeaponBonusProcessor = {
	name: "Motivation",
	applyPostDamage: (
		attacker: FightPlayer,
		_target: FightPlayer,
		damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		if (damage > 0) {
			const motivationChance = bonusValue / 100;
			if (Math.random() < motivationChance) {
				initializeStatusEffectsV2(attacker);
				const wasAdded = addStatus(attacker, "motivation", 99, 5); // 最多叠加5层
				if (wasAdded) {
					addTriggeredEffect("Motivation");
				}
			}
		}
		return 0;
	},
};

// 41. Backstab - 敌人分心时双倍伤害
const BackstabProcessor: WeaponBonusProcessor = {
	name: "Backstab",
	applyToDamage: (
		damage: number,
		_bonusValue: number,
		context: DamageContext,
	) => {
		if (hasStatus(context.target, "distracted")) {
			addTriggeredEffect("Backstab");
			return Math.round(damage * 2);
		}
		return damage;
	},
};

// 42. Smurf - 等级差伤害加成 (简化为 Powerful 处理)
const SmurfProcessor: WeaponBonusProcessor = {
	name: "Smurf",
	applyToDamage: (
		damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		// 简化处理，直接按照 bonusValue 增加伤害
		return Math.round(damage * (1 + bonusValue / 100));
	},
};

// 43. Disarm - 缴械效果
const DisarmProcessor: WeaponBonusProcessor = {
	name: "Disarm",
	applyPostDamage: (
		_attacker: FightPlayer,
		target: FightPlayer,
		damage: number,
		bonusValue: number,
		context: DamageContext,
	) => {
		if (
			damage > 0 &&
			context.turn > 1 && // 首回合不生效
			(context.bodyPart.includes("hand") || context.bodyPart.includes("arm"))
		) {
			const slot = context.targetWeaponSlot;
			// 拳头和脚踢不可被缴械
			if (slot === "fists" || slot === "kick") {
				return 0;
			}

			const statusName = `disarm_${slot}` as keyof StatusEffectsV2;
			addTriggeredEffect("Disarm");
			initializeStatusEffectsV2(target);
			addStatus(target, statusName, bonusValue, 1);
		}
		return 0;
	},
};

// 44. Slow - 减速debuff
const SlowProcessor: WeaponBonusProcessor = {
	name: "Slow",
	applyPostDamage: (
		_attacker: FightPlayer,
		target: FightPlayer,
		damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		if (damage > 0) {
			const slowChance = bonusValue / 100;
			if (Math.random() < slowChance) {
				initializeStatusEffectsV2(target);
				const wasAdded = addStatus(target, "slow", 99, 3); // 持续99回合，最多叠加3层
				if (wasAdded) {
					addTriggeredEffect("Slow");
				}
			}
		}
		return 0;
	},
};

// 45. Cripple - 致残debuff
const CrippleProcessor: WeaponBonusProcessor = {
	name: "Cripple",
	applyPostDamage: (
		_attacker: FightPlayer,
		target: FightPlayer,
		damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		if (damage > 0) {
			const crippleChance = bonusValue / 100;
			if (Math.random() < crippleChance) {
				initializeStatusEffectsV2(target);
				const wasAdded = addStatus(target, "cripple", 99, 3); // 持续99回合，最多叠加3层
				if (wasAdded) {
					addTriggeredEffect("Cripple");
				}
			}
		}
		return 0;
	},
};

// 46. Weaken - 虚弱debuff
const WeakenProcessor: WeaponBonusProcessor = {
	name: "Weaken",
	applyPostDamage: (
		_attacker: FightPlayer,
		target: FightPlayer,
		damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		if (damage > 0) {
			const weakenChance = bonusValue / 100;
			if (Math.random() < weakenChance) {
				initializeStatusEffectsV2(target);
				const wasAdded = addStatus(target, "weaken", 99, 3); // 持续99回合，最多叠加3层
				if (wasAdded) {
					addTriggeredEffect("Weaken");
				}
			}
		}
		return 0;
	},
};

// 47. Wither - 衰弱debuff
const WitherProcessor: WeaponBonusProcessor = {
	name: "Wither",
	applyPostDamage: (
		_attacker: FightPlayer,
		target: FightPlayer,
		damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		if (damage > 0) {
			const witherChance = bonusValue / 100;
			if (Math.random() < witherChance) {
				initializeStatusEffectsV2(target);
				const wasAdded = addStatus(target, "wither", 99, 3); // 持续99回合，最多叠加3层
				if (wasAdded) {
					addTriggeredEffect("Wither");
				}
			}
		}
		return 0;
	},
};

// 48. Eviscerate - 受伤加重debuff
const EviscerateProcessor: WeaponBonusProcessor = {
	name: "Eviscerate",
	applyPostDamage: (
		_attacker: FightPlayer,
		target: FightPlayer,
		damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		if (damage > 0) {
			const eviscerateChance = bonusValue / 100;
			if (Math.random() < eviscerateChance) {
				initializeStatusEffectsV2(target);
				const wasAdded = addStatus(target, "eviscerate", 99, 1); // 持续99回合，最多叠加1层
				if (wasAdded) {
					addTriggeredEffect("Eviscerate");
				}
			}
		}
		return 0;
	},
};

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
		case "Rage":
			return "multiple attacks";
		case "Motivation":
			return "stats boosted";
		case "Backstab":
			return "backstab damage";
		case "Disarm":
			return "target disarmed";
		case "Slow":
			return "target slowed";
		case "Cripple":
			return "target crippled";
		case "Weaken":
			return "target weakened";
		case "Wither":
			return "target withered";
		case "Eviscerate":
			return "target eviscerated";
		case "Suppress":
			return "target suppressed";
		case "Bleed":
			return "target bleeding";
		case "Paralyzed":
			return "target paralyzed";
		default:
			return `${bonusName} triggered`;
	}
}

// 注册困难难度特效处理器
registerProcessor(BerserkProcessor);
registerProcessor(GraceProcessor);
registerProcessor(FrenzyProcessor);
registerProcessor(FocusProcessor);
registerProcessor(FinaleProcessor);
registerProcessor(WindupProcessor);
registerProcessor(RageProcessor);
registerProcessor(MotivationProcessor);
registerProcessor(BackstabProcessor);
registerProcessor(SmurfProcessor);
registerProcessor(DisarmProcessor);
registerProcessor(SlowProcessor);
registerProcessor(CrippleProcessor);
registerProcessor(WeakenProcessor);
registerProcessor(WitherProcessor);
registerProcessor(EviscerateProcessor);

// 新增：应用武器特效到伤害加成
export function applyWeaponBonusesToDamageBonus(
	baseDamageBonus: number,
	weapon: { weaponBonuses?: Array<{ name: string; value: number }> },
	context: DamageContext,
): number {
	if (!weapon.weaponBonuses) return baseDamageBonus;

	let modifiedDamageBonus = baseDamageBonus;

	for (const bonus of weapon.weaponBonuses) {
		const processor = getWeaponBonusProcessor(bonus.name);
		if (processor?.applyToDamageBonus) {
			modifiedDamageBonus = processor.applyToDamageBonus(
				modifiedDamageBonus,
				bonus.value,
				context,
			);
		}
	}

	return modifiedDamageBonus;
}

// 新增：应用武器特效到传入伤害（用于防御性特效如Parry）
export function applyWeaponBonusesToIncomingDamage(
	incomingDamage: number,
	weapon: { weaponBonuses?: Array<{ name: string; value: number }> },
	context: DamageContext,
): number {
	if (!weapon.weaponBonuses) return incomingDamage;

	let modifiedIncomingDamage = incomingDamage;

	for (const bonus of weapon.weaponBonuses) {
		const processor = getWeaponBonusProcessor(bonus.name);
		if (processor?.applyToIncomingDamage) {
			modifiedIncomingDamage = processor.applyToIncomingDamage(
				modifiedIncomingDamage,
				bonus.value,
				context,
			);
		}
	}

	return modifiedIncomingDamage;
}

// 49. Bleed - 流血DOT效果
const BleedProcessor: WeaponBonusProcessor = {
	name: "Bleed",
	applyPostDamage: (
		_attacker: FightPlayer,
		target: FightPlayer,
		damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		if (damage > 0) {
			const bleedChance = bonusValue / 100;
			if (Math.random() < bleedChance) {
				initializeStatusEffectsV2(target);
				const wasAdded = addStatus(target, "bleed", 9, 1); // 持续9回合，不叠加
				if (wasAdded) {
					addTriggeredEffect("Bleed");
					// 设置初始流血伤害基础值（45% 的造成伤害）
					if (target.statusEffectsV2?.bleed) {
						target.statusEffectsV2.bleed.baseDamage = Math.round(damage * 0.45);
					}
				}
			}
		}
		return 0;
	},
};

// 50. Suppress - 压制效果
const SuppressProcessor: WeaponBonusProcessor = {
	name: "Suppress",
	applyPostDamage: (
		_attacker: FightPlayer,
		target: FightPlayer,
		damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		if (damage > 0) {
			const suppressChance = bonusValue / 100;
			if (Math.random() < suppressChance) {
				initializeStatusEffectsV2(target);
				const wasAdded = addStatus(target, "suppress", 99, 1); // 持续99回合，不叠加
				if (wasAdded) {
					addTriggeredEffect("Suppress");
				}
			}
		}
		return 0;
	},
};

// 51. Paralyzed - 麻痹效果
const ParalyzedProcessor: WeaponBonusProcessor = {
	name: "Paralyzed",
	applyPostDamage: (
		_attacker: FightPlayer,
		target: FightPlayer,
		damage: number,
		bonusValue: number,
		_context: DamageContext,
	) => {
		if (damage > 0) {
			const paralyzedChance = bonusValue / 100;
			if (Math.random() < paralyzedChance) {
				initializeStatusEffectsV2(target);
				// 在模拟器中，我们简化为持续固定回合数而不是真实时间
				// 300秒 ≈ 5分钟，我们简化为持续10回合
				const wasAdded = addStatus(target, "paralyzed", 10, 1);
				if (wasAdded) {
					addTriggeredEffect("Paralyzed");
				}
			}
		}
		return 0;
	},
};

// 注册所有新的特效处理器
registerProcessor(BleedProcessor);
registerProcessor(SuppressProcessor);
registerProcessor(ParalyzedProcessor);
