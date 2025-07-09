import {
	applyArmourEffectsToDamage,
	clearTriggeredArmourEffects,
	// getCurrentTurnTriggeredArmourEffects,
	getTriggeredArmourEffects,
} from "./armourEffectProcessors";
import { canArmourBlock, getArmourCoverage } from "./dataLoader";
import type {
	ActionResults,
	ArmourSet,
	BattleStatsCollector,
	DOTEffects,
	FightPlayer,
	FightResults,
	ModData,
	StatusEffects,
	StatusEffectsV2,
	TempEffects,
	TurnResults,
	WeaponData,
	WeaponSettings,
	WeaponState,
} from "./fightSimulatorTypes";
import {
	// addStatus,
	applyEviscerateToIncomingDamage,
	applyStatusEffectsToStats,
	clearAllStatusEffects,
	decrementStatusEffects,
	hasStatus,
	initializeStatusEffectsV2,
	shouldSkipTurn,
} from "./statusEffectManager";
import {
	applyWeaponBonusesBeforeTurn,
	applyWeaponBonusesPostDamage,
	applyWeaponBonusesToAmmo,
	applyWeaponBonusesToArmour,
	applyWeaponBonusesToCritical,
	applyWeaponBonusesToDamage,
	applyWeaponBonusesToDamageBonus,
	applyWeaponBonusesToHitChance,
	applyWeaponBonusesToIncomingDamage,
	applyWeaponBonusesToStats,
	applyWeaponBonusesToWeaponState,
	clearTriggeredEffects,
	getCurrentTurnTriggeredEffects,
	getTriggeredBonuses,
} from "./weaponBonusProcessors";

// 常量定义
export const PARTIAL_FREQUENCY = 10000;
export const MATH_LOG_14_UNDER_50 = 50 / Math.log(14);
export const MATH_LOG_32_UNDER_50 = 50 / Math.log(32);

// 类型保护函数：检查武器是否有弹药系统
function hasAmmoSystem(
	weaponState: WeaponState[keyof WeaponState],
): weaponState is WeaponState["primary"] | WeaponState["secondary"] {
	return (
		typeof weaponState === "object" &&
		"ammoleft" in weaponState &&
		typeof weaponState.ammoleft === "number"
	);
}

// 全局变量
// const _players: { [key: string]: FightPlayer } = {}; // 暂时未使用
// let _h: FightPlayer, _v: FightPlayer; // 暂时未使用

// 改装数据缓存
let cachedModData: { [key: string]: ModData } = {};

// 统计收集器全局变量
let battleStatsCollector: BattleStatsCollector | null = null;

/**
 * 获取弹药显示名称
 */
function getAmmoDisplayName(ammo: string | undefined): string {
	if (!ammo || ammo === "Standard") {
		return "standard";
	}
	return ammo;
}

/**
 * 设置改装数据
 */
export function setModData(modData: { [key: string]: ModData }) {
	cachedModData = modData;
}

// Add the AttackLogInfo interface
interface AttackLogInfo {
	attacker: string;
	target: string;
	weapon: string;
	bodyPart: string;
	originalDamage: number;
	bonusText: string;
	rounds?: number;
	ammo?: string;
	attackType?: "melee" | "ranged";
	armourEffectsText?: string; // 新增：护甲特效信息
}

/**
 * 主要的战斗函数
 * @param hero 英雄玩家数据
 * @param villain 反派玩家数据
 * @param results 当前战斗结果
 * @returns 更新后的战斗结果
 */
export function fight(
	hero: FightPlayer,
	villain: FightPlayer,
	results: FightResults,
): FightResults {
	// 初始化统计收集器
	battleStatsCollector = initializeStatsCollector(hero.name, villain.name);

	// 清空所有状态效果，确保每次新战斗开始时状态为空
	clearAllStatusEffects(hero);
	clearAllStatusEffects(villain);

	// 重置武器特效相关状态，确保每次战斗都是全新开始
	hero.comboCounter = 0;
	hero.lastUsedTurn = {};
	hero.windup = false;
	villain.comboCounter = 0;
	villain.lastUsedTurn = {};
	villain.windup = false;

	const hPrim = hero.weapons.primary;
	const hSec = hero.weapons.secondary;
	const vPrim = villain.weapons.primary;
	const vSec = villain.weapons.secondary;

	const hModsPrim = applyPMbefore(hero, hPrim.mods || []);
	const hModsSec = applyPMbefore(hero, hSec.mods || []);
	const vModsPrim = applyPMbefore(villain, vPrim.mods || []);
	const vModsSec = applyPMbefore(villain, vSec.mods || []);

	let hCL = hero.life;
	let vCL = villain.life;
	let turns = 0;
	let fightLogMessage: string[] = [];

	// status effects: demoralize, freeze, wither, slow, weaken, cripple
	// [0]: dealt, [1]: received
	let hSE: StatusEffects = [
		[0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0],
	];
	let vSE: StatusEffects = [
		[0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0],
	];

	// DOT effects: Burn, Poison, Lacerate, Severe Burn
	let hDOT: DOTEffects = [
		[0, 0],
		[0, 0],
		[0, 0],
		[0, 0],
	];
	let vDOT: DOTEffects = [
		[0, 0],
		[0, 0],
		[0, 0],
		[0, 0],
	];

	let h_set = JSON.parse(JSON.stringify(hero.attackSettings));
	let v_set = JSON.parse(JSON.stringify(villain.defendSettings));
	let h_temps: TempEffects = [];
	let v_temps: TempEffects = [];

	let hWS: WeaponState = {
		primary: {
			ammoleft: Math.round((hPrim.clipsize || 0) * (hModsPrim[0] || 1)),
			maxammo: Math.round((hPrim.clipsize || 0) * (hModsPrim[0] || 1)),
			clipsleft: hModsPrim[1] || 3,
			rof: [
				Math.max(
					1,
					Math.round((hPrim.rateoffire?.[0] || 1) * (hModsPrim[2] || 1)),
				),
				Math.max(
					1,
					Math.round((hPrim.rateoffire?.[1] || 1) * (hModsPrim[2] || 1)),
				),
			],
		},
		secondary: {
			ammoleft: Math.round((hSec.clipsize || 0) * (hModsSec[0] || 1)),
			maxammo: Math.round((hSec.clipsize || 0) * (hModsSec[0] || 1)),
			clipsleft: hModsSec[1] || 3,
			rof: [
				Math.max(
					1,
					Math.round((hSec.rateoffire?.[0] || 1) * (hModsSec[2] || 1)),
				),
				Math.max(
					1,
					Math.round((hSec.rateoffire?.[1] || 1) * (hModsSec[2] || 1)),
				),
			],
		},
		melee: {
			ammoleft: "n/a",
			storageused: false,
		},
		temporary: {
			ammoleft: "n/a",
			initialsetting: h_set.temporary.setting,
		},
	};

	let vWS: WeaponState = {
		primary: {
			ammoleft: Math.round((vPrim.clipsize || 0) * (vModsPrim[0] || 1)),
			maxammo: Math.round((vPrim.clipsize || 0) * (vModsPrim[0] || 1)),
			clipsleft: vModsPrim[1] || 3,
			rof: [
				Math.max(
					1,
					Math.round((vPrim.rateoffire?.[0] || 1) * (vModsPrim[2] || 1)),
				),
				Math.max(
					1,
					Math.round((vPrim.rateoffire?.[1] || 1) * (vModsPrim[2] || 1)),
				),
			],
		},
		secondary: {
			ammoleft: Math.round((vSec.clipsize || 0) * (vModsSec[0] || 1)),
			maxammo: Math.round((vSec.clipsize || 0) * (vModsSec[0] || 1)),
			clipsleft: vModsSec[1] || 3,
			rof: [
				Math.max(
					1,
					Math.round((vSec.rateoffire?.[0] || 1) * (vModsSec[2] || 1)),
				),
				Math.max(
					1,
					Math.round((vSec.rateoffire?.[1] || 1) * (vModsSec[2] || 1)),
				),
			],
		},
		melee: {
			ammoleft: "n/a",
			storageused: false,
		},
		temporary: {
			ammoleft: "n/a",
			initialsetting: v_set.temporary.setting,
		},
	};

	// 应用武器特效对武器状态的修改（如Specialist特效）
	hWS = applyWeaponBonusesToWeaponState(hWS, hPrim);
	hWS = applyWeaponBonusesToWeaponState(hWS, hSec);
	vWS = applyWeaponBonusesToWeaponState(vWS, vPrim);
	vWS = applyWeaponBonusesToWeaponState(vWS, vSec);

	// 战斗循环，最多25回合
	for (let i = 0; i < 25; i++) {
		turns += 1;

		const turnReturn = takeTurns(
			hero,
			villain,
			turns,
			hCL,
			vCL,
			hWS,
			vWS,
			hSE,
			vSE,
			hDOT,
			vDOT,
			h_set,
			v_set,
			h_temps,
			v_temps,
		);
		fightLogMessage = fightLogMessage.concat(turnReturn[0]);
		hCL = turnReturn[1];
		vCL = turnReturn[2];
		hWS = turnReturn[3];
		vWS = turnReturn[4];
		hSE = turnReturn[5];
		vSE = turnReturn[6];
		hDOT = turnReturn[7];
		vDOT = turnReturn[8];
		h_set = turnReturn[9];
		v_set = turnReturn[10];
		h_temps = turnReturn[11];
		v_temps = turnReturn[12];

		if (hCL <= 0) {
			results[1] += 1; // villain wins
			fightLogMessage.push(`${villain.name} won. `);
			break;
		} else if (vCL <= 0) {
			results[0] += 1; // hero wins
			fightLogMessage.push(`${hero.name} won. `);
			break;
		}
	}

	if (turns === 25 && hCL > 0 && vCL > 0) {
		fightLogMessage.push("Stalemate.");
		results[2] += 1;
	}

	results[3] += turns;
	// 累积剩余生命值（允许负值，用于统计过量伤害）
	results[4] += hCL;
	results[5] += vCL;
	results[6] = fightLogMessage;

	// 确保生命值不为负数，死亡时记录为0
	const finalHeroLife = hCL;
	const finalVillainLife = vCL;

	if (results[8][finalHeroLife] === undefined) {
		results[8][finalHeroLife] = 1;
	} else {
		results[8][finalHeroLife] += 1;
	}

	if (results[9][finalVillainLife] === undefined) {
		results[9][finalVillainLife] = 1;
	} else {
		results[9][finalVillainLife] += 1;
	}

	// 获取详细统计数据并添加到返回结果中
	const detailedStats = getFinalBattleStats();
	results[10] = detailedStats;

	return results;
}

/**
 * 处理一个回合的双方行动
 */
export function takeTurns(
	h: FightPlayer,
	v: FightPlayer,
	turn: number,
	hCL: number,
	vCL: number,
	hWS: WeaponState,
	vWS: WeaponState,
	hSE: StatusEffects,
	vSE: StatusEffects,
	hDOT: DOTEffects,
	vDOT: DOTEffects,
	h_set: WeaponSettings,
	v_set: WeaponSettings,
	h_temps: TempEffects,
	v_temps: TempEffects,
): TurnResults {
	let log: string[] = [];

	// 初始化状态效果V2
	initializeStatusEffectsV2(h);
	initializeStatusEffectsV2(v);

	// 在递减回合数之前处理 Bleed DOT 伤害
	const applyBleedDamage = (
		player: FightPlayer,
		currentLife: number,
		logArr: string[],
	): number => {
		if (hasStatus(player, "bleed")) {
			const bleedStatus = player.statusEffectsV2?.bleed;
			if (bleedStatus?.baseDamage && bleedStatus.turns > 0) {
				// 伤害按剩余回合线性递减
				const dmg = Math.round(
					bleedStatus.baseDamage * (bleedStatus.turns / 9),
				);
				const maxPossible = currentLife - 1;
				const actualDMG = dmg > maxPossible ? maxPossible : dmg;
				if (actualDMG > 0) {
					logArr.push(`${player.name} suffers ${actualDMG} bleeding damage`);
					return currentLife - actualDMG;
				}
			}
		}
		return currentLife;
	};

	hCL = applyBleedDamage(h, hCL, log);
	vCL = applyBleedDamage(v, vCL, log);

	// 递减状态效果回合数
	decrementStatusEffects(h);
	decrementStatusEffects(v);

	// 英雄行动 - 在轮到英雄时检查是否跳过
	const hShouldSkip = shouldSkipTurn(h);
	if (hShouldSkip) {
		log.push(`${h.name} is stunned/suppressed and skips their turn`);
	}

	if (!hShouldSkip) {
		const h_action = action(
			[],
			h,
			v,
			hCL,
			vCL,
			hWS,
			vWS,
			hSE,
			vSE,
			hDOT,
			vDOT,
			h_set,
			v_set,
			h_temps,
			v_temps,
			turn,
		);
		log = log.concat(h_action[0]);
		hCL = h_action[1];
		vCL = h_action[2];
		hWS = h_action[3];
		vWS = h_action[4];
		hSE = h_action[5];
		vSE = h_action[6];
		hDOT = h_action[7];
		vDOT = h_action[8];
		h_set = h_action[9];
		v_set = h_action[10];
		h_temps = h_action[11];
		v_temps = h_action[12];
	}

	if (vCL <= 0) {
		return [
			log,
			hCL,
			vCL,
			hWS,
			vWS,
			hSE,
			vSE,
			hDOT,
			vDOT,
			h_set,
			v_set,
			h_temps,
			v_temps,
		];
	}

	// 反派行动 - 检查是否跳过回合
	const vShouldSkip = shouldSkipTurn(v);
	if (vShouldSkip) {
		log.push(`${v.name} is stunned/suppressed and skips their turn`);
	}

	// 检查是否触发了Home Run效果，如果是且反派要使用临时武器，则阻止攻击
	let vShouldSkipDueToHomeRun = false;
	if (!vShouldSkip && getCurrentTurnTriggeredEffects().includes("Home Run")) {
		const vChosenWeapon = chooseWeapon(v, v_set);
		if (vChosenWeapon === "temporary") {
			vShouldSkipDueToHomeRun = true;
			log.push(
				`${v.name}'s temporary weapon attack was deflected by Home Run!`,
			);
			// 将临时武器设置为不可用，防止后续回合使用
			v_set.temporary.setting = 0;
		}
	}

	if (!vShouldSkip && !vShouldSkipDueToHomeRun) {
		const v_action = action(
			[],
			v,
			h,
			vCL,
			hCL,
			vWS,
			hWS,
			vSE,
			hSE,
			vDOT,
			hDOT,
			v_set,
			h_set,
			v_temps,
			h_temps,
			turn,
		);
		log = log.concat(v_action[0]);
		vCL = v_action[1];
		hCL = v_action[2];
		vWS = v_action[3];
		hWS = v_action[4];
		vSE = v_action[5];
		hSE = v_action[6];
		vDOT = v_action[7];
		hDOT = v_action[8];
		v_set = v_action[9];
		h_set = v_action[10];
		v_temps = v_action[11];
		h_temps = v_action[12];
	}

	return [
		log,
		hCL,
		vCL,
		hWS,
		vWS,
		hSE,
		vSE,
		hDOT,
		vDOT,
		h_set,
		v_set,
		h_temps,
		v_temps,
	];
}

/**
 * 选择武器函数
 */
