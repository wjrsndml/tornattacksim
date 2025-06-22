"use client";

import { getDefaultArmour, getDefaultWeapon, loadGameData } from "./dataLoader";
import { fight, setModData } from "./fightSimulator";
import type {
	ArmourData,
	BattleStats,
	FightPlayer,
	FightResults,
	PlayerPerks,
	WeaponData,
} from "./fightSimulatorTypes";

// Frontend Player interface
interface Player {
	name: string;
	life: number;
	stats: BattleStats;
	passives: BattleStats;
	weapons: {
		primary: WeaponData;
		secondary: WeaponData;
		melee: WeaponData;
		temporary: WeaponData;
	};
	armour: {
		head: ArmourData;
		body: ArmourData;
		hands: ArmourData;
		legs: ArmourData;
		feet: ArmourData;
	};
	attacksettings: {
		primary: { setting: number; reload: boolean };
		secondary: { setting: number; reload: boolean };
		melee: { setting: number; reload: boolean };
		temporary: { setting: number; reload: boolean };
	};
	defendsettings: {
		primary: { setting: number; reload: boolean };
		secondary: { setting: number; reload: boolean };
		melee: { setting: number; reload: boolean };
		temporary: { setting: number; reload: boolean };
	};
	perks: PlayerPerks;
}

// 转换前端武器数据为战斗武器数据
function convertToFightWeapon(weapon: WeaponData): WeaponData {
	const result: WeaponData = {
		name: weapon.name || "Unknown",
		damage: weapon.damage || 50,
		accuracy: weapon.accuracy || 50,
		category: weapon.category || "Fists",
		clipsize: weapon.clipsize || 0,
		rateoffire: weapon.rateoffire || [1, 1],
		experience: weapon.experience || 0,
		mods: weapon.mods || [],
	};

	if (weapon.bonus) {
		result.bonus = weapon.bonus;
	}

	if (weapon.ammo) {
		result.ammo = weapon.ammo;
	}

	if (weapon.weaponBonuses) {
		result.weaponBonuses = weapon.weaponBonuses;
	}

	return result;
}

// 转换前端护甲数据为战斗护甲数据
function convertToFightArmour(armour: ArmourData): ArmourData {
	return {
		armour: armour.armour || 0,
		set: armour.set || "n/a",
		type: armour.type || "",
	};
}

// 转换前端玩家数据为战斗玩家数据
function convertToFightPlayer(
	playerData: Player,
	position: "attack" | "defend",
	id: number,
): FightPlayer {
	const defaultPerks: PlayerPerks = {
		education: {
			damage: false,
			neckdamage: false,
			meleedamage: false,
			tempdamage: false,
			needleeffect: false,
			japanesedamage: false,
			fistdamage: false,
			critchance: false,
			machinegunaccuracy: false,
			smgaccuracy: false,
			pistolaccuracy: false,
			rifleaccuracy: false,
			heavyartilleryaccuracy: false,
			temporaryaccuracy: false,
			shotgunaccuracy: false,
			ammocontrol1: false,
			ammocontrol2: false,
		},
		faction: {
			accuracy: 0,
			damage: 0,
		},
		company: {
			name: "None",
			star: 0,
		},
		property: {
			damage: false,
		},
		merit: {
			critrate: 0,
		},
	};

	return {
		id,
		name: playerData.name || "Player",
		life: playerData.life || 5000,
		position,
		battleStats: playerData.stats || {
			strength: 1000,
			speed: 1000,
			defense: 1000,
			dexterity: 1000,
		},
		passives: playerData.passives || {
			strength: 0,
			speed: 0,
			defense: 0,
			dexterity: 0,
		},
		weapons: {
			primary: playerData.weapons?.primary
				? convertToFightWeapon(playerData.weapons.primary)
				: getDefaultWeapon("primary"),
			secondary: playerData.weapons?.secondary
				? convertToFightWeapon(playerData.weapons.secondary)
				: getDefaultWeapon("secondary"),
			melee: playerData.weapons?.melee
				? convertToFightWeapon(playerData.weapons.melee)
				: getDefaultWeapon("melee"),
			temporary: playerData.weapons?.temporary
				? convertToFightWeapon(playerData.weapons.temporary)
				: getDefaultWeapon("temporary"),
			fists: {
				name: "Fists",
				damage: 50,
				accuracy: 50,
				category: "Fists",
				clipsize: 0,
				rateoffire: [1, 1],
				experience: 0,
			},
			kick: {
				name: "Kick",
				damage: 40,
				accuracy: 55,
				category: "Fists",
				clipsize: 0,
				rateoffire: [1, 1],
				experience: 0,
			},
		},
		armour: {
			head: playerData.armour?.head
				? convertToFightArmour(playerData.armour.head)
				: getDefaultArmour("head"),
			body: playerData.armour?.body
				? convertToFightArmour(playerData.armour.body)
				: getDefaultArmour("body"),
			hands: playerData.armour?.hands
				? convertToFightArmour(playerData.armour.hands)
				: getDefaultArmour("hands"),
			legs: playerData.armour?.legs
				? convertToFightArmour(playerData.armour.legs)
				: getDefaultArmour("legs"),
			feet: playerData.armour?.feet
				? convertToFightArmour(playerData.armour.feet)
				: getDefaultArmour("feet"),
		},
		attacksettings: playerData.attacksettings,
		defendsettings: playerData.defendsettings,
		perks: {
			education: { ...defaultPerks.education, ...playerData.perks?.education },
			faction: { ...defaultPerks.faction, ...playerData.perks?.faction },
			company: { ...defaultPerks.company, ...playerData.perks?.company },
			property: { ...defaultPerks.property, ...playerData.perks?.property },
			merit: { ...defaultPerks.merit, ...playerData.perks?.merit },
		},
	};
}

