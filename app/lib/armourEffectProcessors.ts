import { getArmourCoverage } from "./dataLoader";
import type {
	ArmourEffectProcessor,
	ArmourSet,
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
	applyToDamageBonus: (
		baseDamageBonus: number,
		effectValue: number,
		_context: DamageContext,
	) => {
		// 使用负数伤害加成来实现减伤效果，与 Powerful 使用相同的数学模型
		addTriggeredArmourEffect("Impenetrable");
		return baseDamageBonus - effectValue;
	},
};

// 2. Impregnable - 减少近战武器伤害
const ImpregnableProcessor: ArmourEffectProcessor = {
	name: "Impregnable",
	description: "减少来自近战武器的伤害",
	triggerCondition: (context: DamageContext) => {
		return context.currentWeaponSlot === "melee";
	},
	applyToDamageBonus: (
		baseDamageBonus: number,
		effectValue: number,
		_context: DamageContext,
	) => {
		// 使用负数伤害加成来实现减伤效果，与 Powerful 使用相同的数学模型
		addTriggeredArmourEffect("Impregnable");
		return baseDamageBonus - effectValue;
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
	applyToDamageBonus: (
		baseDamageBonus: number,
		effectValue: number,
		_context: DamageContext,
		_targetCurrentLife?: number,
		_targetMaxLife?: number,
	) => {
		// 使用负数伤害加成来实现减伤效果，与 Powerful 使用相同的数学模型
		addTriggeredArmourEffect("Insurmountable");
		return baseDamageBonus - effectValue;
	},
};

// 4. Impassable - 有概率使伤害变成0
const ImpassableProcessor: ArmourEffectProcessor = {
	name: "Impassable",
	description: "有概率完全免疫伤害",
	triggerCondition: () => true, // 总是可能触发
	applyToDamageBonus: (
		baseDamageBonus: number,
		effectValue: number,
		_context: DamageContext,
	) => {
		const blockChance = effectValue / 100;
		const random = Math.random();
		if (random < blockChance) {
			addTriggeredArmourEffect("Impassable");
			// 完全免疫：返回一个非常大的负数来确保最终伤害为0或负数
			// 这样 (1 + damageBonus / 100) 会变为0或负数，最终伤害将被Math.max限制为0
			return baseDamageBonus - 10000000;
		}
		return baseDamageBonus;
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
 * 应用护甲特效到伤害加成
 */
export function applyArmourEffectsToDamageBonus(
	baseDamageBonus: number,
	armourPiece: { effects?: Array<{ name: string; value: number }> },
	context: DamageContext,
	targetCurrentLife?: number,
	targetMaxLife?: number,
): number {
	if (!armourPiece.effects) return baseDamageBonus;

	let modifiedDamageBonus = baseDamageBonus;

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
		if (processor?.applyToDamageBonus && processor.triggerCondition) {
			// 检查触发条件
			if (
				processor.triggerCondition(context, targetCurrentLife, targetMaxLife)
			) {
				modifiedDamageBonus = processor.applyToDamageBonus(
					modifiedDamageBonus,
					effect.value,
					context,
					targetCurrentLife,
					targetMaxLife,
				);
			}
		}
	}

	return modifiedDamageBonus;
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

	// 获取当前回合实际触发的护甲特效
	const actuallyTriggered = getCurrentTurnTriggeredArmourEffects();

	for (const effect of armourPiece.effects) {
		const processor = getArmourEffectProcessor(effect.name);
		if (processor?.triggerCondition) {
			// 检查触发条件AND实际是否触发
			if (
				processor.triggerCondition(context, targetCurrentLife, targetMaxLife) &&
				actuallyTriggered.includes(effect.name)
			) {
				// 只显示真正触发的特效，与武器特效保持一致的简洁格式
				const effectText = `${effect.name}(${effect.value}%)`;
				triggeredEffects.push(effectText);
			}
		}
	}

	return triggeredEffects;
}

/**
 * 检查护甲是否覆盖特定身体部位
 */
export function hasArmourCoverage(
	bodyPart: string,
	armour: ArmourSet,
): boolean {
	const armourCoverage = getArmourCoverage();

	// 遍历所有护甲槽位，检查是否有任何护甲覆盖该身体部位
	for (const slot in armour) {
		const armourPiece = armour[slot as keyof ArmourSet];
		if (
			armourPiece &&
			armourCoverage[bodyPart] &&
			armourCoverage[bodyPart][armourPiece.type || ""]
		) {
			const coveragePercent = armourCoverage[bodyPart][armourPiece.type || ""];
			if (coveragePercent !== undefined && coveragePercent > 0) {
				return true; // 找到至少一个有覆盖的护甲
			}
		}
	}

	return false; // 没有护甲覆盖该身体部位
}

/**
 * 应用护甲特效到伤害加成（带护甲覆盖率检查）
 */
export function applyArmourEffectsToDamageBonusWithCoverage(
	baseDamageBonus: number,
	armourPiece: { effects?: Array<{ name: string; value: number }> },
	context: DamageContext,
	targetArmour: ArmourSet,
	targetCurrentLife?: number,
	targetMaxLife?: number,
): number {
	if (!armourPiece.effects) return baseDamageBonus;

	// 检查护甲是否覆盖被攻击的身体部位
	if (!hasArmourCoverage(context.bodyPart, targetArmour)) {
		return baseDamageBonus; // 没有护甲覆盖，护甲特效不生效
	}

	// 有护甲覆盖，应用护甲特效
	return applyArmourEffectsToDamageBonus(
		baseDamageBonus,
		armourPiece,
		context,
		targetCurrentLife,
		targetMaxLife,
	);
}