export function chooseWeapon(
	p: FightPlayer,
	weaponSettings: WeaponSettings,
): string {
	// 辅助函数：判定某个槽位是否被缴械
	const isSlotDisarmed = (slot: string): boolean => {
		return hasStatus(p, `disarm_${slot}` as keyof StatusEffectsV2);
	};

	const allSlots = ["primary", "secondary", "melee", "temporary"] as const;

	// 如果所有主副近战临时武器都被缴械，则只能使用拳头/脚踢
	if (allSlots.every((s) => isSlotDisarmed(s))) {
		return p.perks.education.preferKick ? "kick" : "fists";
	}

	// 根据攻击或防御姿态选择武器，但需跳过已被缴械的槽位

	if (p.position === "attack") {
		let weaponChoice: string = "primary";
		let settingInteger = 5;

		for (const weapon in weaponSettings) {
			if (isSlotDisarmed(weapon)) continue; // 跳过被缴械的武器
			const weaponSetting = weaponSettings[weapon];
			if (weaponSetting && weaponSetting.setting !== 0) {
				if (weaponSetting.setting < settingInteger) {
					settingInteger = weaponSetting.setting;
					weaponChoice = weapon;
				}
			}
		}

		// 如果没有可用武器（全部设置为0或被缴械），使用拳头/脚踢
		if (settingInteger === 5) {
			return p.perks.education.preferKick ? "kick" : "fists";
		}

		return weaponChoice;
	} else if (p.position === "defend") {
		let weaponChoice: string = "primary";
		const weaponArray: string[] = [];
		let settingSum = 0;

		for (const weapon in weaponSettings) {
			if (isSlotDisarmed(weapon)) continue; // 跳过被缴械的武器
			const weaponSetting = weaponSettings[weapon as keyof WeaponSettings];
			if (weaponSetting && !Number.isNaN(weaponSetting.setting)) {
				settingSum += weaponSetting.setting;
				if (weaponSetting.setting !== 0) {
					weaponArray.push(weapon);
				}
			}
		}

		// 如果没有可用武器，则使用拳脚
		if (settingSum === 0) {
			return p.perks.education.preferKick ? "kick" : "fists";
		}

		const rng = Math.ceil(Math.random() * settingSum + 1);
		const primarySetting = isSlotDisarmed("primary")
			? 0
			: weaponSettings.primary?.setting || 0;
		const secondarySetting = isSlotDisarmed("secondary")
			? 0
			: weaponSettings.secondary?.setting || 0;
		const meleeSetting = isSlotDisarmed("melee")
			? 0
			: weaponSettings.melee?.setting || 0;
		// const temporarySetting = isSlotDisarmed("temporary")
		// 	? 0
		// 	: weaponSettings.temporary?.setting || 0;

		if (rng >= 1 && rng <= 1 + primarySetting) {
			weaponChoice = "primary";
		} else if (
			rng > 1 + primarySetting &&
			rng <= 1 + primarySetting + secondarySetting
		) {
			weaponChoice = "secondary";
		} else if (
			rng > 1 + primarySetting + secondarySetting &&
			rng <= 1 + primarySetting + secondarySetting + meleeSetting
		) {
			weaponChoice = "melee";
		} else {
			weaponChoice = "temporary";
		}

		// 最终检查选中的槽位是否被缴械，若被缴械则回退到拳脚
		if (isSlotDisarmed(weaponChoice)) {
			return p.perks.education.preferKick ? "kick" : "fists";
		}

		return weaponChoice;
	}

	return "primary";
}

/**
 * 计算最大伤害
 */
export function maxDamage(strength: number): number {
	return (
		7 * Math.log10(strength / 10) ** 2 + 27 * Math.log10(strength / 10) + 30
	);
}

/**
 * 计算伤害减免
 */
export function damageMitigation(defense: number, strength: number): number {
	const ratio = defense / strength;
	let mitigation: number;

	if (ratio >= 14) {
		mitigation = 100; // 完全免疫伤害
	} else if (ratio >= 1 && ratio < 14) {
		mitigation = 50 + MATH_LOG_14_UNDER_50 * Math.log(ratio);
	} else if (ratio > 1 / 32 && ratio < 1) {
		mitigation = 50 + MATH_LOG_32_UNDER_50 * Math.log(ratio);
	} else {
		mitigation = 0;
	}

	return mitigation;
}

/**
 * 计算武器伤害倍数 - 按照原版复杂公式实现
 */
export function weaponDamageMulti(
	displayDamage: number,
	perks: number,
): number {
	let baseDamage =
		(Math.exp((displayDamage + 0.005) / 19 + 2) -
			13 +
			(Math.exp((displayDamage - 0.005) / 19 + 2) - 13)) /
		2;
	baseDamage = baseDamage * (1 + perks / 100);
	const damageMulti = 1 + Math.log(Math.round(baseDamage));
	return damageMulti;
}

/**
 * 计算命中几率
 */
export function hitChance(speed: number, dexterity: number): number {
	const ratio = speed / dexterity;
	let hitChance: number;

	if (ratio >= 64) {
		hitChance = 100;
	} else if (ratio >= 1 && ratio < 64) {
		hitChance = 100 - (50 / 7) * (8 * Math.sqrt(1 / ratio) - 1);
	} else if (ratio > 1 / 64 && ratio < 1) {
		hitChance = (50 / 7) * (8 * Math.sqrt(ratio) - 1);
	} else {
		hitChance = 0;
	}

	return hitChance;
}

/**
 * 应用精准度修正
 */
export function applyAccuracy(
	hitChance: number,
	displayAccuracy: number,
	perks: { bonus: number },
): number {
	let accuracy = displayAccuracy + perks.bonus;
	if (accuracy < 0) {
		accuracy = 0;
	}

	if (hitChance > 50) {
		hitChance = hitChance + ((accuracy - 50) / 50) * (100 - hitChance);
	} else {
		hitChance = hitChance + ((accuracy - 50) / 50) * hitChance;
	}

	return hitChance;
}

/**
 * 判断是否命中
 */
export function hitOrMiss(hitChance: number): boolean {
	const rng = Math.floor(Math.random() * 10000 + 1);
	return rng >= 1 && rng <= 1 + hitChance * 100;
}

/**
 * 选择攻击部位
 */
export function selectBodyPart(
	x: FightPlayer,
	critChance: number,
): [string, number] {
	let bodyPart: [string, number] = ["chest", 1 / 1.75];

	const rng = Math.floor(Math.random() * 1000 + 1);
	if (rng >= 1 && rng <= 1 + critChance * 10) {
		// 成功暴击
		const rng2 = Math.floor(Math.random() * 100 + 1);
		if (rng2 >= 1 && rng2 <= 11) {
			bodyPart = ["heart", 1];
		} else if (rng2 > 11 && rng2 <= 21) {
			bodyPart = ["throat", 1];
			// 教育技能：颈部伤害加成
			if (x.perks.education.neckdamage) {
				bodyPart[1] *= 1.1;
			}
		} else if (rng2 > 21 && rng2 <= 101) {
			bodyPart = ["head", 1];
		}
	} else {
		// 非暴击
		const rng2 = Math.floor(Math.random() * 100 + 1);
		if (rng2 >= 1 && rng2 <= 6) {
			bodyPart = ["groin", 1 / 1.75];
		} else if (rng2 > 6 && rng2 <= 11) {
			bodyPart = ["left arm", 1 / 3.5];
		} else if (rng2 > 11 && rng2 <= 16) {
			bodyPart = ["right arm", 1 / 3.5];
		} else if (rng2 > 16 && rng2 <= 21) {
			bodyPart = ["left hand", 1 / 5];
		} else if (rng2 > 21 && rng2 <= 26) {
			bodyPart = ["right hand", 1 / 5];
		} else if (rng2 > 26 && rng2 <= 31) {
			bodyPart = ["left foot", 1 / 5];
		} else if (rng2 > 31 && rng2 <= 36) {
			bodyPart = ["right foot", 1 / 5];
		} else if (rng2 > 36 && rng2 <= 46) {
			bodyPart = ["left leg", 1 / 3.5];
		} else if (rng2 > 46 && rng2 <= 56) {
			bodyPart = ["right leg", 1 / 3.5];
		} else if (rng2 > 56 && rng2 <= 76) {
			bodyPart = ["stomach", 1 / 1.75];
		} else if (rng2 > 76 && rng2 <= 101) {
			bodyPart = ["chest", 1 / 1.75];
		}
	}

	return bodyPart;
}

/**
 * 护甲减伤计算
 */
export function armourMitigation(bodyPart: string, armour: ArmourSet): number {
	let mitigation = 0;
	const coverage: [number, number][] = [];
	let dummy: [number, number][] = [];
	let total = 0;
	let count = 0;
	const rng = Math.floor(Math.random() * 10000 + 1);

	// 获取护甲覆盖数据
	const armourCoverage = getArmourCoverage();

	// 遍历所有护甲槽位 - 修复护甲类型检查逻辑，与原版保持一致
	for (const slot in armour) {
		const armourPiece = armour[slot as keyof ArmourSet];
		if (
			armourPiece &&
			armourCoverage[bodyPart] &&
			armourCoverage[bodyPart][armourPiece.type || ""]
		) {
			const coveragePercent = armourCoverage[bodyPart][armourPiece.type || ""];
			if (coveragePercent !== undefined) {
				coverage.push([armourPiece.armour, coveragePercent]);
				total += coveragePercent;
				count += 1;
			}
		}
	}

	if (coverage.length === 0) {
		// 没打中护甲，返回0
		return 0;
	}

	// 创建副本用于排序 - 与原版JavaScript保持一致
	dummy = dummy.concat(coverage);

	let high = 0,
		second = 0,
		third = 0,
		low = 0;

	if (total >= 100) {
		// 总覆盖率 >= 100%，使用复杂的优先级计算

		if (count === 4) {
			// 4件护甲 - 修复排序逻辑，与原版JavaScript完全一致

			// 第一步：找出最高和最低护甲值的索引
			for (let i = 0; i < dummy.length; i++) {
				const dummyItem = dummy[i];
				const highCoverage = coverage[high];
				const lowCoverage = coverage[low];
				if (dummyItem && highCoverage && dummyItem[0] > highCoverage[0]) {
					high = i;
				} else if (dummyItem && lowCoverage && dummyItem[0] < lowCoverage[0]) {
					low = i;
				}
			}

			// 第二步：删除最高和最低的元素（模拟原版的delete操作）
			dummy[high] = [-1, -1]; // 标记为已删除
			dummy[low] = [-1, -1]; // 标记为已删除

			// 第三步：在剩余的护甲中找出第二高和第三高
			for (let i = 0; i < dummy.length; i++) {
				const dummyItem = dummy[i];
				const secondCoverage = coverage[second];
				const thirdCoverage = coverage[third];

				if (dummyItem && dummyItem[0] === -1) {
					// 跳过已删除的元素
				} else if (
					dummyItem &&
					secondCoverage &&
					dummyItem[0] > secondCoverage[0]
				) {
					second = i;
				} else if (
					dummyItem &&
					thirdCoverage &&
					dummyItem[0] < thirdCoverage[0]
				) {
					third = i;
				}
			}

			const highCoverage = coverage[high];
			const secondCoverage = coverage[second];
			const thirdCoverage = coverage[third];

			if (highCoverage && highCoverage[1] >= 100) {
				mitigation = highCoverage[0];
			} else if (
				highCoverage &&
				secondCoverage &&
				highCoverage[1] + secondCoverage[1] >= 100
			) {
				if (rng > 1 && rng <= highCoverage[1] * 100) {
					mitigation = highCoverage[0];
				} else if (
					rng > highCoverage[1] * 100 &&
					rng <= (highCoverage[1] + secondCoverage[1]) * 100
				) {
					mitigation = secondCoverage[0];
				}
			} else if (
				highCoverage &&
				secondCoverage &&
				thirdCoverage &&
				highCoverage[1] + secondCoverage[1] + thirdCoverage[1] >= 100
			) {
				if (rng > 1 && rng <= highCoverage[1] * 100) {
					mitigation = highCoverage[0];
				} else if (
					rng > highCoverage[1] * 100 &&
					rng <= (highCoverage[1] + secondCoverage[1]) * 100
				) {
					mitigation = secondCoverage[0];
				} else if (
					rng > (highCoverage[1] + secondCoverage[1]) * 100 &&
					rng <= (highCoverage[1] + secondCoverage[1] + thirdCoverage[1]) * 100
				) {
					mitigation = thirdCoverage[0];
				}
			} else {
				if (highCoverage && rng > 1 && rng <= highCoverage[1] * 100) {
					mitigation = highCoverage[0];
				} else if (
					highCoverage &&
					rng > highCoverage[1] * 100 &&
					secondCoverage &&
					rng <= (highCoverage[1] + secondCoverage[1]) * 100
				) {
					mitigation = secondCoverage[0];
				} else if (
					thirdCoverage &&
					highCoverage &&
					rng >
						(highCoverage[1] + (secondCoverage ? secondCoverage[1] : 0)) *
							100 &&
					rng <=
						(highCoverage[1] +
							(secondCoverage ? secondCoverage[1] : 0) +
							thirdCoverage[1]) *
							100
				) {
					mitigation = thirdCoverage[0];
				} else {
					const lowCoverage = coverage[low];
					if (lowCoverage) {
						mitigation = lowCoverage[0];
					}
				}
			}
		} else if (count === 3) {
			// 3件护甲
			for (let i = 0; i < dummy.length; i++) {
				const dummyItem = dummy[i];
				const highCoverage = coverage[high];
				const lowCoverage = coverage[low];
				if (dummyItem && highCoverage && dummyItem[0] > highCoverage[0]) {
					high = i;
				} else if (dummyItem && lowCoverage && dummyItem[0] < lowCoverage[0]) {
					low = i;
				}
			}

			// 删除最高和最低
			if (dummy[high]) dummy[high] = [-1, -1];
			if (dummy[low]) dummy[low] = [-1, -1];

			for (let i = 0; i < dummy.length; i++) {
				const dummyItem = dummy[i];
				const secondCoverage = coverage[second];
				if (dummyItem && dummyItem[0] === -1) {
					// Skip deleted items
				} else if (
					dummyItem &&
					secondCoverage &&
					dummyItem[0] > secondCoverage[0]
				) {
					second = i;
				}
			}

			const highCov = coverage[high];
			const secondCov = coverage[second];
			const lowCov = coverage[low];

			if (highCov && highCov[1] >= 100) {
				mitigation = highCov[0];
			} else if (highCov && secondCov && highCov[1] + secondCov[1] >= 100) {
				if (rng > 1 && rng <= highCov[1] * 100) {
					mitigation = highCov[0];
				} else {
					mitigation = secondCov[0];
				}
			} else {
				if (highCov && rng > 1 && rng <= highCov[1] * 100) {
					mitigation = highCov[0];
				} else if (
					highCov &&
					secondCov &&
					rng > highCov[1] * 100 &&
					rng <= (highCov[1] + secondCov[1]) * 100
				) {
					mitigation = secondCov[0];
				} else if (lowCov) {
					mitigation = lowCov[0];
				}
			}
		} else if (count === 2) {
			// 2件护甲
			for (let i = 0; i < dummy.length; i++) {
				const dummyItem = dummy[i];
				const highCoverage = coverage[high];
				const lowCoverage = coverage[low];
				if (dummyItem && highCoverage && dummyItem[0] > highCoverage[0]) {
					high = i;
				} else if (dummyItem && lowCoverage && dummyItem[0] < lowCoverage[0]) {
					low = i;
				}
			}

			const highCov = coverage[high];
			const lowCov = coverage[low];

			if (highCov && highCov[1] >= 100) {
				mitigation = highCov[0];
			} else if (highCov && lowCov) {
				if (rng > 1 && rng <= highCov[1] * 100) {
					mitigation = highCov[0];
				} else {
					mitigation = lowCov[0];
				}
			}
		} else if (count === 1) {
			// 1件护甲
			const firstCov = coverage[0];
			if (firstCov) {
				mitigation = firstCov[0];
			}
		}
	} else {
		// 总覆盖率 < 100%，与原版JavaScript保持完全一致

		if (count === 4) {
			// 修复：添加缺失的4件护甲处理，并修复原版JavaScript的语法错误
			const cov0 = coverage[0];
			const cov1 = coverage[1];
			const cov2 = coverage[2];
			const cov3 = coverage[3];

			if (cov0 && rng > 1 && rng <= cov0[1] * 100) {
				mitigation = cov0[0];
			} else if (
				cov0 &&
				cov1 &&
				rng > cov0[1] * 100 &&
				rng <= (cov0[1] + cov1[1]) * 100
			) {
				mitigation = cov1[0];
			} else if (
				cov0 &&
				cov1 &&
				cov2 &&
				rng > (cov0[1] + cov1[1]) * 100 &&
				rng <= (cov0[1] + cov1[1] + cov2[1]) * 100
			) {
				mitigation = cov2[0];
			} else if (
				cov0 &&
				cov1 &&
				cov2 &&
				cov3 &&
				rng > (cov0[1] + cov1[1] + cov2[1]) * 100 &&
				rng <= (cov0[1] + cov1[1] + cov2[1] + cov3[1]) * 100
			) {
				// 修复原版JavaScript中的语法错误：添加缺失的 rng <= 比较
				mitigation = cov3[0];
			} else {
				mitigation = 0;
			}
		} else if (count === 3) {
			const cov0 = coverage[0];
			const cov1 = coverage[1];
			const cov2 = coverage[2];

			if (cov0 && rng > 1 && rng <= cov0[1] * 100) {
				mitigation = cov0[0];
			} else if (
				cov0 &&
				cov1 &&
				rng > cov0[1] * 100 &&
				rng <= (cov0[1] + cov1[1]) * 100
			) {
				mitigation = cov1[0];
			} else if (
				cov0 &&
				cov1 &&
				cov2 &&
				rng > (cov0[1] + cov1[1]) * 100 &&
				rng <= (cov0[1] + cov1[1] + cov2[1]) * 100
			) {
				mitigation = cov2[0];
			} else {
				mitigation = 0;
			}
		} else if (count === 2) {
			const cov0 = coverage[0];
			const cov1 = coverage[1];

			if (cov0 && rng > 1 && rng <= cov0[1] * 100) {
				mitigation = cov0[0];
			} else if (
				cov0 &&
				cov1 &&
				rng > cov0[1] * 100 &&
				rng <= (cov0[1] + cov1[1]) * 100
			) {
				mitigation = cov1[0];
			} else {
				mitigation = 0;
			}
		} else if (count === 1) {
			const cov0 = coverage[0];
			if (cov0 && rng > 1 && rng <= cov0[1] * 100) {
				mitigation = cov0[0];
			} else {
				mitigation = 0;
			}
		}
	}

	return mitigation;
}