// 客户端战斗模拟函数
export async function runClientSimulation(
	player1: Player,
	player2: Player,
	simulations: number = 1000,
	enableLog: boolean = false,
) {
	try {
		// 加载游戏数据
		const gameData = await loadGameData();

		// 设置改装数据到战斗模拟器
		if (gameData.mods) {
			setModData(gameData.mods);
		}

		// 创建玩家数据
		const hero = convertToFightPlayer(player1, "attack", 1);
		const villain = convertToFightPlayer(player2, "defend", 2);

		// 初始化结果数组
		const results: FightResults = [
			0, // heroWins
			0, // villainWins
			0, // stalemates
			0, // totalTurns
			0, // heroLifeLeft
			0, // villainLifeLeft
			[], // fightLog
			0, // hProcs
			{}, // hLifeStats - 使用对象而不是数组
			{}, // vLifeStats - 使用对象而不是数组
		];

		// 用于存储所有战斗日志的数组
		const allBattleLogs: Array<{
			battleNumber: number;
			winner: string;
			turns: number;
			heroDamageDealt: number;
			villainDamageDealt: number;
			heroFinalLife: number;
			villainFinalLife: number;
			battleLog: string[];
		}> = [];

		// 运行模拟
		for (let i = 0; i < simulations; i++) {
			// 创建单次战斗的结果数组
			const singleFightResults: FightResults = [
				0, // heroWins
				0, // villainWins
				0, // stalemates
				0, // totalTurns
				0, // heroLifeLeft
				0, // villainLifeLeft
				[], // fightLog
				0, // hProcs
				{}, // hLifeStats - 使用对象而不是数组
				{}, // vLifeStats - 使用对象而不是数组
			];

			const fightResults = fight(hero, villain, singleFightResults);

			// 如果启用了日志记录，收集这场战斗的数据
			if (enableLog) {
				// 确定胜利者
				let winner = "Stalemate";
				if (fightResults[1] > 0) {
					winner = player2.name; // villain wins
				} else if (fightResults[0] > 0) {
					winner = player1.name; // hero wins
				}

				allBattleLogs.push({
					battleNumber: i + 1,
					winner: winner,
					turns: fightResults[3], // 这场战斗的回合数
					heroDamageDealt: hero.life - fightResults[5], // 初始生命 - 对手剩余生命
					villainDamageDealt: villain.life - fightResults[4], // 初始生命 - 对手剩余生命
					heroFinalLife: fightResults[4], // 英雄剩余生命
					villainFinalLife: fightResults[5], // 反派剩余生命
					battleLog: fightResults[6] as string[], // 具体的战斗日志
				});
			}

			// 累积到总结果中
			results[0] += fightResults[0]; // hero wins
			results[1] += fightResults[1]; // villain wins
			results[2] += fightResults[2]; // stalemates
			results[3] += fightResults[3]; // total turns
			results[4] += fightResults[4]; // hero life left
			results[5] += fightResults[5]; // villain life left
			results[6] = fightResults[6]; // last fight log

			// 累积生命值分布
			if (fightResults[8]) {
				for (const life in fightResults[8]) {
					if (results[8][life] === undefined) {
						results[8][life] = fightResults[8][life] ?? 0;
					} else {
						results[8][life] += fightResults[8][life] ?? 0;
					}
				}
			}

			if (fightResults[9]) {
				for (const life in fightResults[9]) {
					if (results[9][life] === undefined) {
						results[9][life] = fightResults[9][life] ?? 0;
					} else {
						results[9][life] += fightResults[9][life] ?? 0;
					}
				}
			}
		}

		// 计算平均值
		const avgTurns = results[3] / simulations;
		const avgHeroLife = results[4] / simulations;
		const avgVillainLife = results[5] / simulations;

		// 计算胜率
		const heroWinRate = (results[0] / simulations) * 100;
		const villainWinRate = (results[1] / simulations) * 100;
		const stalemateRate = (results[2] / simulations) * 100;

		// 返回格式化的结果
		return {
			success: true,
			results: {
				totalSimulations: simulations,
				heroWins: results[0],
				villainWins: results[1],
				stalemates: results[2],
				heroWinRate,
				villainWinRate,
				stalemateRate,
				averageTurns: avgTurns,
				averageHeroLifeRemaining: avgHeroLife,
				averageVillainLifeRemaining: avgVillainLife,
				lastFightLog: results[6],
				heroLifeDistribution: results[8],
				villainLifeDistribution: results[9],
				allBattleLogs: enableLog ? allBattleLogs : undefined,
			},
		};
	} catch (error) {
		console.error("Client simulation error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
