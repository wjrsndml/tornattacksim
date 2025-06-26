import type { FightPlayer, StatusEffectsV2 } from "./fightSimulatorTypes";

/**
 * 状态效果管理器 - 统一管理新版状态效果
 */

/**
 * 初始化玩家的状态效果V2
 */
export function initializeStatusEffectsV2(player: FightPlayer): void {
	if (!player.statusEffectsV2) {
		player.statusEffectsV2 = {};
	}
}

/**
 * 清空玩家的所有状态效果V2 - 用于新战斗开始时
 */
export function clearAllStatusEffects(player: FightPlayer): void {
	player.statusEffectsV2 = {};
}

/**
 * 添加状态效果
 */
export function addStatus(
	player: FightPlayer,
	statusName: keyof StatusEffectsV2,
	turns: number,
	maxStacks: number = 1,
): boolean {
	initializeStatusEffectsV2(player);

	const current = player.statusEffectsV2?.[statusName];
	if (current) {
		// 刷新回合数，增加层数（不超过上限）
		current.turns = turns;
		const oldStacks = current.stacks || 1;
		current.stacks = Math.min(maxStacks, oldStacks + 1);
		// 返回是否增加了新层
		return current.stacks > oldStacks;
	} else {
		// 新增状态
		if (player.statusEffectsV2) {
			player.statusEffectsV2[statusName] = { turns, stacks: 1 };
		}
		return true; // 新增状态总是返回 true
	}
}

/**
 * 获取状态层数
 */
export function getStacks(
	player: FightPlayer,
	statusName: keyof StatusEffectsV2,
): number {
	return player.statusEffectsV2?.[statusName]?.stacks || 0;
}

/**
 * 获取状态剩余回合数
 */
export function getTurns(
	player: FightPlayer,
	statusName: keyof StatusEffectsV2,
): number {
	return player.statusEffectsV2?.[statusName]?.turns || 0;
}

/**
 * 检查是否有某个状态
 */
export function hasStatus(
	player: FightPlayer,
	statusName: keyof StatusEffectsV2,
): boolean {
	return getTurns(player, statusName) > 0;
}

/**
 * 移除状态效果
 */
export function removeStatus(
	player: FightPlayer,
	statusName: keyof StatusEffectsV2,
): void {
	if (player.statusEffectsV2?.[statusName]) {
		delete player.statusEffectsV2[statusName];
	}
}

/**
 * 递减所有状态效果的回合数，移除过期状态
 */
export function decrementStatusEffects(player: FightPlayer): void {
	if (!player.statusEffectsV2) return;

	const statusesToRemove: (keyof StatusEffectsV2)[] = [];

	for (const [statusName, status] of Object.entries(player.statusEffectsV2)) {
		if (status && status.turns > 0) {
			status.turns--;
			if (status.turns <= 0) {
				statusesToRemove.push(statusName as keyof StatusEffectsV2);
			}
		}
	}

	// 移除过期状态
	for (const statusName of statusesToRemove) {
		removeStatus(player, statusName);
	}
}

/**
 * 应用状态效果对属性的修改
 */
export function applyStatusEffectsToStats(
	player: FightPlayer,
	baseStats: {
		strength: number;
		speed: number;
		defense: number;
		dexterity: number;
	},
): { strength: number; speed: number; defense: number; dexterity: number } {
	if (!player.statusEffectsV2) return baseStats;

	const modifiedStats = { ...baseStats };

	// Slow: 减少速度 25% 每层
	const slowStacks = getStacks(player, "slow");
	if (slowStacks > 0) {
		modifiedStats.speed = Math.round(modifiedStats.speed * 0.75 ** slowStacks);
	}

	// Cripple: 减少敏捷 25% 每层
	const crippleStacks = getStacks(player, "cripple");
	if (crippleStacks > 0) {
		modifiedStats.dexterity = Math.round(
			modifiedStats.dexterity * 0.75 ** crippleStacks,
		);
	}

	// Weaken: 减少防御 25% 每层
	const weakenStacks = getStacks(player, "weaken");
	if (weakenStacks > 0) {
		modifiedStats.defense = Math.round(
			modifiedStats.defense * 0.75 ** weakenStacks,
		);
	}

	// Wither: 减少力量 25% 每层
	const witherStacks = getStacks(player, "wither");
	if (witherStacks > 0) {
		modifiedStats.strength = Math.round(
			modifiedStats.strength * 0.75 ** witherStacks,
		);
	}

	// Motivation: 增加所有属性 10% 每层
	const motivationStacks = getStacks(player, "motivation");
	if (motivationStacks > 0) {
		const multiplier = 1.1 ** motivationStacks;
		modifiedStats.strength = Math.round(modifiedStats.strength * multiplier);
		modifiedStats.speed = Math.round(modifiedStats.speed * multiplier);
		modifiedStats.defense = Math.round(modifiedStats.defense * multiplier);
		modifiedStats.dexterity = Math.round(modifiedStats.dexterity * multiplier);
	}

	return modifiedStats;
}

/**
 * 检查玩家是否应该跳过回合（由于眩晕或压制）
 */
export function shouldSkipTurn(player: FightPlayer): boolean {
	if (!player.statusEffectsV2) return false;

	// Stun: 完全跳过回合
	if (hasStatus(player, "stun")) {
		return true;
	}

	// Suppress: 25% 几率跳过回合
	if (hasStatus(player, "suppress")) {
		return Math.random() < 0.25;
	}

	return false;
}

/**
 * 应用 Eviscerate 效果增加受到的伤害
 */
export function applyEviscerateToIncomingDamage(
	player: FightPlayer,
	baseDamage: number,
): number {
	const eviscerateStacks = getStacks(player, "eviscerate");
	if (eviscerateStacks > 0) {
		// 每层增加额外伤害，假设基础值为 25%
		const multiplier = 1 + eviscerateStacks * 0.25;
		return Math.round(baseDamage * multiplier);
	}
	return baseDamage;
}