/**
 * 伤害波动函数 - 使用Box-Muller算法生成正态分布
 * 严格按照原版实现，范围限制在0.95-1.05
 */
export function variance(): number {
	let u = 0,
		v = 0;
	while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
	while (v === 0) v = Math.random();
	let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

	// num = num / 10.0 + 0.5; // Translate to 0 -> 1
	num = (20 * (num / 10.0 + 0.5) - 10 + 100) / 100; // Translate to 0.95 -> 1.05?
	if (num > 1.05 || num < 0.95) return variance(); // resample
	return num;
}

/**
 * 特殊取整函数 - 按照原版实现
 */
export function sRounding(x: number): number {
	const a = Math.floor(x);
	const b = a + 1;

	const rng = Math.round(Math.random() * 1000 * (b - a) + a) / 1000;
	if (rng <= x) {
		return a;
	} else if (rng > x) {
		return b;
	}
	return a; // fallback, should not reach here
}

/**
 * 计算发射轮数
 */
export function roundsFired(
	_weapon: WeaponData,
	weaponState: { rof: [number, number]; ammoleft: number },
): number {
	let rof = weaponState.rof;
	rof = [sRounding(rof[0]), sRounding(rof[1])];

	let rounds: number;
	if (rof[1] - rof[0] === 0) {
		rounds = rof[0];
	} else {
		rounds = Math.round(Math.random() * (rof[1] - rof[0]) + rof[0]);
	}

	// 关键修复：检查剩余弹药，不能消耗超过实际剩余的弹药
	if (rounds > weaponState.ammoleft) {
		rounds = weaponState.ammoleft;
	}

	return rounds;
}

/**
 * 判断是否是日本武器
 */
export function isJapanese(weaponName: string): boolean {
	return (
		weaponName.includes("Katana") ||
		weaponName.includes("Wakizashi") ||
		weaponName.includes("Naginata")
	);
}

/**
 * 计算特效加成
 */
export function procBonus(proc: number): number {
	return Math.random() < proc / 100 ? 1 : 0;
}

/**
 * 应用改装效果（战斗前）
 * @param p 玩家数据
 * @param p_mods 武器改装列表
 * @returns [弹夹容量倍数, 额外弹夹数, 射速倍数]
 */
export function applyPMbefore(p: FightPlayer, p_mods: string[]): number[] {
	let clipsizemulti = 1;
	let clips = 3; // 基础弹夹数
	let rofmulti = 1;

	const p_comp = p.perks.company;
	const p_edu = p.perks.education;

	// 应用改装效果
	for (const modName of p_mods) {
		if (modName && modName !== "n/a") {
			// 这里需要从数据加载器获取改装数据
			// 由于这是在战斗逻辑中，我们需要传入改装数据
			// 暂时使用硬编码的一些常见改装效果
			const modEffects = getModEffects(modName);
			if (modEffects) {
				clipsizemulti += modEffects.clip_size_multi;
				clips += modEffects.extra_clips;
				rofmulti += modEffects.rate_of_fire_multi;
			}
		}
	}

	// 公司技能：Gun Shop 7星增加1个额外弹夹
	if (p_comp.name === "Gun Shop" && p_comp.star >= 7) {
		clips += 1;
	}

	// 教育技能：弹药控制
	if (p_edu.ammocontrol1) {
		rofmulti -= 0.05;
	}
	if (p_edu.ammocontrol2) {
		rofmulti -= 0.2;
	}

	return [clipsizemulti, clips, rofmulti];
}

/**
 * 获取改装效果
 */
function getModEffects(modName: string): ModData | null {
	return cachedModData[modName] || null;
}

/**
 * 克隆对象
 */
export function clone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

/**
 * 玩家行动函数 - 处理一个玩家的完整行动
 */
