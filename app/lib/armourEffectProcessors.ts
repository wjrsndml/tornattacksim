import type {
	ArmourEffectProcessor,
	DamageContext,
} from "./fightSimulatorTypes";

// 用于记录当前回合触发的护甲特效
let currentTriggeredArmourEffects: string[] = [];

/**
 * 清空触发的护甲特效记录
 */
export function clearTriggeredArmourEffects() {
	currentTriggeredArmourEffects = [];
}

/**
 * 添加触发的护甲特效
 */
export function addTriggeredArmourEffect(effectName: string) {
	if (!currentTriggeredArmourEffects.includes(effectName)) {
		currentTriggeredArmourEffects.push(effectName);
	}
}

/**
 * 获取当前回合触发的护甲特效
 */
export function getCurrentTurnTriggeredArmourEffects(): string[] {
	return [...currentTriggeredArmourEffects];
}

// 武器类别定义
// const primarySecondaryCategories = ["PI", "RF", "SG", "SM", "MG", "HA"];
// const meleeCategories = ["SL", "CL", "PS", "MK"];

// 1. Impenetrable - 减少主武器或副武器伤害
const ImpenetrableProcessor: ArmourEffectProcessor = {
	name: "Impenetrable",
	description: "减少来自主武器或副武器的伤害",
	triggerCondition: (context: DamageContext) => {
		return (
			context.currentWeaponSlot === "primary" ||
			context.currentWeaponSlot === "secondary"
		);
	},
	applyToDamage: (
		damage: number,
		effectValue: number,
		_context: DamageContext,
	) => {
		const reduction = effectValue / 100;
		const reducedDamage = damage * (1 - reduction);
		addTriggeredArmourEffect("Impenetrable");
		return Math.round(reducedDamage);
	},
};

// 2. Impregnable - 减少近战武器伤害
const ImpregnableProcessor: ArmourEffectProcessor = {
	name: "Impregnable",
	description: "减少来自近战武器的伤害",
	triggerCondition: (context: DamageContext) => {
		return context.currentWeaponSlot === "melee";
	},
	applyToDamage: (
		damage: number,
		effectValue: number,
		_context: DamageContext,
	) => {
		const reduction = effectValue / 100;
		const reducedDamage = damage * (1 - reduction);
		addTriggeredArmourEffect("Impregnable");
		return Math.round(reducedDamage);
	},
};

// 3. Insurmountable - 在血量小于等于1/4时减少伤害
const InsurmountableProcessor: ArmourEffectProcessor = {
	name: "Insurmountable",
	description: "在血量≤25%时减少受到的伤害",
	triggerCondition: (
		_context: DamageContext,
		targetCurrentLife?: number,
		targetMaxLife?: number,
	) => {
		if (targetCurrentLife === undefined || targetMaxLife === undefined) {
			return false;
		}
		return targetCurrentLife <= targetMaxLife * 0.25;
	},
	applyToDamage: (
		damage: number,
		effectValue: number,
		_context: DamageContext,
		_targetCurrentLife?: number,
		_targetMaxLife?: number,
	) => {
		const reduction = effectValue / 100;
		const reducedDamage = damage * (1 - reduction);
		addTriggeredArmourEffect("Insurmountable");
		return Math.round(reducedDamage);
	},
};

// 4. Impassable - 有概率使伤害变成0
const ImpassableProcessor: ArmourEffectProcessor = {
	name: "Impassable",
	description: "有概率完全免疫伤害",
	triggerCondition: () => true, // 总是可能触发
	applyToDamage: (
		damage: number,
		effectValue: number,
		_context: DamageContext,
	) => {
		const blockChance = effectValue / 100;
		const random = Math.random();
		if (random < blockChance) {
			addTriggeredArmourEffect("Impassable");
			return 0;
		}
		return damage;
	},
};

// 护甲特效处理器映射
const armourEffectProcessors: { [key: string]: ArmourEffectProcessor } = {
	Impenetrable: ImpenetrableProcessor,
	Impregnable: ImpregnableProcessor,
	Insurmountable: InsurmountableProcessor,
	Impassable: ImpassableProcessor,
};

/**
 * 获取护甲特效处理器
 */
export function getArmourEffectProcessor(
	effectName: string,
): ArmourEffectProcessor | undefined {
	return armourEffectProcessors[effectName];
}

/**
 * 应用护甲特效到伤害
 */
export function applyArmourEffectsToDamage(
	damage: number,
	armourPiece: { effects?: Array<{ name: string; value: number }> },
	context: DamageContext,
	targetCurrentLife?: number,
	targetMaxLife?: number,
): number {
	if (!armourPiece.effects) return damage;

	let modifiedDamage = damage;

	// 按优先级应用特效：Impenetrable/Impregnable -> Insurmountable -> Impassable
	const sortedEffects = [...armourPiece.effects].sort((a, b) => {
		const priority = {
			Impenetrable: 1,
			Impregnable: 1,
			Insurmountable: 2,
			Impassable: 3,
		};
		return (
			(priority[a.name as keyof typeof priority] || 999) -
			(priority[b.name as keyof typeof priority] || 999)
		);
	});

	for (const effect of sortedEffects) {
		const processor = getArmourEffectProcessor(effect.name);
		if (processor?.applyToDamage && processor.triggerCondition) {
			// 检查触发条件
			if (
				processor.triggerCondition(context, targetCurrentLife, targetMaxLife)
			) {
				modifiedDamage = processor.applyToDamage(
					modifiedDamage,
					effect.value,
					context,
					targetCurrentLife,
					targetMaxLife,
				);
			}
		}
	}

	return modifiedDamage;
}

/**
 * 获取护甲特效的显示文本
 */
export function getArmourEffectText(effectName: string, value: number): string {
	const effectTexts: { [key: string]: string } = {
		Impenetrable: `减少${value}%主/副武器伤害`,
		Impregnable: `减少${value}%近战武器伤害`,
		Insurmountable: `低血量时减少${value}%伤害`,
		Impassable: `${value}%概率完全免伤`,
	};
	return effectTexts[effectName] || `${effectName}(${value}%)`;
}

/**
 * 获取当前护甲特效触发信息（用于战斗日志）
 */
export function getTriggeredArmourEffects(
	armourPiece: { effects?: Array<{ name: string; value: number }> },
	context: DamageContext,
	targetCurrentLife?: number,
	targetMaxLife?: number,
): string[] {
	if (!armourPiece.effects) return [];

	const triggeredEffects: string[] = [];

	for (const effect of armourPiece.effects) {
		const processor = getArmourEffectProcessor(effect.name);
		if (processor?.triggerCondition) {
			if (
				processor.triggerCondition(context, targetCurrentLife, targetMaxLife)
			) {
				let effectText = `${effect.name}(${effect.value}%)`;
				if (currentTriggeredArmourEffects.includes(effect.name)) {
					effectText += ` - ${getArmourEffectText(effect.name, effect.value)}`;
				}
				triggeredEffects.push(effectText);
			}
		}
	}

	return triggeredEffects;
}
