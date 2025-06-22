import { canArmourBlock, getArmourCoverage } from "./dataLoader";
import type {
	ActionResults,
	ArmourSet,
	DOTEffects,
	FightPlayer,
	FightResults,
	ModData,
	StatusEffects,
	TempEffects,
	TurnResults,
	WeaponData,
	WeaponSettings,
	WeaponState,
} from "./fightSimulatorTypes";
import {
	applyWeaponBonusesPostDamage,
	applyWeaponBonusesToAmmo,
	applyWeaponBonusesToArmour,
	applyWeaponBonusesToCritical,
	applyWeaponBonusesToDamage,
	applyWeaponBonusesToStats,
	applyWeaponBonusesToWeaponState,
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

	let h_set = JSON.parse(JSON.stringify(hero.attacksettings));
	let v_set = JSON.parse(JSON.stringify(villain.defendsettings));
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

		if (hCL === 0) {
			results[1] += 1; // villain wins
			fightLogMessage.push(`${villain.name} won. `);
			break;
		} else if (vCL === 0) {
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
	results[4] += Math.max(0, hCL); // 确保累积的也是非负生命值
	results[5] += Math.max(0, vCL); // 确保累积的也是非负生命值
	results[6] = fightLogMessage;

	// 确保生命值不为负数，死亡时记录为0
	const finalHeroLife = Math.max(0, hCL);
	const finalVillainLife = Math.max(0, vCL);

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

	// 英雄行动
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

	if (vCL === 0) {
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

	// 反派行动
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
	if (p.position === "attack") {
		let weaponChoice: string = "primary";
		let settingInteger = 5;

		for (const weapon in weaponSettings) {
			const weaponSetting = weaponSettings[weapon];
			if (weaponSetting && weaponSetting.setting !== 0) {
				if (weaponSetting.setting < settingInteger) {
					settingInteger = weaponSetting.setting;
					weaponChoice = weapon;
				}
			}
		}

		return weaponChoice;
	} else if (p.position === "defend") {
		let weaponChoice: string = "primary";
		const weaponArray: string[] = [];
		let settingSum = 0;

		for (const weapon in weaponSettings) {
			const weaponSetting = weaponSettings[weapon as keyof WeaponSettings];
			if (weaponSetting && !Number.isNaN(weaponSetting.setting)) {
				settingSum += weaponSetting.setting;
				if (weaponSetting.setting !== 0) {
					weaponArray.push(weapon);
				}
			}
		}

		const rng = Math.ceil(Math.random() * settingSum + 1);
		const primarySetting = weaponSettings.primary?.setting || 0;
		const secondarySetting = weaponSettings.secondary?.setting || 0;
		const meleeSetting = weaponSettings.melee?.setting || 0;

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

	// 应用技能、改装、临时效果
	// 应用技能、改装、临时效�?
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

	const xSTR = pmt[0][0],
		xSPD = pmt[0][1];
	// _xDEF = pmt[0][2], _xDEX = pmt[0][3] - 暂时未使用
	let x_acc_bonus = pmt[2][0],
		x_dmg_bonus = pmt[2][1],
		x_crit_chance = pmt[2][2];

	const yDEF = pmt[1][2],
		yDEX = pmt[1][3];
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
					log.push(`Burning damaged ${y.name} for ${dotDMG}`);

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
					log.push(`Poison damaged ${y.name} for ${dotDMG}`);

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
					log.push(`Laceration damaged ${y.name} for ${dotDMG}`);

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
					log.push(`Severe burning damaged ${y.name} for ${dotDMG}`);

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
			xMD: number = 0,
			yDM: number = 0,
			xWDM: number = 0,
			yAM: number = 0,
			xHOM: boolean = false,
			xDV: number = 0,
			xDMG = 0;
		let x_pen = 1,
			x_ammo_dmg = 1;

		// 非伤害性临时武器不产生命中率和伤害�?
		const currentWeapon = xW[xCW as keyof typeof xW];
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
			xHOM = hitOrMiss(xFHC);

			if (xHOM) {
				if (
					xCW === "temporary" &&
					currentWeapon.name !== "Ninja Stars" &&
					currentWeapon.name !== "Throwing Knife"
				) {
					xBP = ["chest", 1 / 1.75];
				} else {
					// 应用武器特效到暴击率
					const [modifiedCritChance, modifiedCritDamage] =
						applyWeaponBonusesToCritical(
							x_crit_chance,
							xBP?.[1] || 1.75, // 默认暴击倍数
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
					xBP = selectBodyPart(x, modifiedCritChance);
					// 更新暴击倍数
					if (xBP[1] > 1) {
						xBP[1] = modifiedCritDamage;
					}
				}

				xMD = maxDamage(xSTR);
				yDM = (100 - damageMitigation(yDEF, xSTR)) / 100;
				xWDM = xW[xCW as keyof typeof xW].damage / 10;

				// 应用武器特效到护甲减免
				const baseArmourMitigation = armourMitigation(xBP[0], yA);
				const modifiedArmourMitigation = applyWeaponBonusesToArmour(
					baseArmourMitigation,
					currentWeapon,
					{
						attacker: x,
						target: y,
						weapon: currentWeapon,
						bodyPart: xBP[0],
						isCritical: xBP[1] > 1,
						turn: turn,
						currentWeaponSlot: xCW,
					},
				);
				yAM = (100 - modifiedArmourMitigation / x_pen) / 100;
				xDV = variance();

				xDMG = Math.round(
					xBP[1] *
						xMD *
						yDM *
						xWDM *
						yAM *
						xDV *
						(1 + x_dmg_bonus / 100) *
						x_ammo_dmg,
				);

				// 应用武器特效到伤害
				xDMG = applyWeaponBonusesToDamage(xDMG, currentWeapon, {
					attacker: x,
					target: y,
					weapon: currentWeapon,
					bodyPart: xBP[0],
					isCritical: xBP[1] > 1,
					turn: turn,
					currentWeaponSlot: xCW,
				});

				if (Number.isNaN(xDMG)) {
					xDMG = 0;
				}
			}
		}

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
					if (xDMG > yCL) {
						xDMG = yCL;
					}

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
					if (xDMG > yCL) {
						xDMG = yCL;
					}
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
				if (xDMG > yCL) {
					xDMG = yCL;
				}

				xRF = roundsFired(xW[xCW], xWS[xCW]);
				if (xHOM) {
					// 检测触发的特效
					const triggeredBonuses = getTriggeredBonuses(primaryWeapon, {
						attacker: x,
						target: y,
						weapon: primaryWeapon,
						bodyPart: xBP[0],
						isCritical: xBP[1] > 1,
						turn: turn,
						currentWeaponSlot: xCW,
					});

					const bonusText =
						triggeredBonuses.length > 0
							? ` [${triggeredBonuses.join(", ")}]`
							: "";

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
							xDMG +
							bonusText,
					);

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

								if (xHOM) {
									xBP = selectBodyPart(x, x_crit_chance);
									yAM = (100 - armourMitigation(xBP[0], yA) / x_pen) / 100;
									xDV = variance();
									xDMG = Math.round(
										xBP[1] *
											xMD *
											yDM *
											xWDM *
											yAM *
											xDV *
											(1 + x_dmg_bonus / 100) *
											x_ammo_dmg,
									);
									if (Number.isNaN(xDMG)) {
										xDMG = 0;
									}
								}

								if (totalDMG + xDMG > yCL) {
									xDMG = yCL - totalDMG;
								}

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
						isCritical: xBP[1] > 1,
						turn: turn,
						currentWeaponSlot: xCW,
					},
				);

				primaryWeaponState.ammoleft -= modifiedAmmoConsumed;
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

			if (xDMG > yCL) {
				xDMG = yCL;
			}

			const xRF = roundsFired(secondaryWeapon, secondaryWeaponState);

			if (xHOM) {
				// 检测触发的特效
				const triggeredBonuses = getTriggeredBonuses(secondaryWeapon, {
					attacker: x,
					target: y,
					weapon: secondaryWeapon,
					bodyPart: xBP[0],
					isCritical: xBP[1] > 1,
					turn: turn,
					currentWeaponSlot: xCW,
				});

				const bonusText =
					triggeredBonuses.length > 0
						? ` [${triggeredBonuses.join(", ")}]`
						: "";

				log.push(
					x.name +
						" fired " +
						xRF +
						" " +
						getAmmoDisplayName(secondaryWeapon.ammo) +
						" rounds of their " +
						xW[xCW].name +
						" hitting " +
						y.name +
						" in the " +
						xBP[0] +
						" for " +
						xDMG +
						bonusText,
				);

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
						isCritical: xBP[1] > 1,
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
			if (xDMG > yCL) {
				xDMG = yCL;
			}

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
						isCritical: xBP[1] > 1,
						turn: turn,
						currentWeaponSlot: xCW,
					});

					const bonusText =
						triggeredBonuses.length > 0
							? ` [${triggeredBonuses.join(", ")}]`
							: "";

					log.push(
						x.name +
							" hit " +
							y.name +
							" with their " +
							weaponName +
							" in the " +
							xBP[0] +
							" for " +
							xDMG +
							bonusText,
					);

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
						isCritical: xBP[1] > 1,
						turn: turn,
						currentWeaponSlot: xCW,
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
		}

		// 扣除伤害
		yCL -= xDMG;

		// 应用武器特效的后处理效果（如Bloodlust生命回复）
		if (xDMG > 0) {
			const healAmount = applyWeaponBonusesPostDamage(
				x,
				y,
				xDMG,
				currentWeapon,
				{
					attacker: x,
					target: y,
					weapon: currentWeapon,
					bodyPart: xBP[0],
					isCritical: xBP[1] > 1,
					turn: turn,
					currentWeaponSlot: xCW,
				},
			);

			if (healAmount > 0) {
				const maxLife = x.life;
				const actualHeal = Math.min(healAmount, maxLife - xCL);
				if (actualHeal > 0) {
					xCL += actualHeal;
					log.push(`${x.name} recovered ${actualHeal} life from Bloodlust`);
				}
			}
		}

		if (yCL === 0) {
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
					log.push(`Burning damaged ${y.name} for ${dotDMG}`);

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
					log.push(`Poison damaged ${y.name} for ${dotDMG}`);

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
					log.push(`Laceration damaged ${y.name} for ${dotDMG}`);

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
					log.push(`Severe burning damaged ${y.name} for ${dotDMG}`);

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