function action(
	log: string[],
	x: FightPlayer,
	y: FightPlayer,
	xCL: number,
	yCL: number,
	xWS: WeaponState,
	yWS: WeaponState,
	xSE: StatusEffects,
	ySE: StatusEffects,
	xDOT: DOTEffects,
	yDOT: DOTEffects,
	x_set: WeaponSettings,
	y_set: WeaponSettings,
	x_temps: TempEffects,
	y_temps: TempEffects,
	turn: number,
): ActionResults {
	// 清空上一回合触发的武器特效记录
	clearTriggeredEffects();
	clearTriggeredArmourEffects();

	const xW = Object.assign({}, x.weapons);
	const yA = JSON.parse(JSON.stringify(y.armour));

	// 公司技能：服装
	if (
		y.perks.company.name === "Clothing Store" &&
		y.perks.company.star === 10
	) {
		for (const i in yA) {
			yA[i].armour *= 1.2;
		}
	}
	// 公司技能：私人保安公司
	else if (
		y.perks.company.name === "Private Security Firm" &&
		y.perks.company.star >= 7
	) {
		let set: string = "",
			count = 0;
		for (const i in yA) {
			if (count === 0) {
				set = yA[i].set;
				count += 1;
			} else {
				if (yA[i].set === set && set !== "n/a") {
					count += 1;
				}
			}
		}

		if (count === 5) {
			for (const i in yA) {
				yA[i].armour *= 1.25;
			}
		}
	}

	// 选择武器
	const xCW = chooseWeapon(x, x_set);
	const yCW = chooseWeapon(y, y_set);

	// 记录武器选择统计 - 只记录当前行动玩家的武器选择
	recordWeaponChoice(x.name, x.position, xCW);

	// 应用技能、改装、临时效果
	const pmt = applyPMT(
		x,
		y,
		xCW,
		yCW,
		xWS,
		yWS,
		x_set,
		y_set,
		x_temps,
		y_temps,
		xSE,
		ySE,
		turn,
	);

	let xSTR = pmt[0][0],
		xSPD = pmt[0][1],
		xDEF = pmt[0][2],
		xDEX = pmt[0][3];
	let x_acc_bonus = pmt[2][0],
		x_dmg_bonus = pmt[2][1],
		x_crit_chance = pmt[2][2];

	let ySTR = pmt[1][0],
		ySPD = pmt[1][1],
		yDEF = pmt[1][2],
		yDEX = pmt[1][3];

	// 应用状态效果对属性的修改
	const xModifiedStats = applyStatusEffectsToStats(x, {
		strength: xSTR,
		speed: xSPD,
		defense: xDEF,
		dexterity: xDEX,
	});
	xSTR = xModifiedStats.strength;
	xSPD = xModifiedStats.speed;
	xDEF = xModifiedStats.defense;
	xDEX = xModifiedStats.dexterity;

	const yModifiedStats = applyStatusEffectsToStats(y, {
		strength: ySTR,
		speed: ySPD,
		defense: yDEF,
		dexterity: yDEX,
	});
	ySTR = yModifiedStats.strength;
	ySPD = yModifiedStats.speed;
	yDEF = yModifiedStats.defense;
	yDEX = yModifiedStats.dexterity;
	// _ySTR = pmt[1][0], _ySPD = pmt[1][1] - 暂时未使用
	// _y_acc_bonus = pmt[3][0], _y_dmg_bonus = pmt[3][1], _y_crit_chance = pmt[3][2] - 暂时未使用

	// 减少临时效果持续时间
	for (let i = 0; i < x_temps.length; ) {
		const temp = x_temps[i];
		if (temp && temp[1] !== undefined) {
			const duration = temp[1] as number;
			temp[1] = duration - 1;
			if (temp[1] === 0) {
				x_temps.splice(i, 1);
			} else {
				i++;
			}
		} else {
			x_temps.splice(i, 1);
		}
	}

	// 最大生命值用于灼烧和血清素
	const xML = x.life,
		yML = y.life;

	// 检查是否需要重装
	const currentWeaponState = xWS[xCW as keyof WeaponState];
	if (
		currentWeaponState &&
		hasAmmoSystem(currentWeaponState) &&
		currentWeaponState.ammoleft === 0 &&
		x_set[xCW]?.reload === true
	) {
		// 检查武器是否存在且有效
		const weapon = xW[xCW as keyof typeof xW];
		const weaponName = weapon?.name;
		if (
			weaponName &&
			weaponName !== "Unknown" &&
			weaponName !== "" &&
			weaponName !== "n/a"
		) {
			// 添加重装日志
			log.push(`${x.name} reloaded their ${weaponName}`);
			const weaponState = xWS[xCW as keyof WeaponState];
			if (weaponState && hasAmmoSystem(weaponState)) {
				weaponState.ammoleft = weaponState.maxammo;
			}
			// 记录重装统计
			recordReload(x.name, xCW);
		} else {
			// 武器无效，停止使用该武器
			if (x_set[xCW]) {
				x_set[xCW].setting = 0;
			}
			return [
				log,
				xCL,
				yCL,
				xWS,
				yWS,
				xSE,
				ySE,
				xDOT,
				yDOT,
				x_set,
				y_set,
				x_temps,
				y_temps,
			];
		}

		// 加油站技能：灼烧
		if (y.perks.company.name === "Gas Station" && y.perks.company.star >= 5) {
			const rng = Math.floor(Math.random() * 10 + 1);
			if (rng === 1) {
				let life = parseInt((0.2 * yML).toString());
				if (yCL + life > yML) {
					life = yML - yCL;
				}
				yCL += life;
				log.push(`${y.name} cauterized their wound and recovered ${life} life`);
			}
		}

		// 处理DOT效果
		for (let dot = 0; dot < xDOT.length; dot++) {
			const dotEffect = xDOT[dot];
			if (yCL > 1 && dotEffect && dotEffect[0] > 0 && dotEffect[1] > 0) {
				let dotDMG: number = 0;

				if (dot === 0) {
					// 燃烧
					dotDMG = parseInt(
						(dotEffect[0] * ((0.15 / 5) * (6 - dotEffect[1]))).toString(),
					);
					if (
						y.perks.company.name === "Gas Station" &&
						y.perks.company.star >= 7
					) {
						dotDMG = parseInt((dotDMG / 1.5).toString());
					}
					if (
						x.perks.company.name === "Gas Station" &&
						x.perks.company.star === 10
					) {
						dotDMG = parseInt((dotDMG * 1.5).toString());
					}
					if (dotDMG > yCL - 1) {
						dotDMG = yCL - 1;
					}
					log.push(`Burning damaged ${y.name} for ${Math.round(dotDMG)}`);

					if (dotEffect[1] === 5) {
						xDOT[dot] = [0, 0];
					}
				} else if (dot === 1) {
					// 中毒
					dotDMG = parseInt(
						(dotEffect[0] * ((0.45 / 15) * (16 - dotEffect[1]))).toString(),
					);
					if (dotDMG > yCL - 1) {
						dotDMG = yCL - 1;
					}
					log.push(`Poison damaged ${y.name} for ${Math.round(dotDMG)}`);

					if (dotEffect[1] === 15) {
						xDOT[dot] = [0, 0];
					}
				} else if (dot === 2) {
					// 撕裂
					dotDMG = parseInt(
						(dotEffect[0] * ((0.9 / 9) * (10 - dotEffect[1]))).toString(),
					);
					if (dotDMG > yCL - 1) {
						dotDMG = yCL - 1;
					}
					log.push(`Laceration damaged ${y.name} for ${Math.round(dotDMG)}`);

					if (dotEffect[1] === 9) {
						xDOT[dot] = [0, 0];
					}
				} else if (dot === 3) {
					// 严重燃烧
					dotDMG = parseInt(
						(xDOT[dot][0] * ((0.15 / 5) * (10 - xDOT[dot][1]))).toString(),
					);
					if (dotDMG > yCL - 1) {
						dotDMG = yCL - 1;
					}
					log.push(
						`Severe burning damaged ${y.name} for ${Math.round(dotDMG)}`,
					);

					if (dotEffect[1] === 9) {
						xDOT[dot] = [0, 0];
					}
				}

				yCL -= dotDMG;
			}

			if (dotEffect) {
				dotEffect[1] += 1;
			}
		}
	} else {
		// 正常攻击流程
		let xBHC: number = 0,
			xFHC: number = 0,
			xBP: [string, number] = ["", 0],
			xMD: number = 0, // maxDamage
			yDM: number = 0, // damageMitigation
			xWDM: number = 0, // weaponDamageMulti
			yAM: number = 0, // armourMitigation
			xHOM: boolean = false, // hitOrMiss
			xDV: number = 0, // variance
			xDMG = 0; // damage
		let x_pen = 1, // penetration
			x_ammo_dmg = 1; // ammoDamageMulti
		let hitArmour = false;

		// 非伤害性临时武器不产生命中率和伤害
		const currentWeapon = xW[xCW as keyof typeof xW];

		// 应用回合前钩子（如Wind-up特效）
		const shouldSkipAction = applyWeaponBonusesBeforeTurn(
			x,
			y,
			xWS,
			currentWeapon,
			{
				attacker: x,
				target: y,
				weapon: currentWeapon,
				bodyPart: "", // 此时还未确定身体部位
				isCritical: false,
				turn: turn,
				currentWeaponSlot: xCW,
			},
		);

		if (shouldSkipAction) {
			log.push(`${x.name} is winding up their ${currentWeapon.name}`);
			return [
				log,
				xCL,
				yCL,
				xWS,
				yWS,
				xSE,
				ySE,
				xDOT,
				yDOT,
				x_set,
				y_set,
				x_temps,
				y_temps,
			];
		}

		if (currentWeapon.category !== "Non-Damaging") {
			// 弹药类型效果
			if (currentWeapon.ammo === "TR") {
				x_acc_bonus += 10;
			} else if (currentWeapon.ammo === "PI") {
				x_pen = 2;
			} else if (currentWeapon.ammo === "HP") {
				x_pen = x_pen / 1.5;
				x_ammo_dmg = 1.5;
			} else if (currentWeapon.ammo === "IN") {
				x_ammo_dmg = 1.4;
			}

			xBHC = hitChance(xSPD, yDEX);
			xFHC = applyAccuracy(xBHC, xW[xCW as keyof typeof xW].accuracy, {
				bonus: x_acc_bonus,
			});

			// 应用武器特效到命中率（如Sure Shot）
			xFHC = applyWeaponBonusesToHitChance(xFHC, currentWeapon, {
				attacker: x,
				target: y,
				weapon: currentWeapon,
				bodyPart: "", // 此时还未确定身体部位
				isCritical: false,
				turn: turn,
				currentWeaponSlot: xCW,
			});

			xHOM = hitOrMiss(xFHC);

			// 记录攻击统计（无论命中与否）
			recordAttack(x.name, xHOM, false); // 先记录基础攻击，暴击状态稍后更新

			if (xHOM) {
				if (
					xCW === "temporary" &&
					currentWeapon.name !== "Ninja Stars" &&
					currentWeapon.name !== "Throwing Knife"
				) {
					xBP = ["chest", 1 / 1.75];
				} else {
					// 首先选择身体部位以获取正确的暴击倍数
					xBP = selectBodyPart(x, x_crit_chance);

					// 然后应用武器特效到暴击率和暴击倍数
					const [modifiedCritChance, modifiedCritDamage] =
						applyWeaponBonusesToCritical(
							x_crit_chance,
							xBP[1], // 使用实际的身体部位暴击倍数
							currentWeapon,
							{
								attacker: x,
								target: y,
								weapon: currentWeapon,
								bodyPart: xBP[0],
								isCritical: xBP[1] >= 1, // 修复：暴击部位倍数是1，非暴击部位倍数小于1
								turn: turn,
								currentWeaponSlot: xCW,
							},
						);

					// 如果暴击率被修改，需要重新选择身体部位
					if (modifiedCritChance !== x_crit_chance) {
						xBP = selectBodyPart(x, modifiedCritChance);

						// 重新计算基于新身体部位的武器特效暴击倍数修改
						const [, newModifiedCritDamage] = applyWeaponBonusesToCritical(
							modifiedCritChance, // 使用修改后的暴击率
							xBP[1], // 使用新身体部位的暴击倍数
							currentWeapon,
							{
								attacker: x,
								target: y,
								weapon: currentWeapon,
								bodyPart: xBP[0], // 使用新身体部位
								isCritical: xBP[1] >= 1, // 修复：暴击部位倍数是1，非暴击部位倍数小于1
								turn: turn,
								currentWeaponSlot: xCW,
							},
						);

						// 更新暴击倍数
						if (xBP[1] >= 1) {
							xBP[1] = newModifiedCritDamage;
						}
					} else {
						// 暴击率未被修改，直接使用原始计算的暴击倍数
						if (xBP[1] >= 1) {
							xBP[1] = modifiedCritDamage;
						}
					}
				}

				// 应用武器特效到护甲减免
				const baseArmourMitigation = armourMitigation(xBP[0], yA);
				hitArmour = baseArmourMitigation > 0;
				const modifiedArmourMitigation = applyWeaponBonusesToArmour(
					baseArmourMitigation,
					currentWeapon,
					{
						attacker: x,
						target: y,
						weapon: currentWeapon,
						bodyPart: xBP[0],
						isCritical: xBP[1] >= 1,
						turn: turn,
						currentWeaponSlot: xCW,
					},
				);
				yAM = modifiedArmourMitigation / x_pen; // 护甲减伤百分数，50代表护甲减伤50%

				xMD = maxDamage(xSTR);
				yDM = damageMitigation(yDEF, xSTR); // 防御减伤百分数，50代表def减伤50%
				xWDM = xW[xCW as keyof typeof xW].damage / 10;
				xDV = variance();

				// 应用武器特效到伤害加成（如Powerful、Deadeye等）
				const modifiedDamageBonus = applyWeaponBonusesToDamageBonus(
					x_dmg_bonus,
					currentWeapon,
					{
						attacker: x,
						target: y,
						weapon: currentWeapon,
						bodyPart: xBP[0],
						isCritical: xBP[1] >= 1, // 修复：暴击部位倍数是1，非暴击部位倍数小于1
						turn: turn,
						currentWeaponSlot: xCW,
						weaponState: xWS, // 添加武器状态信息
						currentLife: { attacker: xCL, target: yCL }, // 添加当前生命值信息
					},
				);

				xDMG = Math.round(
					xBP[1] *
						xMD *
						(1 - yDM / 100) *
						xWDM *
						xDV *
						(1 + modifiedDamageBonus / 100) *
						x_ammo_dmg,
				);

				// 应用武器特效到伤害
				xDMG = applyWeaponBonusesToDamage(xDMG, currentWeapon, {
					attacker: x,
					target: y,
					weapon: currentWeapon,
					bodyPart: xBP[0],
					isCritical: xBP[1] >= 1, // 修复：暴击部位倍数是1，非暴击部位倍数小于1
					turn: turn,
					currentWeaponSlot: xCW,
					weaponState: xWS, // 添加武器状态信息
					currentLife: { attacker: xCL, target: yCL }, // 添加当前生命值信息
				});

				if (Number.isNaN(xDMG)) {
					xDMG = 0;
				}
			}
		}

		// 声明日志信息变量
		let logInfo: AttackLogInfo | null = null;

		// 根据武器类型处理攻击
		if (xCW === "primary") {
			let xRF: number;

			// Spray特效处理
			const primaryWeapon = xW[xCW];
			const primaryWeaponState = xWS[xCW];
			if (
				primaryWeapon.bonus?.name === "Spray" &&
				hasAmmoSystem(primaryWeaponState) &&
				primaryWeaponState.ammoleft === primaryWeaponState.maxammo
			) {
				const x_proc = procBonus(primaryWeapon.bonus?.proc || 0);
				if (x_proc === 1) {
					xDMG *= 2;
					// if (xDMG > yCL) {
					// 	xDMG = yCL;
					// }

					xRF = primaryWeaponState.maxammo;
					if (xHOM) {
						log.push(
							x.name +
								" sprayed " +
								xRF +
								" " +
								getAmmoDisplayName(primaryWeapon.ammo) +
								" rounds of their " +
								primaryWeapon.name +
								" hitting " +
								y.name +
								" in the " +
								xBP[0] +
								" for " +
								xDMG,
						);
					} else {
						log.push(
							x.name +
								" sprayed " +
								xRF +
								" " +
								getAmmoDisplayName(primaryWeapon.ammo) +
								" rounds of their " +
								xW[xCW].name +
								" missing " +
								y.name,
						);
					}
				} else {
					// if (xDMG > yCL) {
					// 	xDMG = yCL;
					// }
					xRF = roundsFired(xW[xCW], xWS[xCW]);
					if (xHOM) {
						log.push(
							x.name +
								" fired " +
								xRF +
								" " +
								getAmmoDisplayName(primaryWeapon.ammo) +
								" rounds of their " +
								xW[xCW].name +
								" hitting " +
								y.name +
								" in the " +
								xBP[0] +
								" for " +
								xDMG,
						);
					} else {
						log.push(
							x.name +
								" fired " +
								xRF +
								" " +
								getAmmoDisplayName(primaryWeapon.ammo) +
								" rounds of their " +
								xW[xCW].name +
								" missing " +
								y.name,
						);
					}
				}
			} else {
				// if (xDMG > yCL) {
				// 	xDMG = yCL;
				// }

				xRF = roundsFired(xW[xCW], xWS[xCW]);
				if (xHOM) {
					// 先记录原始伤害，用于后续日志生成
					const originalDamage = xDMG;

					// 检测触发的特效
					const triggeredBonuses = getTriggeredBonuses(primaryWeapon, {
						attacker: x,
						target: y,
						weapon: primaryWeapon,
						bodyPart: xBP[0],
						isCritical: xBP[1] >= 1,
						turn: turn,
						currentWeaponSlot: xCW,
						weaponState: xWS,
						currentLife: { attacker: xCL, target: yCL },
						targetWeaponSlot: yCW, // 添加目标的武器选择
					});

					const bonusText =
						triggeredBonuses.length > 0
							? ` [${triggeredBonuses.join(", ")}]`
							: "";

					// 日志将在应用防御性特效后生成，这里暂时不生成
					// 保存日志信息供后续使用
					logInfo = {
						attacker: x.name,
						rounds: xRF,
						ammo: getAmmoDisplayName(primaryWeapon.ammo),
						weapon: xW[xCW].name,
						target: y.name,
						bodyPart: xBP[0],
						originalDamage: originalDamage,
						bonusText: bonusText,
					};

					// 处理主武器特�?
					if (primaryWeapon.bonus?.name === "Demoralize") {
						if (xSE[0][0] < 5) {
							const x_proc = procBonus(primaryWeapon.bonus?.proc || 0);
							if (x_proc === 1) {
								xSE[0][0] += 1;
								ySE[1][0] += 1;
								log.push(`${y.name} has been Demoralized.`);
							}
						}
					} else if (primaryWeapon.bonus?.name === "Freeze") {
						if (xSE[0][1] < 1) {
							const x_proc = procBonus(primaryWeapon.bonus?.proc || 0);
							if (x_proc === 1) {
								xSE[0][1] += 1;
								ySE[1][1] += 1;
								log.push(`${y.name} has been Frozen.`);
							}
						}
					} else if (
						primaryWeapon.bonus?.name === "Blindfire" &&
						hasAmmoSystem(primaryWeaponState) &&
						primaryWeaponState.ammoleft - xRF !== 0
					) {
						const x_proc = procBonus(primaryWeapon.bonus?.proc || 0);
						if (x_proc === 1) {
							let totalDMG = xDMG,
								totalRounds = xRF;
							for (let i = 0; i < 15; i++) {
								x_acc_bonus -= 5;
								xFHC = applyAccuracy(xBHC, xW[xCW].accuracy, {
									bonus: x_acc_bonus,
								});
								xHOM = hitOrMiss(xFHC);

								// 记录Blindfire额外攻击统计
								recordAttack(x.name, xHOM, false);

								if (xHOM) {
									xBP = selectBodyPart(x, x_crit_chance);

									// 更新Blindfire暴击统计
									if (xBP[1] >= 1) {
										const stats = battleStatsCollector?.damageStats[x.name];
										if (stats) {
											stats.hitStats.criticals++;
										}
									}

									// TODO: yAM在Blindfire中的计算
									xDV = variance();
									xDMG = Math.round(
										xBP[1] *
											xMD *
											xWDM *
											(1 - yDM / 100) *
											xDV *
											(1 + x_dmg_bonus / 100) *
											x_ammo_dmg,
									);
									if (Number.isNaN(xDMG)) {
										xDMG = 0;
									}

									// 记录Blindfire伤害统计
									recordDamage(x.name, xCW, xDMG, xBP[1] >= 1);
									recordBodyPartHit(y.name, xBP[0], xDMG);
								}

								// if (totalDMG + xDMG > yCL) {
								// 	xDMG = yCL - totalDMG;
								// }

								xRF = roundsFired(xW[xCW], xWS[xCW]);

								if (totalRounds + xRF > primaryWeaponState.ammoleft) {
									xRF = primaryWeaponState.ammoleft - totalRounds;
									if (xRF <= 0) {
										break;
									}
								}

								if (xHOM) {
									log.push(
										x.name +
											" fired " +
											xRF +
											" " +
											getAmmoDisplayName(primaryWeapon.ammo) +
											" rounds of their " +
											xW[xCW].name +
											" hitting " +
											y.name +
											" in the " +
											xBP[0] +
											" for " +
											xDMG,
									);
								} else {
									log.push(
										x.name +
											" fired " +
											xRF +
											" " +
											getAmmoDisplayName(primaryWeapon.ammo) +
											" rounds of their " +
											xW[xCW].name +
											" missing " +
											y.name,
									);
								}

								totalDMG += xDMG;
								if (totalDMG === yCL) {
									xDMG = totalDMG;
									xRF = totalRounds;
									break;
								}

								totalRounds += xRF;
								if (totalRounds === primaryWeaponState.ammoleft) {
									xDMG = totalDMG;
									xRF = totalRounds;
									break;
								}
							}
						}
					}
				} else {
					log.push(
						x.name +
							" fired " +
							xRF +
							" " +
							getAmmoDisplayName(primaryWeapon.ammo) +
							" rounds of their " +
							xW[xCW].name +
							" missing " +
							y.name,
					);
				}
			}
			// 更新弹药状态
			if (hasAmmoSystem(primaryWeaponState)) {
				// 应用武器特效到弹药消耗（如Conserve特效）
				const modifiedAmmoConsumed = applyWeaponBonusesToAmmo(
					xRF,
					primaryWeapon,
					{
						attacker: x,
						target: y,
						weapon: primaryWeapon,
						bodyPart: xBP[0],
						isCritical: xBP[1] >= 1,
						turn: turn,
						currentWeaponSlot: xCW,
					},
				);

				primaryWeaponState.ammoleft -= modifiedAmmoConsumed;
				// 记录弹药消耗统计
				recordAmmoConsumption(x.name, xCW, modifiedAmmoConsumed);
				if (modifiedAmmoConsumed < xRF) {
					log.push(
						`${x.name}'s weapon conserved ${xRF - modifiedAmmoConsumed} rounds [Conserve]`,
					);
				}

				if (primaryWeaponState.ammoleft === 0) {
					primaryWeaponState.clipsleft -= 1;
					if (
						primaryWeaponState.clipsleft === 0 ||
						x_set[xCW].reload !== true
					) {
						x_set[xCW].setting = 0;
					}
				}
			}
		}
		// 副武器攻�?
		else if (xCW === "secondary") {
			const secondaryWeapon = xW[xCW];
			const secondaryWeaponState = xWS[xCW];

			// if (xDMG > yCL) {
			// 	xDMG = yCL;
			// }

			const xRF = roundsFired(secondaryWeapon, secondaryWeaponState);

			if (xHOM) {
				// 检测触发的特效
				const triggeredBonuses = getTriggeredBonuses(secondaryWeapon, {
					attacker: x,
					target: y,
					weapon: secondaryWeapon,
					bodyPart: xBP[0],
					isCritical: xBP[1] >= 1,
					turn: turn,
					currentWeaponSlot: xCW,
					weaponState: xWS,
					currentLife: { attacker: xCL, target: yCL },
					targetWeaponSlot: yCW, // 添加目标的武器选择
				});

				const bonusText =
					triggeredBonuses.length > 0
						? ` [${triggeredBonuses.join(", ")}]`
						: "";

				// 保存副武器攻击的日志信息
				logInfo = {
					attacker: x.name,
					rounds: xRF,
					ammo: getAmmoDisplayName(secondaryWeapon.ammo),
					weapon: xW[xCW].name,
					target: y.name,
					bodyPart: xBP[0],
					originalDamage: xDMG,
					bonusText: bonusText,
				};

				// 处理副武器特�?
				if (secondaryWeapon.bonus?.name === "Burn") {
					const x_proc = procBonus(secondaryWeapon.bonus?.proc || 0);
					if (x_proc === 1) {
						if (xDOT[0][0] > 0) {
							if (xDMG >= ((xDOT[0][0] * 0.15) / 5) * (6 - xDOT[0][1])) {
								xDOT[0] = [xDMG, 0];
								log.push(`${y.name} is set alight`);
							}
						} else {
							xDOT[0] = [xDMG, 0];
							log.push(`${y.name} is set alight`);
						}
					}
				} else if (secondaryWeapon.bonus?.name === "Poison") {
					const x_proc = procBonus(secondaryWeapon.bonus?.proc || 0);
					if (x_proc === 1) {
						if (xDOT[1][0] > 0) {
							if (xDMG >= ((xDOT[1][0] * 0.45) / 15) * (16 - xDOT[1][1])) {
								xDOT[1] = [xDMG, 0];
								log.push(`${y.name} is poisoned`);
							}
						} else {
							xDOT[1] = [xDMG, 0];
							log.push(`${y.name} is poisoned`);
						}
					}
				}
			} else {
				// miss的情况需要手动生成日志，因为统一日志处理只处理命中
				log.push(
					x.name +
						" fired " +
						xRF +
						" " +
						getAmmoDisplayName(secondaryWeapon.ammo) +
						" rounds of their " +
						xW[xCW].name +
						" missing " +
						y.name,
				);
			}
			// 更新弹药状态
			if (hasAmmoSystem(secondaryWeaponState)) {
				// 应用武器特效到弹药消耗（如Conserve特效）
				const modifiedAmmoConsumed = applyWeaponBonusesToAmmo(
					xRF,
					secondaryWeapon,
					{
						attacker: x,
						target: y,
						weapon: secondaryWeapon,
						bodyPart: xBP[0],
						isCritical: xBP[1] >= 1,
						turn: turn,
						currentWeaponSlot: xCW,
					},
				);

				secondaryWeaponState.ammoleft -= modifiedAmmoConsumed;
				if (modifiedAmmoConsumed < xRF) {
					log.push(
						`${x.name}'s weapon conserved ${xRF - modifiedAmmoConsumed} rounds [Conserve]`,
					);
				}

				if (secondaryWeaponState.ammoleft === 0) {
					secondaryWeaponState.clipsleft -= 1;
					if (
						secondaryWeaponState.clipsleft === 0 ||
						x_set[xCW].reload !== true
					) {
						x_set[xCW].setting = 0;
					}
				}
			}
		}
		// 近战武器攻击
		else if (xCW === "melee") {
			const meleeWeapon = xW[xCW];
			const meleeWeaponState = xWS[xCW];
			// if (xDMG > yCL) {
			// 	xDMG = yCL;
			// }

			// Storage特效处理
			if (
				meleeWeapon.bonus?.name === "Storage" &&
				"storageused" in meleeWeaponState &&
				meleeWeaponState.storageused === false
			) {
				const temporaryWeaponState = xWS.temporary;
				if (
					x_set.temporary.setting === 0 &&
					"initialsetting" in temporaryWeaponState &&
					temporaryWeaponState.initialsetting !== 0
				) {
					const meleeWeaponName = xCW
						? xW[xCW as keyof typeof xW].name
						: "weapon";
					log.push(
						x.name +
							" withdrew a " +
							xW.temporary.name +
							" from their " +
							meleeWeaponName,
					);
					x_set.temporary.setting = temporaryWeaponState.initialsetting;
					if ("storageused" in meleeWeaponState) {
						meleeWeaponState.storageused = true;
					}
				}
			} else {
				if (xHOM) {
					const weaponName = xCW ? xW[xCW as keyof typeof xW].name : "weapon";

					// 检测触发的特效
					const triggeredBonuses = getTriggeredBonuses(meleeWeapon, {
						attacker: x,
						target: y,
						weapon: meleeWeapon,
						bodyPart: xBP[0],
						isCritical: xBP[1] >= 1,
						turn: turn,
						currentWeaponSlot: xCW,
						weaponState: xWS,
						currentLife: { attacker: xCL, target: yCL },
						targetWeaponSlot: yCW, // 添加目标的武器选择
					});

					const bonusText =
						triggeredBonuses.length > 0
							? ` [${triggeredBonuses.join(", ")}]`
							: "";

					// 保存近战攻击的日志信息
					logInfo = {
						attacker: x.name,
						target: y.name,
						weapon: weaponName,
						bodyPart: xBP[0],
						originalDamage: xDMG,
						bonusText: bonusText,
						attackType: "melee",
					};

					// 处理近战武器特效
					if (meleeWeapon.bonus?.name === "Toxin") {
						const x_proc = procBonus(meleeWeapon.bonus?.proc || 0);
						if (x_proc === 1) {
							const eL: number[] = [];
							for (let i = 2; i < 6; i++) {
								const statusEffect = xSE[0];
								if (statusEffect) {
									const effectValue = statusEffect[i];
									if (typeof effectValue === "number" && effectValue < 3) {
										eL.push(i);
									}
								}
							}

							if (eL.length > 0) {
								const eI = eL[Math.floor(Math.random() * eL.length)];
								if (
									eI !== undefined &&
									xSE[0] &&
									ySE[1] &&
									typeof xSE[0][eI] === "number" &&
									typeof ySE[1][eI] === "number"
								) {
									xSE[0][eI] += 1;
									ySE[1][eI] += 1;

									if (eI === 2) {
										log.push(`${y.name} is withered`);
									} else if (eI === 3) {
										log.push(`${y.name} is slowed`);
									} else if (eI === 4) {
										log.push(`${y.name} is weakened`);
									} else if (eI === 5) {
										log.push(`${y.name} is crippled`);
									}
								}
							}
						}
					} else if (meleeWeapon.bonus?.name === "Lacerate") {
						const x_proc = procBonus(meleeWeapon.bonus?.proc || 0);
						if (x_proc === 1) {
							if (xDOT[2][0] > 0) {
								if (xDMG >= ((xDOT[2][0] * 0.9) / 9) * (10 - xDOT[2][1])) {
									xDOT[2] = [xDMG, 0];
									log.push(`${y.name} is lacerated`);
								}
							} else {
								xDOT[2] = [xDMG, 0];
								log.push(`${y.name} is lacerated`);
							}
						}
					}
				} else {
					const missedWeaponName = xCW
						? xW[xCW as keyof typeof xW].name
						: "weapon";
					log.push(`${x.name} missed ${y.name} with their ${missedWeaponName}`);
				}
			}
		}
		// 临时武器攻击
		else if (xCW === "temporary") {
			const temporaryWeapon = xW[xCW];
			const length = x_temps.length;

			// 处理各种临时武器
			if (temporaryWeapon.name === "Epinephrine") {
				log.push(`${x.name} injected ${temporaryWeapon.name}`);
				let test = 0;
				for (let i = 0; i < length; i++) {
					const tempEffect = x_temps[i];
					if (tempEffect && tempEffect[0] === "epi") {
						tempEffect[1] = 25;
						test = 1;
					}
				}
				if (test === 0) {
					x_temps.unshift(["epi", 25]);
				}
			} else if (temporaryWeapon.name === "Melatonin") {
				log.push(`${x.name} injected ${temporaryWeapon.name}`);
				let test = 0;
				for (let i = 0; i < length; i++) {
					const tempEffect = x_temps[i];
					if (tempEffect && tempEffect[0] === "mela") {
						tempEffect[1] = 25;
						test = 1;
					}
				}
				if (test === 0) {
					x_temps.unshift(["mela", 25]);
				}
			} else if (temporaryWeapon.name === "Serotonin") {
				let life = parseInt((xML * 0.25).toString());
				if (xCL + life > xML) {
					life = xML - xCL;
				}
				xCL += life;
				log.push(
					x.name +
						" injected " +
						temporaryWeapon.name +
						" and gained " +
						life +
						" life",
				);

				let test = 0;
				for (let i = 0; i < length; i++) {
					const temp = x_temps[i];
					if (temp && temp[0] === "sero") {
						temp[1] = 25;
						test = 1;
					}
				}
				if (test === 0) {
					x_temps.unshift(["sero", 25]);
				}
			} else if (temporaryWeapon.name === "Tyrosine") {
				log.push(`${x.name} injected ${temporaryWeapon.name}`);
				let test = 0;
				for (let i = 0; i < length; i++) {
					const temp = x_temps[i];
					if (temp && temp[0] === "tyro" && typeof temp[1] === "number") {
						temp[1] = 25;
						test = 1;
					}
				}
				if (test === 0) {
					x_temps.unshift(["tyro", 25]);
				}
			} else if (temporaryWeapon.name === "Concussion Grenade") {
				if (canArmourBlock("Concussion Grenade", yA.head.type)) {
					log.push(
						`${x.name} used a ${temporaryWeapon.name} but it was blocked!`,
					);
				} else {
					log.push(`${x.name} used a ${temporaryWeapon.name}`);
					y_temps.push(["conc", 25]);
				}
			} else if (temporaryWeapon.name === "Smoke Grenade") {
				if (canArmourBlock("Smoke Grenade", yA.head.type)) {
					log.push(
						`${x.name} used a ${temporaryWeapon.name} but it was blocked!`,
					);
				} else {
					log.push(`${x.name} used a ${temporaryWeapon.name}`);
					y_temps.push(["smoke", 25]);
				}
			} else if (temporaryWeapon.name === "Tear Gas") {
				if (canArmourBlock("Tear Gas", yA.head.type)) {
					log.push(
						`${x.name} used a ${temporaryWeapon.name} but it was blocked!`,
					);
				} else {
					log.push(`${x.name} used a ${temporaryWeapon.name}`);
					y_temps.push(["tear", 25]);
				}
			} else if (temporaryWeapon.name === "Flash Grenade") {
				if (canArmourBlock("Flash Grenade", yA.head.type)) {
					log.push(
						`${x.name} used a ${temporaryWeapon.name} but it was blocked!`,
					);
				} else {
					log.push(`${x.name} used a ${temporaryWeapon.name}`);
					const rng = Math.floor(Math.random() * 5 + 15);
					y_temps.push(["flash", rng]);
				}
			} else if (temporaryWeapon.name === "Pepper Spray") {
				if (canArmourBlock("Pepper Spray", yA.head.type)) {
					log.push(
						`${x.name} used a ${temporaryWeapon.name} but it was blocked!`,
					);
				} else {
					log.push(`${x.name} used a ${temporaryWeapon.name}`);
					const rng = Math.floor(Math.random() * 5 + 15);
					y_temps.push(["pepper", rng]);
				}
			} else if (temporaryWeapon.name === "Sand") {
				if (canArmourBlock("Sand", yA.head.type)) {
					log.push(
						`${x.name} used a ${temporaryWeapon.name} but it was blocked!`,
					);
				} else {
					log.push(`${x.name} used a ${temporaryWeapon.name}`);
					const rng = Math.floor(Math.random() * 5 + 15);
					y_temps.push(["sand", rng]);
				}
			} else {
				// 其他投掷武器
				if (xHOM) {
					// 检测触发的特效
					const triggeredBonuses = getTriggeredBonuses(temporaryWeapon, {
						attacker: x,
						target: y,
						weapon: temporaryWeapon,
						bodyPart: xBP[0],
						isCritical: xBP[1] >= 1,
						turn: turn,
						currentWeaponSlot: xCW,
						weaponState: xWS,
						currentLife: { attacker: xCL, target: yCL },
						targetWeaponSlot: yCW, // 添加目标的武器选择
					});

					const bonusText =
						triggeredBonuses.length > 0
							? ` [${triggeredBonuses.join(", ")}]`
							: "";

					log.push(
						x.name +
							" threw a " +
							temporaryWeapon.name +
							" hitting " +
							y.name +
							" in the " +
							xBP[0] +
							" for " +
							xDMG +
							bonusText,
					);
				} else {
					log.push(
						`${x.name} threw a ${temporaryWeapon.name} missing ${y.name}`,
					);
				}
			}

			// 临时武器使用后停�?
			x_set[xCW].setting = 0;

			// 严重燃烧特效
			if (temporaryWeapon.bonus?.name === "Severe Burn") {
				const x_proc = procBonus(temporaryWeapon.bonus?.proc || 0);
				if (x_proc === 1) {
					if (xDOT[3][0] > 0) {
						if (xDMG >= ((xDOT[3][0] * 0.15) / 5) * (6 - xDOT[3][1])) {
							xDOT[3] = [xDMG, 0];
							log.push(`${y.name} is set ablaze`);
						}
					} else {
						xDOT[3] = [xDMG, 0];
						log.push(`${y.name} is set ablaze`);
					}
				}
			}

			// 对于非伤害性临时武器（如Smoke Grenade、Pepper Spray等），处理完特殊效果后直接返回
			// 只有投掷武器（如Ninja Stars、Throwing Knife、HEG、Grenade等）需要继续执行伤害计算
			if (
				temporaryWeapon.name !== "Ninja Stars" &&
				temporaryWeapon.name !== "Throwing Knife" &&
				temporaryWeapon.name !== "HEG" &&
				temporaryWeapon.name !== "Grenade" &&
				temporaryWeapon.name !== "Stick Grenade" &&
				temporaryWeapon.name !== "Nail Bomb" &&
				temporaryWeapon.name !== "Fireworks" &&
				temporaryWeapon.name !== "Molotov Cocktail" &&
				temporaryWeapon.name !== "Snowball" &&
				temporaryWeapon.name !== "Trout"
			) {
				return [
					log,
					xCL,
					yCL,
					xWS,
					yWS,
					xSE,
					ySE,
					xDOT,
					yDOT,
					x_set,
					y_set,
					x_temps,
					y_temps,
				];
			}
		}
		// 拳头攻击
		else if (xCW === "fists") {
			const fistsWeapon = xW[xCW];
			if (xHOM) {
				// 检测触发的特效
				const triggeredBonuses = getTriggeredBonuses(fistsWeapon, {
					attacker: x,
					target: y,
					weapon: fistsWeapon,
					bodyPart: xBP[0],
					isCritical: xBP[1] >= 1,
					turn: turn,
					currentWeaponSlot: xCW,
					weaponState: xWS,
					currentLife: { attacker: xCL, target: yCL },
					targetWeaponSlot: yCW,
				});

				const bonusText =
					triggeredBonuses.length > 0
						? ` [${triggeredBonuses.join(", ")}]`
						: "";

				// 保存拳头攻击的日志信息
				logInfo = {
					attacker: x.name,
					target: y.name,
					weapon: "fists",
					bodyPart: xBP[0],
					originalDamage: xDMG,
					bonusText: bonusText,
					attackType: "melee",
				};
			} else {
				log.push(`${x.name} used fists missing ${y.name}`);
			}
		}
		// 脚踢攻击
		else if (xCW === "kick") {
			const kickWeapon = xW[xCW];
			if (xHOM) {
				// 检测触发的特效
				const triggeredBonuses = getTriggeredBonuses(kickWeapon, {
					attacker: x,
					target: y,
					weapon: kickWeapon,
					bodyPart: xBP[0],
					isCritical: xBP[1] >= 1,
					turn: turn,
					currentWeaponSlot: xCW,
					weaponState: xWS,
					currentLife: { attacker: xCL, target: yCL },
					targetWeaponSlot: yCW,
				});

				const bonusText =
					triggeredBonuses.length > 0
						? ` [${triggeredBonuses.join(", ")}]`
						: "";

				// 保存脚踢攻击的日志信息
				logInfo = {
					attacker: x.name,
					target: y.name,
					weapon: "kick",
					bodyPart: xBP[0],
					originalDamage: xDMG,
					bonusText: bonusText,
					attackType: "melee",
				};
			} else {
				log.push(`${x.name} kicked missing ${y.name}`);
			}
		}

		// 应用Eviscerate效果增加受到的伤害
		if (xDMG > 0) {
			xDMG = applyEviscerateToIncomingDamage(y, xDMG);
		}

		// 应用目标的防御性武器特效（如Parry）
		if (xDMG > 0) {
			// 检查目标的所有武器是否有防御性特效
			const targetWeapons = [
				y.weapons.primary,
				y.weapons.secondary,
				y.weapons.melee,
				y.weapons.temporary,
			];
			for (const targetWeapon of targetWeapons) {
				if (targetWeapon?.weaponBonuses) {
					xDMG = applyWeaponBonusesToIncomingDamage(xDMG, targetWeapon, {
						attacker: x,
						target: y,
						weapon: currentWeapon, // 攻击者的武器
						bodyPart: xBP[0],
						isCritical: xBP[1] >= 1,
						turn: turn,
						currentWeaponSlot: xCW,
						weaponState: xWS,
						currentLife: { attacker: xCL, target: yCL },
						targetWeaponSlot: yCW,
					});
				}
			}
		}

		// 应用护甲特效（如Impenetrable, Impregnable, Insurmountable, Impassable）
		if (xDMG > 0) {
			// 根据攻击的身体部位，找到对应的护甲部件
			let targetArmourPiece = null;
			const bodyPartToArmour: { [key: string]: keyof ArmourSet } = {
				head: "head",
				neck: "head", // 颈部攻击算头部护甲
				chest: "body",
				stomach: "body",
				groin: "body",
				"left arm": "hands",
				"right arm": "hands",
				"left hand": "hands",
				"right hand": "hands",
				"left leg": "legs",
				"right leg": "legs",
				"left foot": "feet",
				"right foot": "feet",
			};

			const armourSlot = bodyPartToArmour[xBP[0]];
			if (armourSlot) {
				targetArmourPiece = yA[armourSlot];
			}

			// 如果击中了护甲且找到了对应的护甲部件，应用护甲特效
			if (hitArmour) {
				if (targetArmourPiece?.effects) {
					// 收集触发的护甲特效信息（在应用前）
					const triggeredArmourEffects = getTriggeredArmourEffects(
						targetArmourPiece,
						{
							attacker: x,
							target: y,
							weapon: currentWeapon,
							bodyPart: xBP[0],
							isCritical: xBP[1] >= 1,
							turn: turn,
							currentWeaponSlot: xCW,
						},
						yCL, // 目标当前生命值
						y.maxLife, // 目标最大生命值
					);

					xDMG = applyArmourEffectsToDamage(
						xDMG,
						yAM,
						targetArmourPiece,
						{
							attacker: x,
							target: y,
							weapon: currentWeapon,
							bodyPart: xBP[0],
							isCritical: xBP[1] >= 1,
							turn: turn,
							currentWeaponSlot: xCW,
						},
						yCL, // 目标当前生命值
						y.maxLife, // 目标最大生命值
					);

					// 更新日志信息中的护甲特效文本
					if (logInfo && triggeredArmourEffects.length > 0) {
						logInfo.armourEffectsText = ` [Armour: ${triggeredArmourEffects.join(", ")}]`;
					}
				} else {
					// 普通护甲，直接计算减伤
					xDMG = xDMG * (1 - yAM / 100);
				}
			}
		}

		// 扣除伤害
		yCL -= xDMG;

		// 记录攻击和伤害统计
		// 更新暴击统计（如果命中且为暴击）
		if (xHOM && xBP[1] >= 1) {
			// 更新暴击统计，需要从已记录的命中中转换为暴击
			const stats = battleStatsCollector?.damageStats[x.name];
			if (stats) {
				stats.hitStats.criticals++;
			}
		}

		if (xHOM) {
			// 记录伤害统计
			recordDamage(x.name, xCW, xDMG, xBP[1] >= 1);
			// 记录身体部位命中统计
			recordBodyPartHit(y.name, xBP[0], xDMG);
		}

		// 生成攻击日志（在应用防御特效后）
		if (xHOM && logInfo !== null) {
			const currentTriggeredEffects = getCurrentTurnTriggeredEffects();
			const isParried = currentTriggeredEffects.includes("Parry");

			if (isParried && xDMG === 0) {
				// Parry成功，显示特殊消息
				if (logInfo.weapon === "fists") {
					log.push(
						`${logInfo.attacker} used fists hitting ${logInfo.target} in the ${logInfo.bodyPart} but the attack was parried!${logInfo.bonusText}`,
					);
				} else if (logInfo.weapon === "kick") {
					log.push(
						`${logInfo.attacker} kicked ${logInfo.target} in the ${logInfo.bodyPart} but the attack was parried!${logInfo.bonusText}`,
					);
				} else if (logInfo.attackType === "melee") {
					log.push(
						`${logInfo.attacker} hit ${logInfo.target} with their ${logInfo.weapon} in the ${logInfo.bodyPart} but the attack was parried!${logInfo.bonusText}`,
					);
				} else {
					log.push(
						`${logInfo.attacker} fired ${logInfo.rounds} ${logInfo.ammo} rounds of their ${logInfo.weapon} hitting ${logInfo.target} in the ${logInfo.bodyPart} but the attack was parried!${logInfo.bonusText}`,
					);
				}
			} else {
				// 正常攻击或部分减伤
				const armourEffectsText = logInfo.armourEffectsText || "";
				if (logInfo.weapon === "fists") {
					log.push(
						`${logInfo.attacker} used fists hitting ${logInfo.target} in the ${logInfo.bodyPart} for ${Math.round(xDMG)}${logInfo.bonusText}${armourEffectsText}`,
					);
				} else if (logInfo.weapon === "kick") {
					log.push(
						`${logInfo.attacker} kicked ${logInfo.target} in the ${logInfo.bodyPart} for ${Math.round(xDMG)}${logInfo.bonusText}${armourEffectsText}`,
					);
				} else if (logInfo.attackType === "melee") {
					log.push(
						`${logInfo.attacker} hit ${logInfo.target} with their ${logInfo.weapon} in the ${logInfo.bodyPart} for ${Math.round(xDMG)}${logInfo.bonusText}${armourEffectsText}`,
					);
				} else {
					log.push(
						`${logInfo.attacker} fired ${logInfo.rounds} ${logInfo.ammo} rounds of their ${logInfo.weapon} hitting ${logInfo.target} in the ${logInfo.bodyPart} for ${Math.round(xDMG)}${logInfo.bonusText}${armourEffectsText}`,
					);
				}
			}
		}

		// 检查Execute特效是否触发
		if (getCurrentTurnTriggeredEffects().includes("Execute")) {
			log.push(`${x.name} executed ${y.name}!`);
			yCL = 0; // 直接击败目标
		}

		// 应用武器特效的后处理效果（如Bloodlust生命回复）
		if (xDMG > 0) {
			// 记录应用前的状态效果，用于检测新触发的效果
			const triggeredEffectsBefore = getCurrentTurnTriggeredEffects().slice();

			// 应用攻击者武器的特效
			const postDamageResult = applyWeaponBonusesPostDamage(
				x,
				y,
				xDMG,
				currentWeapon,
				{
					attacker: x,
					target: y,
					weapon: currentWeapon,
					bodyPart: xBP[0],
					isCritical: xBP[1] >= 1,
					turn: turn,
					currentWeaponSlot: xCW,
					targetWeaponSlot: yCW, // 添加目标的武器选择
				},
			);

			// 检查新触发的状态效果并添加日志
			const triggeredEffectsAfter = getCurrentTurnTriggeredEffects();
			const newlyTriggeredEffects = triggeredEffectsAfter.filter(
				(effect) => !triggeredEffectsBefore.includes(effect),
			);

			// 为新触发的状态效果添加特殊日志
			for (const effect of newlyTriggeredEffects) {
				if (effect === "Stun") {
					log.push(`${y.name} has been stunned and will miss their next turn!`);
				} else if (effect === "Slow") {
					log.push(`${y.name} has been slowed!`);
				} else if (effect === "Cripple") {
					log.push(`${y.name} has been crippled!`);
				} else if (effect === "Weaken") {
					log.push(`${y.name} has been weakened!`);
				} else if (effect === "Wither") {
					log.push(`${y.name} has been withered!`);
				} else if (effect === "Eviscerate") {
					log.push(`${y.name} is bleeding heavily!`);
				} else if (effect === "Disarm") {
					log.push(`${y.name} has been disarmed!`);
				} else if (effect === "Suppress") {
					log.push(`${y.name} has been suppressed and may miss future turns!`);
				} else if (effect === "Bleed") {
					log.push(`${y.name} is bleeding!`);
				} else if (effect === "Paralyzed") {
					log.push(`${y.name} has been paralyzed!`);
				} else if (effect === "Motivation") {
					log.push(`${x.name} feels motivated!`);
				} else if (effect === "Home Run") {
					// Home Run效果的具体处理在takeTurns函数中进行
					// 这里只记录基础触发信息
				}
			}

			// 处理生命回复和自伤
			if (postDamageResult.healing !== 0) {
				if (postDamageResult.healing > 0) {
					// 正值：生命回复（如Bloodlust）
					const maxLife = x.maxLife;
					const actualHeal = Math.min(postDamageResult.healing, maxLife - xCL);
					if (actualHeal > 0) {
						xCL += actualHeal;
						log.push(
							`${x.name} recovered ${Math.round(actualHeal)} life from Bloodlust`,
						);
					}
				} else {
					// 负值：自伤（如Double-edged）
					const selfDamage = Math.abs(postDamageResult.healing);
					if (selfDamage > xCL - 1) {
						// 自伤不能致死，最多留1血
						const actualSelfDamage = xCL - 1;
						xCL = 1;
						log.push(
							`${x.name} took ${Math.round(actualSelfDamage)} self-damage from Double-edged`,
						);
					} else {
						xCL -= selfDamage;
						log.push(
							`${x.name} took ${Math.round(selfDamage)} self-damage from Double-edged`,
						);
					}
				}
			}

			// 处理额外攻击（如Rage特效）
			if (postDamageResult.extraAttacks > 0) {
				log.push(
					`${x.name} gains ${postDamageResult.extraAttacks} extra attacks from weapon effects`,
				);

				// 实现额外攻击逻辑
				for (
					let extraAttack = 0;
					extraAttack < postDamageResult.extraAttacks && yCL > 0;
					extraAttack++
				) {
					// 重新计算命中率和伤害
					let extraHitChance = hitChance(xSPD, yDEX);
					extraHitChance = applyAccuracy(
						extraHitChance,
						currentWeapon.accuracy,
						{
							bonus: x_acc_bonus,
						},
					);
					extraHitChance = applyWeaponBonusesToHitChance(
						extraHitChance,
						currentWeapon,
						{
							attacker: x,
							target: y,
							weapon: currentWeapon,
							bodyPart: "",
							isCritical: false,
							turn: turn,
							currentWeaponSlot: xCW,
						},
					);

					const extraHit = hitOrMiss(extraHitChance);

					// 记录额外攻击统计
					recordAttack(x.name, extraHit, false);

					if (extraHit) {
						const extraBodyPart = selectBodyPart(x, x_crit_chance);

						// 更新额外攻击暴击统计
						if (extraBodyPart[1] >= 1) {
							const stats = battleStatsCollector?.damageStats[x.name];
							if (stats) {
								stats.hitStats.criticals++;
							}
						}

						const extraMaxDamage = maxDamage(xSTR);
						const extraDefenseMitigation =
							(100 - damageMitigation(yDEF, xSTR)) / 100;
						const extraWeaponDamage = currentWeapon.damage / 10;
						const extraArmourMitigation =
							(100 - armourMitigation(extraBodyPart[0], yA)) / 100;
						const extraVariance = variance();

						let extraDamage = Math.round(
							extraBodyPart[1] *
								extraMaxDamage *
								extraDefenseMitigation *
								extraWeaponDamage *
								extraArmourMitigation *
								extraVariance *
								(1 + x_dmg_bonus / 100),
						);

						// 应用武器特效到额外攻击伤害
						extraDamage = applyWeaponBonusesToDamage(
							extraDamage,
							currentWeapon,
							{
								attacker: x,
								target: y,
								weapon: currentWeapon,
								bodyPart: extraBodyPart[0],
								isCritical: extraBodyPart[1] >= 1, // 修复：使用一致的暴击判断
								turn: turn,
								currentWeaponSlot: xCW,
								weaponState: xWS, // 添加武器状态信息
							},
						);

						// 应用Eviscerate效果
						// TODO: Eviscerate效果计算公式错误
						if (extraDamage > 0) {
							extraDamage = applyEviscerateToIncomingDamage(y, extraDamage);
						}

						// 应用目标的防御性武器特效（如Parry）到额外攻击
						if (extraDamage > 0) {
							const targetWeapons = [
								y.weapons.primary,
								y.weapons.secondary,
								y.weapons.melee,
								y.weapons.temporary,
							];
							for (const targetWeapon of targetWeapons) {
								if (targetWeapon?.weaponBonuses) {
									extraDamage = applyWeaponBonusesToIncomingDamage(
										extraDamage,
										targetWeapon,
										{
											attacker: x,
											target: y,
											weapon: currentWeapon,
											bodyPart: extraBodyPart[0],
											isCritical: extraBodyPart[1] >= 1,
											turn: turn,
											currentWeaponSlot: xCW,
											weaponState: xWS,
											currentLife: { attacker: xCL, target: yCL },
											targetWeaponSlot: yCW,
										},
									);
								}
							}
						}

						// 删除额外攻击的伤害限制，允许记录真实伤害
						// if (extraDamage > yCL) {
						// 	extraDamage = yCL;
						// }

						log.push(
							`${x.name} extra attack hits ${y.name} in the ${extraBodyPart[0]} for ${Math.round(extraDamage)}`,
						);

						// 记录额外攻击伤害和身体部位统计
						recordDamage(x.name, xCW, extraDamage, extraBodyPart[1] >= 1);
						recordBodyPartHit(y.name, extraBodyPart[0], extraDamage);

						yCL -= extraDamage;
					} else {
						log.push(`${x.name} extra attack misses ${y.name}`);
					}
				}
			}
		}

		if (yCL <= 0) {
			return [
				log,
				xCL,
				yCL,
				xWS,
				yWS,
				xSE,
				ySE,
				xDOT,
				yDOT,
				x_set,
				y_set,
				x_temps,
				y_temps,
			];
		}

		// 加油站技能：灼烧恢复
		if (y.perks.company.name === "Gas Station" && y.perks.company.star >= 5) {
			const rng = Math.floor(Math.random() * 10 + 1);
			if (rng === 1) {
				let life = parseInt((0.2 * yML).toString());
				if (yCL + life > yML) {
					life = yML - yCL;
				}
				yCL += life;
				log.push(`${y.name} cauterized their wound and recovered ${life} life`);
			}
		}

		// 处理DOT效果
		for (let dot = 0; dot < xDOT.length; dot++) {
			const dotEffect = xDOT[dot];
			if (yCL > 1 && dotEffect && dotEffect[0] > 0 && dotEffect[1] > 0) {
				let dotDMG: number = 0;

				if (dot === 0) {
					// 燃烧
					dotDMG = parseInt(
						(dotEffect[0] * ((0.15 / 5) * (6 - dotEffect[1]))).toString(),
					);
					if (
						y.perks.company.name === "Gas Station" &&
						y.perks.company.star >= 7
					) {
						dotDMG = parseInt((dotDMG / 1.5).toString());
					}
					if (
						x.perks.company.name === "Gas Station" &&
						x.perks.company.star === 10
					) {
						dotDMG = parseInt((dotDMG * 1.5).toString());
					}
					if (dotDMG > yCL - 1) {
						dotDMG = yCL - 1;
					}
					log.push(`Burning damaged ${y.name} for ${Math.round(dotDMG)}`);

					if (dotEffect[1] === 5) {
						xDOT[dot] = [0, 0];
					}
				} else if (dot === 1) {
					// 中毒
					dotDMG = parseInt(
						(dotEffect[0] * ((0.45 / 15) * (16 - dotEffect[1]))).toString(),
					);
					if (dotDMG > yCL - 1) {
						dotDMG = yCL - 1;
					}
					log.push(`Poison damaged ${y.name} for ${Math.round(dotDMG)}`);

					if (dotEffect[1] === 15) {
						xDOT[dot] = [0, 0];
					}
				} else if (dot === 2) {
					// 撕裂
					dotDMG = parseInt(
						(dotEffect[0] * ((0.9 / 9) * (10 - dotEffect[1]))).toString(),
					);
					if (dotDMG > yCL - 1) {
						dotDMG = yCL - 1;
					}
					log.push(`Laceration damaged ${y.name} for ${Math.round(dotDMG)}`);

					if (dotEffect[1] === 9) {
						xDOT[dot] = [0, 0];
					}
				} else if (dot === 3) {
					// 严重燃烧
					dotDMG = parseInt(
						(xDOT[dot][0] * ((0.15 / 5) * (10 - xDOT[dot][1]))).toString(),
					);
					if (dotDMG > yCL - 1) {
						dotDMG = yCL - 1;
					}
					log.push(
						`Severe burning damaged ${y.name} for ${Math.round(dotDMG)}`,
					);

					if (dotEffect[1] === 9) {
						xDOT[dot] = [0, 0];
					}
				}

				yCL -= dotDMG;
			}

			if (dotEffect) {
				dotEffect[1] += 1;
			}
		}

		// 更新连击计数器（Frenzy/Focus特效用）
		if (currentWeapon.weaponBonuses) {
			const hasFrenzy = currentWeapon.weaponBonuses.some(
				(b) => b.name === "Frenzy",
			);
			const hasFocus = currentWeapon.weaponBonuses.some(
				(b) => b.name === "Focus",
			);

			if (hasFrenzy) {
				if (xHOM && xDMG > 0) {
					x.comboCounter = (x.comboCounter || 0) + 1; // 命中时增加连击
				} else {
					x.comboCounter = 0; // miss时重置
				}
			} else if (hasFocus) {
				if (xHOM && xDMG > 0) {
					x.comboCounter = 0; // 命中时重置
				} else {
					x.comboCounter = (x.comboCounter || 0) + 1; // miss时增加计数
				}
			}
		}
	}

	// 更新连击计数器和最后使用回合
	if (!x.comboCounter) x.comboCounter = 0;
	if (!x.lastUsedTurn) x.lastUsedTurn = {};

	// 更新最后使用武器的回合
	x.lastUsedTurn[xCW] = turn;

	return [
		log,
		xCL,
		yCL,
		xWS,
		yWS,
		xSE,
		ySE,
		xDOT,
		yDOT,
		x_set,
		y_set,
		x_temps,
		y_temps,
	];
}

/**
 * 应用技能、改装、临时效果的函数
 */
function applyPMT(
	x: FightPlayer,
	y: FightPlayer,
	xCW: string,
	yCW: string,
	xWS: WeaponState,
	yWS: WeaponState,
	x_set: WeaponSettings,
	y_set: WeaponSettings,
	x_temps: TempEffects,
	y_temps: TempEffects,
	xSE: StatusEffects,
	ySE: StatusEffects,
	turn: number,
): [
	[number, number, number, number],
	[number, number, number, number],
	[number, number, number],
	[number, number, number],
] {
	let x_acc = 0,
		x_dmg = 0,
		x_crit = 12;
	const x_edu = x.perks.education,
		x_fac = x.perks.faction;
	const x_comp = x.perks.company,
		x_prop = x.perks.property;
	const x_merit = x.perks.merit,
		x_wep = x.weapons[xCW as keyof typeof x.weapons];

	let y_acc = 0,
		y_dmg = 0,
		y_crit = 12;
	const y_edu = y.perks.education,
		y_fac = y.perks.faction;
	const y_comp = y.perks.company,
		y_prop = y.perks.property;
	const y_merit = y.perks.merit,
		y_wep = y.weapons[yCW as keyof typeof y.weapons];

	// 基础加成
	x_acc += 0.02 * (x_wep.experience || 0) + 0.2 * x_fac.accuracy;
	x_dmg += 0.1 * (x_wep.experience || 0) + x_fac.damage;
	x_crit += 0.5 * x_merit.critrate;

	y_acc += 0.02 * (y_wep.experience || 0) + 0.2 * y_fac.accuracy;
	y_dmg += 0.1 * (y_wep.experience || 0) + y_fac.damage;
	y_crit += 0.5 * y_merit.critrate;

	// 公司技�?
	if (x_comp.name === "Zoo" && x_comp.star === 10) {
		x_acc += 3;
	}
	if (y_comp.name === "Zoo" && y_comp.star === 10) {
		y_acc += 3;
	}

	// 教育技�?
	if (x_edu.damage) {
		x_dmg += 1;
	}
	if (x_prop.damage) {
		x_dmg += 2;
	}
	if (x_edu.critchance) {
		x_crit += 3;
	}

	if (y_edu.damage) {
		y_dmg += 1;
	}
	if (y_prop.damage) {
		y_dmg += 2;
	}
	if (y_edu.critchance) {
		y_crit += 3;
	}

	// 武器类型特定加成
	if (xCW === "primary" || xCW === "secondary") {
		if (x_comp.name === "Gun Shop" && x_comp.star === 10) {
			x_dmg += 10;
		}
	} else if (xCW === "melee") {
		if (x_edu.meleedamage) {
			x_dmg += 2;
		}
		if (
			(x_comp.name === "Pub" || x_comp.name === "Restaurant") &&
			x_comp.star >= 3
		) {
			x_dmg += 10;
		}
		if (isJapanese(x_wep.name) && x_edu.japanesedamage) {
			x_dmg += 10;
		}
	} else if (xCW === "temporary") {
		x_acc += 0.2 * (x_merit.temporarymastery || 0);
		x_dmg += x_merit.temporarymastery || 0;
		if (x_edu.temporaryaccuracy) {
			x_acc += 1;
		}
		if (x_edu.tempdamage) {
			x_dmg += 5;
		}
	} else if (xCW === "fists") {
		// 拳头技能加成：100%拳头伤害加成
		if (x_edu.fistdamage) {
			x_dmg += x_wep.damage; // 增加一倍基础伤害，实现100%加成
		}
	}

	// 同样处理y玩家
	if (yCW === "primary" || yCW === "secondary") {
		if (y_comp.name === "Gun Shop" && y_comp.star === 10) {
			y_dmg += 10;
		}
	} else if (yCW === "melee") {
		if (y_edu.meleedamage) {
			y_dmg += 2;
		}
		if (
			(y_comp.name === "Pub" || y_comp.name === "Restaurant") &&
			y_comp.star >= 3
		) {
			y_dmg += 10;
		}
		if (isJapanese(y_wep.name) && y_edu.japanesedamage) {
			y_dmg += 10;
		}
	} else if (yCW === "temporary") {
		y_acc += 0.2 * (y_merit.temporarymastery || 0);
		y_dmg += y_merit.temporarymastery || 0;
		if (y_edu.temporaryaccuracy) {
			y_acc += 1;
		}
		if (y_edu.tempdamage) {
			y_dmg += 5;
		}
	} else if (yCW === "fists") {
		// 拳头技能加成：100%拳头伤害加成
		if (y_edu.fistdamage) {
			y_dmg += y_wep.damage; // 增加一倍基础伤害，实现100%加成
		}
	}

	// 武器类别掌握技能处理 - x玩家
	if (x_wep.category === "Clubbing") {
		x_acc += 0.2 * (x_merit.clubbingmastery || 0);
		x_dmg += x_merit.clubbingmastery || 0;
	} else if (x_wep.category === "Heavy Artillery") {
		x_acc += 0.2 * (x_merit.heavyartillerymastery || 0);
		x_dmg += x_merit.heavyartillerymastery || 0;
		if (x_edu.heavyartilleryaccuracy) {
			x_acc += 1;
		}
	} else if (x_wep.category === "Machine Gun") {
		x_acc += 0.2 * (x_merit.machinegunmastery || 0);
		x_dmg += x_merit.machinegunmastery || 0;
		if (x_edu.machinegunaccuracy) {
			x_acc += 1;
		}
	} else if (x_wep.category === "Mechanical") {
		x_acc += 0.2 * (x_merit.mechanicalmastery || 0);
		x_dmg += x_merit.mechanicalmastery || 0;
	} else if (x_wep.category === "Piercing") {
		x_acc += 0.2 * (x_merit.piercingmastery || 0);
		x_dmg += x_merit.piercingmastery || 0;
	} else if (x_wep.category === "Pistol") {
		x_acc += 0.2 * (x_merit.pistolmastery || 0);
		x_dmg += x_merit.pistolmastery || 0;
		if (x_edu.pistolaccuracy) {
			x_acc += 1;
		}
	} else if (x_wep.category === "Rifle") {
		x_acc += 0.2 * (x_merit.riflemastery || 0);
		x_dmg += x_merit.riflemastery || 0;
		if (x_edu.rifleaccuracy) {
			x_acc += 1;
		}
	} else if (x_wep.category === "Shotgun") {
		x_acc += 0.2 * (x_merit.shotgunmastery || 0);
		x_dmg += x_merit.shotgunmastery || 0;
		if (x_edu.shotgunaccuracy) {
			x_acc += 1;
		}
	} else if (x_wep.category === "Slashing") {
		x_acc += 0.2 * (x_merit.slashingmastery || 0);
		x_dmg += x_merit.slashingmastery || 0;
	} else if (x_wep.category === "SMG") {
		x_acc += 0.2 * (x_merit.smgmastery || 0);
		x_dmg += x_merit.smgmastery || 0;
		if (x_edu.smgaccuracy) {
			x_acc += 1;
		}
	} else if (x_wep.category === "Unarmed") {
		// 徒手攻击受到近战掌握技能影响
		x_acc += 0.2 * (x_merit.meleemastery || 0);
		x_dmg += x_merit.meleemastery || 0;
	}

	// 武器类别掌握技能处理 - y玩家
	if (y_wep.category === "Clubbing") {
		y_acc += 0.2 * (y_merit.clubbingmastery || 0);
		y_dmg += y_merit.clubbingmastery || 0;
	} else if (y_wep.category === "Heavy Artillery") {
		y_acc += 0.2 * (y_merit.heavyartillerymastery || 0);
		y_dmg += y_merit.heavyartillerymastery || 0;
		if (y_edu.heavyartilleryaccuracy) {
			y_acc += 1;
		}
	} else if (y_wep.category === "Machine Gun") {
		y_acc += 0.2 * (y_merit?.machinegunmastery || 0);
		y_dmg += y_merit?.machinegunmastery || 0;
		if (y_edu.machinegunaccuracy) {
			y_acc += 1;
		}
	} else if (y_wep.category === "Mechanical") {
		y_acc += 0.2 * (y_merit.mechanicalmastery || 0);
		y_dmg += y_merit.mechanicalmastery || 0;
	} else if (y_wep.category === "Piercing") {
		y_acc += 0.2 * (y_merit.piercingmastery || 0);
		y_dmg += y_merit.piercingmastery || 0;
	} else if (y_wep.category === "Pistol") {
		y_acc += 0.2 * (y_merit.pistolmastery || 0);
		y_dmg += y_merit.pistolmastery || 0;
		if (y_edu.pistolaccuracy) {
			y_acc += 1;
		}
	} else if (y_wep.category === "Rifle") {
		y_acc += 0.2 * (y_merit.riflemastery || 0);
		y_dmg += y_merit.riflemastery || 0;
		if (y_edu.rifleaccuracy) {
			y_acc += 1;
		}
	} else if (y_wep.category === "Shotgun") {
		y_acc += 0.2 * (y_merit?.shotgunmastery || 0);
		y_dmg += y_merit?.shotgunmastery || 0;
		if (y_edu.shotgunaccuracy) {
			y_acc += 1;
		}
	} else if (y_wep.category === "Slashing") {
		y_acc += 0.2 * (y_merit.slashingmastery || 0);
		y_dmg += y_merit.slashingmastery || 0;
	} else if (y_wep.category === "SMG") {
		y_acc += 0.2 * (y_merit.smgmastery || 0);
		y_dmg += y_merit.smgmastery || 0;
		if (y_edu?.smgaccuracy) {
			y_acc += 1;
		}
	} else if (y_wep.category === "Unarmed") {
		// 徒手攻击受到近战掌握技能影响
		y_acc += 0.2 * (y_merit.meleemastery || 0);
		y_dmg += y_merit.meleemastery || 0;
	}

	// 计算最终属性
	const x_passives = { ...x.passives };
	const y_passives = { ...y.passives };

	// 武器改装效果处理 - x玩家
	const xWeaponState = xWS[xCW as keyof WeaponState];
	if (
		xCW &&
		xWeaponState &&
		(xWeaponState.ammoleft !== 0 || !x_set[xCW]?.reload)
	) {
		if (xCW === "primary" || xCW === "secondary") {
			const mods = x_wep.mods || [];
			for (const modName of mods) {
				if (modName && modName !== "n/a") {
					const modEffects = getModEffects(modName);
					if (modEffects) {
						x_acc += modEffects.acc_bonus || 0;
						y_acc += modEffects.enemy_acc_bonus || 0;
						x_crit += modEffects.crit_chance || 0;
						x_dmg += modEffects.dmg_bonus || 0;
						x_passives.dexterity += modEffects.dex_passive || 0;
						// 处理第一回合特殊效果
						if (modEffects.turn1 && turn === 1) {
							if (modEffects.turn1?.acc_bonus) {
								x_acc += modEffects.turn1.acc_bonus;
							}
						}
					}
				}
			}
		}
	}

	// 武器改装效果处理 - y玩家
	const yWeaponState = yWS[yCW as keyof WeaponState];
	if (
		yCW &&
		yWeaponState &&
		(yWeaponState.ammoleft !== 0 || !y_set[yCW]?.reload)
	) {
		if (yCW === "primary" || yCW === "secondary") {
			const mods = y_wep.mods || [];
			for (const modName of mods) {
				if (modName && modName !== "n/a") {
					const modEffects = getModEffects(modName);
					if (modEffects) {
						y_acc += modEffects.acc_bonus || 0;
						x_acc += modEffects.enemy_acc_bonus || 0;
						y_crit += modEffects.crit_chance || 0;
						y_dmg += modEffects.dmg_bonus || 0;
						y_passives.dexterity += modEffects.dex_passive || 0;
						// 处理第一回合特殊效果
						if (modEffects.turn1 && turn === 1) {
							if (modEffects.turn1?.acc_bonus) {
								y_acc += modEffects.turn1.acc_bonus;
							}
						}
					}
				}
			}
		}
	}

	// 临时效果
	for (let i = 0; i < x_temps.length; i++) {
		const tempEffect = x_temps[i];
		if (!tempEffect) continue;

		if (tempEffect[0] === "epi") {
			x_passives.strength += 500;
			if (x_edu.needleeffect) {
				x_passives.strength += 50;
			}
		} else if (tempEffect[0] === "mela") {
			x_passives.speed += 500;
			if (x_edu.needleeffect) {
				x_passives.speed += 50;
			}
		} else if (tempEffect[0] === "sero") {
			x_passives.defense += 300;
			if (x_edu.needleeffect) {
				x_passives.defense += 30;
			}
		} else if (tempEffect[0] === "tyro") {
			x_passives.dexterity += 500;
			if (x_edu.needleeffect) {
				x_passives.dexterity += 50;
			}
		}
	}

	// 同样处理y玩家的临时效果
	for (let i = 0; i < y_temps.length; i++) {
		const tempEffect = y_temps[i];
		if (!tempEffect) continue;

		if (tempEffect[0] === "epi") {
			y_passives.strength += 500;
			if (y_edu.needleeffect) {
				y_passives.strength += 50;
			}
		} else if (tempEffect[0] === "mela") {
			y_passives.speed += 500;
			if (y_edu.needleeffect) {
				y_passives.speed += 50;
			}
		} else if (tempEffect[0] === "sero") {
			y_passives.defense += 300;
			if (y_edu.needleeffect) {
				y_passives.defense += 30;
			}
		} else if (tempEffect[0] === "tyro") {
			y_passives.dexterity += 500;
			if (y_edu.needleeffect) {
				y_passives.dexterity += 50;
			}
		}
	}

	// 状态效果减?
	x_passives.strength -= 10 * xSE[1][0] + 25 * xSE[1][2];
	x_passives.speed -= 10 * xSE[1][0] + 50 * xSE[1][1] + 25 * xSE[1][3];
	x_passives.defense -= 10 * xSE[1][0] + 25 * xSE[1][4];
	x_passives.dexterity -= 10 * xSE[1][0] + 50 * xSE[1][1] + 25 * xSE[1][5];

	y_passives.strength -= 10 * ySE[1][0] + 25 * ySE[1][2];
	y_passives.speed -= 10 * ySE[1][0] + 50 * ySE[1][1] + 25 * ySE[1][3];
	y_passives.defense -= 10 * ySE[1][0] + 25 * ySE[1][4];
	y_passives.dexterity -= 10 * ySE[1][0] + 50 * ySE[1][1] + 25 * ySE[1][5];

	// Adult Novelties公司技能处理
	if (x_comp.name === "Adult Novelties" && x_comp.star >= 7) {
		y_passives.speed -= 25;
	}
	if (y_comp.name === "Adult Novelties" && y_comp.star >= 7) {
		x_passives.speed -= 25;
	}

	// 应用武器特效到属性
	const xBaseStats = {
		strength: x.battleStats.strength * (1 + x_passives.strength / 100),
		speed: x.battleStats.speed * (1 + x_passives.speed / 100),
		defense: x.battleStats.defense * (1 + x_passives.defense / 100),
		dexterity: x.battleStats.dexterity * (1 + x_passives.dexterity / 100),
	};

	const yBaseStats = {
		strength: y.battleStats.strength * (1 + y_passives.strength / 100),
		speed: y.battleStats.speed * (1 + y_passives.speed / 100),
		defense: y.battleStats.defense * (1 + y_passives.defense / 100),
		dexterity: y.battleStats.dexterity * (1 + y_passives.dexterity / 100),
	};

	// 应用武器特效对属性的修改
	const xModifiedStats = applyWeaponBonusesToStats(xBaseStats, x_wep);
	const yModifiedStats = applyWeaponBonusesToStats(yBaseStats, y_wep);

	// 最终属性计算
	const xSTR = xModifiedStats.strength;
	let xSPD = xModifiedStats.speed;
	const xDEF = xModifiedStats.defense;
	let xDEX = xModifiedStats.dexterity;

	const ySTR = yModifiedStats.strength;
	let ySPD = yModifiedStats.speed;
	const yDEF = yModifiedStats.defense;
	let yDEX = yModifiedStats.dexterity;

	// 处理致盲等效?
	let sM = 1,
		dM = 1;
	let flash = 0,
		sand = 0,
		smoke = 0,
		conc = 0,
		pepper = 0,
		tear = 0;

	for (let i = 0; i < x_temps.length; i++) {
		const tempEffect = x_temps[i];
		if (!tempEffect) continue;
		const effectType = tempEffect[0] as string;
		if (effectType === "flash") {
			flash += 1;
			if (flash === 1) {
				sM = 1 / 5;
			} else if (flash === 2) {
				sM = ((1 / 5) * 3) / 5;
			}
		} else if (effectType === "sand") {
			sand += 1;
			if (sand === 1) {
				sM = 1 / 5;
			} else if (sand === 2) {
				sM = ((1 / 5) * 3) / 5;
			}
		} else if (effectType === "smoke") {
			smoke += 1;
			if (smoke === 1) {
				sM = 1 / 3;
			} else if (smoke === 2) {
				sM = ((1 / 3) * 2) / 3;
			}
		} else if (effectType === "conc") {
			conc += 1;
			if (conc === 1) {
				dM = 1 / 5;
			} else if (conc === 2) {
				dM = ((1 / 5) * 3) / 5;
			}
		} else if (effectType === "pepper") {
			pepper += 1;
			if (pepper === 1) {
				dM = 1 / 5;
			} else if (pepper === 2) {
				dM = ((1 / 5) * 3) / 5;
			}
		} else if (effectType === "tear") {
			tear += 1;
			if (tear === 1) {
				dM = 1 / 3;
			} else if (tear === 2) {
				dM = ((1 / 3) * 2) / 3;
			}
		}
	}

	xSPD *= sM;
	xDEX *= dM;

	// 重置并处理y玩家的致盲效?
	sM = 1;
	dM = 1;
	flash = 0;
	sand = 0;
	smoke = 0;
	conc = 0;
	pepper = 0;
	tear = 0;

	for (let i = 0; i < y_temps.length; i++) {
		const tempEffect = y_temps[i];
		if (!tempEffect) continue;
		const effectType = tempEffect[0] as string;
		if (effectType === "flash") {
			flash += 1;
			if (flash === 1) {
				sM = 1 / 5;
			} else if (flash === 2) {
				sM = ((1 / 5) * 3) / 5;
			}
		} else if (effectType === "sand") {
			sand += 1;
			if (sand === 1) {
				sM = 1 / 5;
			} else if (sand === 2) {
				sM = ((1 / 5) * 3) / 5;
			}
		} else if (effectType === "smoke") {
			smoke += 1;
			if (smoke === 1) {
				sM = 1 / 3;
			} else if (smoke === 2) {
				sM = ((1 / 3) * 2) / 3;
			}
		} else if (effectType === "conc") {
			conc += 1;
			if (conc === 1) {
				dM = 1 / 5;
			} else if (conc === 2) {
				dM = ((1 / 5) * 3) / 5;
			}
		} else if (effectType === "pepper") {
			pepper += 1;
			if (pepper === 1) {
				dM = 1 / 5;
			} else if (pepper === 2) {
				dM = ((1 / 5) * 3) / 5;
			}
		} else if (effectType === "tear") {
			tear += 1;
			if (tear === 1) {
				dM = 1 / 3;
			} else if (tear === 2) {
				dM = ((1 / 3) * 2) / 3;
			}
		}
	}

	ySPD *= sM;
	yDEX *= dM;

	return [
		[xSTR, xSPD, xDEF, xDEX],
		[ySTR, ySPD, yDEF, yDEX],
		[x_acc, x_dmg, x_crit],
		[y_acc, y_dmg, y_crit],
	];
}

// 初始化统计收集器
function initializeStatsCollector(
	player1Name: string,
	player2Name: string,
): BattleStatsCollector {
	// 创建工厂函数，确保每个玩家都有独立的对象实例
	const createEmptyPlayerStats = () => ({
		weaponDamage: {
			primary: 0,
			secondary: 0,
			melee: 0,
			temporary: 0,
			fists: 0,
			kick: 0,
		},
		damageTypes: {
			normal: 0,
			critical: 0,
			dot: 0,
			maxSingleHit: 0,
			totalHits: 0,
		},
		hitStats: {
			totalAttacks: 0,
			hits: 0,
			criticals: 0,
		},
	});

	const createEmptyWeaponEffects = () => ({});

	const createEmptyArmourEffects = () => ({
		effects: {},
		bodyPartHits: {
			head: 0,
			body: 0,
			hands: 0,
			legs: 0,
			feet: 0,
		},
		bodyPartDamage: {
			head: 0,
			body: 0,
			hands: 0,
			legs: 0,
			feet: 0,
		},
	});

	const createEmptyWeaponUsage = () => ({
		ammoConsumption: {},
		reloadCount: {},
		weaponChoices: {
			attack: {},
			defend: {},
		},
	});

	const createEmptyStatusEffects = () => ({
		appliedEffects: {},
		receivedEffects: {},
		controlTurnsLost: 0,
	});

	return {
		damageStats: {
			[player1Name]: createEmptyPlayerStats(),
			[player2Name]: createEmptyPlayerStats(),
		},
		weaponEffects: {
			[player1Name]: createEmptyWeaponEffects(),
			[player2Name]: createEmptyWeaponEffects(),
		},
		armourEffects: {
			[player1Name]: createEmptyArmourEffects(),
			[player2Name]: createEmptyArmourEffects(),
		},
		weaponUsage: {
			[player1Name]: createEmptyWeaponUsage(),
			[player2Name]: createEmptyWeaponUsage(),
		},
		statusEffects: {
			[player1Name]: createEmptyStatusEffects(),
			[player2Name]: createEmptyStatusEffects(),
		},
	};
}

// 统计收集工具函数
function recordDamage(
	attacker: string,
	weaponSlot: string,
	damage: number,
	isCritical: boolean,
): void {
	if (!battleStatsCollector) return;

	const stats = battleStatsCollector.damageStats[attacker];
	if (!stats) return;

	// 记录武器伤害分类
	if (weaponSlot in stats.weaponDamage) {
		stats.weaponDamage[weaponSlot as keyof typeof stats.weaponDamage] += damage;
	}

	// 记录伤害类型
	if (isCritical) {
		stats.damageTypes.critical += damage;
	} else {
		stats.damageTypes.normal += damage;
	}

	// 更新最大单次伤害
	stats.damageTypes.maxSingleHit = Math.max(
		stats.damageTypes.maxSingleHit,
		damage,
	);
	stats.damageTypes.totalHits++;
}

function recordAttack(attacker: string, hit: boolean, critical: boolean): void {
	if (!battleStatsCollector) return;

	const stats = battleStatsCollector.damageStats[attacker];
	if (!stats) return;

	stats.hitStats.totalAttacks++;
	if (hit) {
		stats.hitStats.hits++;
		if (critical) {
			stats.hitStats.criticals++;
		}
	}
}

function recordBodyPartHit(
	defender: string,
	bodyPart: string,
	damage?: number,
): void {
	if (!battleStatsCollector) return;

	const armourStats = battleStatsCollector.armourEffects[defender];
	if (!armourStats) return;

	// 将具体部位映射到统计分类
	let mappedPart: keyof typeof armourStats.bodyPartHits;

	const lowerPart = bodyPart.toLowerCase();
	if (lowerPart === "head" || lowerPart === "heart" || lowerPart === "throat") {
		mappedPart = "head";
	} else if (
		lowerPart === "chest" ||
		lowerPart === "stomach" ||
		lowerPart === "groin"
	) {
		mappedPart = "body";
	} else if (lowerPart.includes("arm") || lowerPart.includes("hand")) {
		mappedPart = "hands";
	} else if (lowerPart.includes("leg")) {
		mappedPart = "legs";
	} else if (lowerPart.includes("foot")) {
		mappedPart = "feet";
	} else {
		// 默认归类到身体
		mappedPart = "body";
	}

	armourStats.bodyPartHits[mappedPart]++;

	// 记录部位伤害（如果提供了伤害值）
	if (damage !== undefined && armourStats.bodyPartDamage) {
		armourStats.bodyPartDamage[mappedPart] += damage;
	}
}

function recordWeaponChoice(
	player: string,
	position: "attack" | "defend",
	weaponSlot: string,
): void {
	if (!battleStatsCollector) return;

	const usage = battleStatsCollector.weaponUsage[player];
	if (!usage) return;

	if (!usage.weaponChoices[position][weaponSlot]) {
		usage.weaponChoices[position][weaponSlot] = 0;
	}
	usage.weaponChoices[position][weaponSlot]++;
}

function recordAmmoConsumption(
	player: string,
	weaponSlot: string,
	ammoUsed: number,
): void {
	if (!battleStatsCollector) return;

	const usage = battleStatsCollector.weaponUsage[player];
	if (!usage) return;

	if (!usage.ammoConsumption[weaponSlot]) {
		usage.ammoConsumption[weaponSlot] = 0;
	}
	usage.ammoConsumption[weaponSlot] += ammoUsed;
}

function recordReload(player: string, weaponSlot: string): void {
	if (!battleStatsCollector) return;

	const usage = battleStatsCollector.weaponUsage[player];
	if (!usage) return;

	if (!usage.reloadCount[weaponSlot]) {
		usage.reloadCount[weaponSlot] = 0;
	}
	usage.reloadCount[weaponSlot]++;
}

// 获取当前战斗的统计数据并计算派生指标
function getFinalBattleStats(): BattleStatsCollector | null {
	if (!battleStatsCollector) return null;

	// 计算命中率和暴击率
	for (const playerName in battleStatsCollector.damageStats) {
		const stats = battleStatsCollector.damageStats[playerName];
		if (stats && stats.hitStats.totalAttacks > 0) {
			stats.hitStats["hitRate" as keyof typeof stats.hitStats] =
				Math.round(
					(stats.hitStats.hits / stats.hitStats.totalAttacks) * 100 * 100,
				) / 100;
		}
		if (stats && stats.hitStats.hits > 0) {
			stats.hitStats["critRate" as keyof typeof stats.hitStats] =
				Math.round(
					(stats.hitStats.criticals / stats.hitStats.hits) * 100 * 100,
				) / 100;
		}
	}

	return JSON.parse(JSON.stringify(battleStatsCollector)); // 返回深拷贝
}
