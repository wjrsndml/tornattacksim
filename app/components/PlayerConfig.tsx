"use client";

import {
	BarChart3,
	Download,
	Eye,
	EyeOff,
	Settings,
	Shield,
	Swords,
	Zap,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import {
	getArmourById,
	//getArmourList,
	getCompanyList,
	getCompanyType,
	getWeaponById,
	//getWeaponList,
	loadGameData,
} from "../lib/dataLoader";
import type {
	ArmourData,
	ArmourEffect,
	BattleStats,
	CompanyPerks,
	EducationPerks,
	FactionPerks,
	MeritPerks,
	PropertyPerks,
	SelectedWeaponBonus,
	WeaponData,
} from "../lib/fightSimulatorTypes";
import type {
	TornApiResponse,
	TornEquipmentResponse,
	TornItemDetailsResponse,
	TornWeaponExpResponse,
} from "../lib/tornApiResponse";
import ArmourCoverage from "./ArmourCoverage";
import ArmourSelector from "./ArmourSelector";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FormattedInput } from "./ui/formatted-input";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import WeaponSelector from "./WeaponSelector";

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
	attackSettings: {
		primary: { setting: number; reload: boolean };
		secondary: { setting: number; reload: boolean };
		melee: { setting: number; reload: boolean };
		temporary: { setting: number; reload: boolean };
	};
	defendSettings: {
		primary: { setting: number; reload: boolean };
		secondary: { setting: number; reload: boolean };
		melee: { setting: number; reload: boolean };
		temporary: { setting: number; reload: boolean };
	};
	perks: {
		education: EducationPerks;
		faction: FactionPerks;
		company: CompanyPerks;
		property: PropertyPerks;
		merit: MeritPerks;
	};
}

interface PlayerConfigProps {
	player: Player;
	onPlayerChange: (player: Player) => void;
	playerName: string;
	isAttacker: boolean;
	onCopyFromOther: () => void;
	// 新增：用于导出时获取双方的攻击设置
	attackerSettings?: Player["attackSettings"];
	defenderSettings?: Player["attackSettings"];
}

export default function PlayerConfig({
	player,
	onPlayerChange,
	playerName,
	isAttacker,
	onCopyFromOther,
	attackerSettings,
	defenderSettings,
}: PlayerConfigProps) {
	const [companies, setCompanies] = useState<string[]>([]);
	const [_showAdvanced, _setShowAdvanced] = useState(false);
	const [importText, setImportText] = useState("");
	const [exportText, setExportText] = useState("");
	const [activeTab, setActiveTab] = useState<
		"stats" | "weapons" | "armour" | "combat" | "advanced"
	>("stats");

	// 新增：导入相关的状态
	const [importKey, setImportKey] = useState("");
	const [isImporting, setIsImporting] = useState(false);
	const [showApiKey, setShowApiKey] = useState(false);

	// 新增：锻炼模拟器相关状态
	const [inputMode, setInputMode] = useState<"manual" | "gym">("manual");
	const [gymParams, setGymParams] = useState({
		happiness: 5025,
		gymRatio: 7.3,
		energyPerSession: 10,
		bonusMultiplier: 1.2,
		totalEnergy: {
			strength: 0,
			speed: 0,
			defense: 0,
			dexterity: 0,
		},
		initialStats: {
			strength: 10,
			speed: 10,
			defense: 10,
			dexterity: 10,
		},
	});

	const playerId = isAttacker ? "attacker" : "defender";

	// 生成唯一的 ID
	const secondaryMasteryId = useId();
	const meleeMasteryId = useId();
	const temporaryMasteryId = useId();
	const pistolMasteryId = useId();
	const rifleMasteryId = useId();
	const shotgunMasteryId = useId();
	const smgMasteryId = useId();
	const machinegunMasteryId = useId();
	const heavyartilleryMasteryId = useId();

	useEffect(() => {
		async function loadData() {
			try {
				await loadGameData();
				const companyList = getCompanyList();
				setCompanies(companyList);
			} catch (error) {
				console.error("Failed to load data:", error);
			}
		}
		loadData();
	}, []);

	const tabs = [
		{ id: "stats", label: "属性", icon: BarChart3 },
		{ id: "weapons", label: "武器", icon: Zap },
		{ id: "armour", label: "护甲", icon: Shield },
		{ id: "combat", label: "战斗", icon: Swords },
		{ id: "advanced", label: "高级", icon: Settings },
		{ id: "import-export", label: "导入", icon: Download },
	] as const;

	const updatePlayer = (updates: Partial<Player>) => {
		onPlayerChange({ ...player, ...updates });
	};

	const updateStats = (field: keyof BattleStats, value: number) => {
		updatePlayer({
			stats: { ...player.stats, [field]: value },
		});
	};

	const updatePassives = (field: keyof BattleStats, value: number) => {
		updatePlayer({
			passives: { ...player.passives, [field]: value },
		});
	};

	const updateWeapon = (
		weaponType: keyof Player["weapons"],
		weapon: WeaponData,
	) => {
		updatePlayer({
			weapons: { ...player.weapons, [weaponType]: weapon },
		});
	};

	const updateArmour = (
		armourType: keyof Player["armour"],
		armour: ArmourData,
	) => {
		updatePlayer({
			armour: { ...player.armour, [armourType]: armour },
		});
	};

	const updateEducation = (field: keyof EducationPerks, value: boolean) => {
		updatePlayer({
			perks: {
				...player.perks,
				education: { ...player.perks.education, [field]: value },
			},
		});
	};

	const updateFaction = (field: keyof FactionPerks, value: number) => {
		updatePlayer({
			perks: {
				...player.perks,
				faction: { ...player.perks.faction, [field]: value },
			},
		});
	};

	const updateCompany = (field: keyof CompanyPerks, value: string | number) => {
		updatePlayer({
			perks: {
				...player.perks,
				company: { ...player.perks.company, [field]: value },
			},
		});
	};

	const updateProperty = (field: keyof PropertyPerks, value: boolean) => {
		updatePlayer({
			perks: {
				...player.perks,
				property: { ...player.perks.property, [field]: value },
			},
		});
	};

	const updateMerit = (field: keyof MeritPerks, value: number) => {
		updatePlayer({
			perks: {
				...player.perks,
				merit: { ...player.perks.merit, [field]: value },
			},
		});
	};

	const updateAttackSettings = (
		weaponType: keyof Player["attackSettings"],
		field: "setting" | "reload",
		value: number | boolean,
	) => {
		updatePlayer({
			attackSettings: {
				...player.attackSettings,
				[weaponType]: { ...player.attackSettings[weaponType], [field]: value },
			},
		});
	};

	const updateDefendSettings = (
		weaponType: keyof Player["defendSettings"],
		field: "setting" | "reload",
		value: number | boolean,
	) => {
		updatePlayer({
			defendSettings: {
				...player.defendSettings,
				[weaponType]: { ...player.defendSettings[weaponType], [field]: value },
			},
		});
	};

	const multiplyStats = (multiplier: number) => {
		updatePlayer({
			stats: {
				strength: Math.round(player.stats.strength * multiplier),
				speed: Math.round(player.stats.speed * multiplier),
				defense: Math.round(player.stats.defense * multiplier),
				dexterity: Math.round(player.stats.dexterity * multiplier),
			},
		});
	};

	const exportPlayer = () => {
		// 按照原版格式导出：数组格式，每个索引对应特定数据
		const position = isAttacker ? "attack" : "defend";

		// 转换mods格式：从 string[] 到 {one: string, two: string}
		const convertModsToObject = (mods: string[] | undefined) => {
			if (!mods || !Array.isArray(mods)) return { one: "n/a", two: "n/a" };
			return {
				one: mods[0] || "n/a",
				two: mods[1] || "n/a",
			};
		};

		const exportData = [
			position, // 0: position
			player.name, // 1: name
			1, // 2: id (固定为1或2)
			player.stats, // 3: battleStats
			player.life, // 4: life
			player.passives, // 5: passives
			{
				primary: {
					...player.weapons.primary,
					mods: convertModsToObject(player.weapons.primary.mods),
				},
				secondary: {
					...player.weapons.secondary,
					mods: convertModsToObject(player.weapons.secondary.mods),
				},
				melee: player.weapons.melee,
				temporary: player.weapons.temporary,
				fists: {
					damage: 12.14,
					accuracy: 50.0,
					category: "Unarmed",
					experience: 0,
				},
				kick: {
					damage: 37.44,
					accuracy: 40.71,
					category: "Unarmed",
					experience: 0,
				},
			}, // 6: weapons
			player.armour, // 7: armour
			attackerSettings || player.attackSettings, // 8: 攻击方的攻击设置
			defenderSettings || player.defendSettings, // 9: 防守方的攻击设置
			player.perks.education, // 10: educationPerks
			player.perks.faction, // 11: factionPerks
			player.perks.company, // 12: companyPerks
			player.perks.property, // 13: propertyPerks
			player.perks.merit, // 14: meritPerks
			inputMode, // 15: inputMode
			gymParams, // 16: gymParams (锻炼参数和能量设置)
		];

		const exportString = JSON.stringify(exportData);
		setExportText(exportString);
		navigator.clipboard.writeText(exportString);
	};

	const importPlayer = () => {
		try {
			const importData = JSON.parse(importText);

			// 检查是否是数组格式（原版格式）
			if (Array.isArray(importData) && importData.length >= 15) {
				// 原版数组格式
				// const _position = importData[0]; // 位置信息暂时不使用
				const name = importData[1] || player.name;
				let stats = importData[3] || player.stats;
				const life = importData[4] || player.life;
				const passives = importData[5] || player.passives;
				const weapons = importData[6] || player.weapons;
				const armour = importData[7] || player.armour;
				const attackSettings = importData[8] || player.attackSettings;
				const defendSettings = importData[9] || player.defendSettings;
				const education = importData[10] || player.perks.education;
				const faction = importData[11] || player.perks.faction;
				const company = importData[12] || player.perks.company;
				const property = importData[13] || player.perks.property;
				const merit = importData[14] || player.perks.merit;

				// 新增：导入锻炼参数
				const importedInputMode = importData[15];
				const importedGymParams = importData[16];

				// 转换武器mods格式：从 {one: string, two: string} 到 string[]
				const convertMods = (weaponMods: unknown): string[] => {
					if (!weaponMods) return [];
					if (Array.isArray(weaponMods)) return weaponMods;
					if (typeof weaponMods === "object" && weaponMods !== null) {
						const modsObj = weaponMods as Record<string, unknown>;
						const mods: string[] = [];
						if (modsObj.one && modsObj.one !== "n/a")
							mods.push(String(modsObj.one));
						if (modsObj.two && modsObj.two !== "n/a")
							mods.push(String(modsObj.two));
						return mods;
					}
					return [];
				};

				// 根据当前位置选择合适的攻击设置
				let finalAttackSettings = player.attackSettings;
				let finalDefendSettings = player.defendSettings;
				if (isAttacker) {
					// 导入到攻击方 -> 更新 attackSettings
					finalAttackSettings = attackSettings || player.attackSettings;
				} else {
					// 导入到防守方 -> 更新 defendSettings
					finalDefendSettings = defendSettings || player.defendSettings;
				}

				// 处理锻炼参数导入和BS计算优先级
				if (importedInputMode && importedGymParams) {
					// 验证并合并锻炼参数，使用默认值填充缺失的属性
					const validatedGymParams = {
						happiness:
							typeof importedGymParams.happiness === "number"
								? importedGymParams.happiness
								: gymParams.happiness,
						gymRatio:
							typeof importedGymParams.gymRatio === "number"
								? importedGymParams.gymRatio
								: gymParams.gymRatio,
						energyPerSession:
							typeof importedGymParams.energyPerSession === "number"
								? importedGymParams.energyPerSession
								: gymParams.energyPerSession,
						bonusMultiplier:
							typeof importedGymParams.bonusMultiplier === "number"
								? importedGymParams.bonusMultiplier
								: gymParams.bonusMultiplier,
						totalEnergy: {
							strength:
								importedGymParams.totalEnergy &&
								typeof importedGymParams.totalEnergy.strength === "number"
									? importedGymParams.totalEnergy.strength
									: gymParams.totalEnergy.strength,
							speed:
								importedGymParams.totalEnergy &&
								typeof importedGymParams.totalEnergy.speed === "number"
									? importedGymParams.totalEnergy.speed
									: gymParams.totalEnergy.speed,
							defense:
								importedGymParams.totalEnergy &&
								typeof importedGymParams.totalEnergy.defense === "number"
									? importedGymParams.totalEnergy.defense
									: gymParams.totalEnergy.defense,
							dexterity:
								importedGymParams.totalEnergy &&
								typeof importedGymParams.totalEnergy.dexterity === "number"
									? importedGymParams.totalEnergy.dexterity
									: gymParams.totalEnergy.dexterity,
						},
						initialStats: {
							strength:
								importedGymParams.initialStats &&
								typeof importedGymParams.initialStats.strength === "number"
									? importedGymParams.initialStats.strength
									: gymParams.initialStats.strength,
							speed:
								importedGymParams.initialStats &&
								typeof importedGymParams.initialStats.speed === "number"
									? importedGymParams.initialStats.speed
									: gymParams.initialStats.speed,
							defense:
								importedGymParams.initialStats &&
								typeof importedGymParams.initialStats.defense === "number"
									? importedGymParams.initialStats.defense
									: gymParams.initialStats.defense,
							dexterity:
								importedGymParams.initialStats &&
								typeof importedGymParams.initialStats.dexterity === "number"
									? importedGymParams.initialStats.dexterity
									: gymParams.initialStats.dexterity,
						},
					};

					// 导入锻炼参数
					setInputMode(importedInputMode);
					setGymParams(validatedGymParams);

					// 如果导入的是锻炼模式，且有能量设置，则重新计算BS值
					if (importedInputMode === "gym" && validatedGymParams.totalEnergy) {
						const hasAnyEnergy = Object.values(
							validatedGymParams.totalEnergy,
						).some((energy) => typeof energy === "number" && energy > 0);
						if (hasAnyEnergy) {
							// 使用导入的锻炼参数计算新的BS值，优先于导入数据中的stats
							const calculatedStats = {
								strength: simulateTrainingWithParams(
									"Strength",
									validatedGymParams.initialStats.strength,
									validatedGymParams.totalEnergy.strength,
									validatedGymParams,
								),
								speed: simulateTrainingWithParams(
									"Speed",
									validatedGymParams.initialStats.speed,
									validatedGymParams.totalEnergy.speed,
									validatedGymParams,
								),
								defense: simulateTrainingWithParams(
									"Defense",
									validatedGymParams.initialStats.defense,
									validatedGymParams.totalEnergy.defense,
									validatedGymParams,
								),
								dexterity: simulateTrainingWithParams(
									"Dexterity",
									validatedGymParams.initialStats.dexterity,
									validatedGymParams.totalEnergy.dexterity,
									validatedGymParams,
								),
							};
							stats = calculatedStats; // 覆盖导入的stats
						}
					}
				}

				updatePlayer({
					name,
					life,
					stats,
					passives,
					weapons: {
						primary: {
							...(weapons.primary || player.weapons.primary),
							mods: convertMods(weapons.primary?.mods),
						},
						secondary: {
							...(weapons.secondary || player.weapons.secondary),
							mods: convertMods(weapons.secondary?.mods),
						},
						melee: weapons.melee || player.weapons.melee,
						temporary: weapons.temporary || player.weapons.temporary,
					},
					armour,
					attackSettings: finalAttackSettings,
					defendSettings: finalDefendSettings,
					perks: {
						education,
						faction,
						company,
						property,
						merit,
					},
				});
			} else if (typeof importData === "object" && !Array.isArray(importData)) {
				// 处理对象格式（新格式兼容）
				// 根据当前位置选择合适的攻击设置
				// attackSettings = 攻击方的攻击设置
				// defendSettings = 防守方的攻击设置
				const objAttackerSettings =
					importData.attackSettings || player.attackSettings;
				const objDefenderSettings =
					importData.defendSettings || player.defendSettings;

				const finalObjAttackSettings = isAttacker
					? objAttackerSettings // 导入到攻击方：使用攻击方的攻击设置
					: objDefenderSettings; // 导入到防守方：使用防守方的攻击设置

				// 防守设置保持当前角色的设置不变
				const finalObjDefendSettings = player.defendSettings;

				updatePlayer({
					name: importData.name || player.name,
					life: importData.life || player.life,
					stats: importData.stats || player.stats,
					passives: importData.passives || player.passives,
					weapons: importData.weapons || player.weapons,
					armour: importData.armour || player.armour,
					attackSettings: finalObjAttackSettings,
					defendSettings: finalObjDefendSettings,
					perks: importData.perks || player.perks,
				});
			} else {
				throw new Error("无效的导入格式");
			}

			setImportText("");
			alert("导入成功！");
		} catch (error) {
			console.error("Import error:", error);
			alert("导入失败：无效的JSON格式或数据结构");
		}
	};

	const handleTornImport = async () => {
		if (!importKey.trim()) {
			alert("请输入API Key");
			return;
		}

		await loadGameData();

		setIsImporting(true);
		try {
			// 1. 获取用户基本信息、技能等
			const response = await fetch(
				`https://api.torn.com/user/?selections=profile,basic,equipment,perks,battlestats&key=${importKey.trim()}`,
			);

			if (response.status !== 200) {
				throw new Error(`API请求失败，状态码: ${response.status}`);
			}

			const data = await response.json();

			if (data.error) {
				throw new Error(`API返回错误: ${data.error.error || data.error}`);
			}

			// 2. 获取详细装备信息（使用v2 API）
			let equipmentDetails: TornItemDetailsResponse[] = [];
			try {
				const equipmentResponse = await fetch(
					`https://api.torn.com/v2/user?selections=equipment&key=${importKey.trim()}`,
				);

				if (equipmentResponse.status === 200) {
					const equipmentData: TornEquipmentResponse =
						await equipmentResponse.json();

					if (equipmentData.equipment) {
						// 获取每个装备的详细信息
						const detailPromises = equipmentData.equipment
							.filter((item) => item.type !== "Clothing") // 过滤掉衣服
							.map(async (item) => {
								try {
									const detailResponse = await fetch(
										`https://api.torn.com/v2/torn?selections=itemdetails&id=${item.UID}&key=${importKey.trim()}`,
									);
									if (detailResponse.status === 200) {
										const detail = await detailResponse.json();
										if (!detail.error) {
											return detail as TornItemDetailsResponse;
										}
									}
								} catch (error) {
									console.warn(`获取装备详情失败 (UID: ${item.UID}):`, error);
								}
								return null;
							});

						const details = await Promise.all(detailPromises);
						equipmentDetails = details.filter(
							(detail) => detail !== null,
						) as TornItemDetailsResponse[];
					}
				}
			} catch (equipmentError) {
				console.warn("获取装备信息失败:", equipmentError);
			}

			// 3. 获取武器经验信息（使用v2 API）
			let weaponExpData: TornWeaponExpResponse | null = null;
			try {
				const weaponExpResponse = await fetch(
					`https://api.torn.com/v2/user?selections=weaponexp&key=${importKey.trim()}`,
				);

				if (weaponExpResponse.status === 200) {
					const expData = await weaponExpResponse.json();
					if (!expData.error && expData.weaponexp) {
						weaponExpData = expData as TornWeaponExpResponse;
						console.log("武器经验数据:", weaponExpData);
					}
				}
			} catch (weaponExpError) {
				console.warn("获取武器经验失败:", weaponExpError);
			}

			// 4. 提取公司ID并获取公司信息
			if (data.job?.company_id) {
				try {
					const companyResponse = await fetch(
						`https://api.torn.com/company/${data.job.company_id}?selections=&key=${importKey.trim()}`,
					);

					if (companyResponse.status === 200) {
						const companyData = await companyResponse.json();
						if (!companyData.error) {
							Object.assign(data, companyData);
						}
					}
				} catch (companyError) {
					console.warn("获取公司信息失败:", companyError);
				}
			}

			console.log("Torn API数据:", data);
			console.log("装备详情:", equipmentDetails);

			// 5. 更新玩家数据
			updatePlayerFromTornData(data, equipmentDetails, weaponExpData);

			console.log(
				`Torn ${isAttacker ? "Attacker" : "Defender"} API数据获取成功`,
			);
		} catch (error) {
			console.error("Torn API导入错误:", error);
			alert(`导入失败: ${error instanceof Error ? error.message : "未知错误"}`);
		} finally {
			setIsImporting(false);
		}
	};

	const updatePlayerFromTornData = (
		tornData: TornApiResponse,
		equipmentDetails?: TornItemDetailsResponse[],
		weaponExpData?: TornWeaponExpResponse | null,
	) => {
		try {
			console.log("开始更新玩家属性，Torn数据:", tornData);

			const updates: Partial<Player> = {};
			const weaponsUpdates: Partial<Player["weapons"]> = {};
			const armourUpdates: Partial<Player["armour"]> = {};
			const failedImports: string[] = []; // 记录导入失败的装备

			// 更新基础信息
			if (tornData.name) {
				updates.name = tornData.name;
			}

			// 更新生命值
			if (tornData.life) {
				updates.life = tornData.life.maximum;
			}

			// 更新基础属性
			if (tornData.strength) {
				updates.stats = {
					strength: tornData.strength,
					speed: tornData.speed,
					defense: tornData.defense,
					dexterity: tornData.dexterity,
				};
			}

			// 更新被动属性
			updates.passives = {
				strength: tornData.strength_modifier,
				speed: tornData.speed_modifier,
				defense: tornData.defense_modifier,
				dexterity: tornData.dexterity_modifier,
			};

			// 初始化perks更新对象
			const perksUpdates: Partial<Player["perks"]> = {};

			// 更新教育技能
			if (tornData.education_perks) {
				const educationPerks: EducationPerks = {
					damage: tornData.education_perks.some((perk: string) =>
						perk.includes("+ 1% damage"),
					),
					meleedamage: tornData.education_perks.some((perk: string) =>
						perk.includes("+ 2% melee damage"),
					),
					japanesedamage: tornData.education_perks.some((perk: string) =>
						perk.includes("+ 10% Japanese blade damage"),
					),
					tempdamage: tornData.education_perks.some((perk: string) =>
						perk.includes("+ 5% temporary weapon damage"),
					),
					needleeffect: tornData.education_perks.some((perk: string) =>
						perk.includes("+ 10% steroid effectiveness"),
					),
					fistdamage: tornData.education_perks.some((perk: string) =>
						perk.includes("+ 100% fist damage"),
					),
					neckdamage: tornData.education_perks.some((perk: string) =>
						perk.includes("+ 10% throat damage"),
					),
					critchance: tornData.education_perks.some((perk: string) =>
						perk.includes("+ 3% critical hit rate"),
					),
					ammocontrol1: tornData.education_perks.some(
						(perk: string) =>
							perk.includes("+ 5% ammo management") ||
							perk.includes("+ 25% ammo management"),
					),
					ammocontrol2: tornData.education_perks.some(
						(perk: string) =>
							perk.includes("+ 20% ammo management") ||
							perk.includes("+ 25% ammo management"),
					),
					machinegunaccuracy: tornData.education_perks.some((perk: string) =>
						perk.includes("+ 1.0 machine gun accuracy"),
					),
					smgaccuracy: tornData.education_perks.some((perk: string) =>
						perk.includes("+ 1.0 submachine accuracy"),
					),
					pistolaccuracy: tornData.education_perks.some((perk: string) =>
						perk.includes("+ 1.0 pistol accuracy"),
					),
					rifleaccuracy: tornData.education_perks.some((perk: string) =>
						perk.includes("+ 1.0 rifle accuracy"),
					),
					heavyartilleryaccuracy: tornData.education_perks.some(
						(perk: string) => perk.includes("+ 1.0 heavy artillery accuracy"),
					),
					shotgunaccuracy: tornData.education_perks.some((perk: string) =>
						perk.includes("+ 1.0 shotgun accuracy"),
					),
					temporaryaccuracy: tornData.education_perks.some((perk: string) =>
						perk.includes("+ 1.0 temporary weapon accuracy"),
					),
					preferKick: tornData.education_perks.some((perk: string) =>
						perk.includes("Kick attack unlocked"),
					),
				};
				perksUpdates.education = educationPerks;
			}

			// 更新派系技能
			if (tornData.faction_perks) {
				const factionPerks: FactionPerks = {
					accuracy: tornData.faction_perks.some((perk: string) =>
						perk.includes("+ 2% accuracy"),
					)
						? 2
						: 0,
					damage: tornData.faction_perks.some((perk: string) =>
						perk.includes("+ 2% damage"),
					)
						? 2
						: 0,
				};
				perksUpdates.faction = factionPerks;
			}

			// 更新公司技能
			if (tornData.job_perks) {
				const companyPerks: CompanyPerks = {
					name: getCompanyType(tornData.job.company_type),
					star: tornData.company.rating,
				};
				perksUpdates.company = companyPerks;
			}

			// 更新房产技能
			if (tornData.property_perks) {
				const propertyPerks: PropertyPerks = {
					damage: tornData.property_perks.some((perk: string) =>
						perk.includes("+ 2% damage"),
					),
				};
				perksUpdates.property = propertyPerks;
				console.log("propertyPerks", propertyPerks);
			}

			// 更新成就技能
			if (tornData.merit_perks) {
				console.log("tornData.merit_perks", tornData.merit_perks);
				const meritPerks: MeritPerks = {
					critrate: tornData.merit_perks.some((perk: string) =>
						perk.includes("critical hit rate"),
					)
						? parseInt(
								tornData.merit_perks
									.find((perk: string) => perk.includes("critical hit rate"))
									?.match(/\d+/)?.[0] || "0",
							)
						: 0,
					primarymastery: tornData.merit_perks.some((perk: string) =>
						perk.includes("primary"),
					)
						? parseInt(
								tornData.merit_perks
									.find((perk: string) => perk.includes("primary"))
									?.match(/\d+/)?.[0] || "0",
							)
						: 0,
					secondarymastery: tornData.merit_perks.some((perk: string) =>
						perk.includes("secondary"),
					)
						? parseInt(
								tornData.merit_perks
									.find((perk: string) => perk.includes("secondary"))
									?.match(/\d+/)?.[0] || "0",
							)
						: 0,
					meleemastery: tornData.merit_perks.some((perk: string) =>
						perk.includes("melee"),
					)
						? parseInt(
								tornData.merit_perks
									.find((perk: string) => perk.includes("melee"))
									?.match(/\d+/)?.[0] || "0",
							)
						: 0,
					temporarymastery: tornData.merit_perks.some((perk: string) =>
						perk.includes("temporary"),
					)
						? parseInt(
								tornData.merit_perks
									.find((perk: string) => perk.includes("temporary"))
									?.match(/\d+/)?.[0] || "0",
							)
						: 0,
					clubbingmastery: tornData.merit_perks.some((perk: string) =>
						perk.includes("clubbing"),
					)
						? parseInt(
								tornData.merit_perks
									.find((perk: string) => perk.includes("clubbing"))
									?.match(/\d+/)?.[0] || "0",
							)
						: 0,
					heavyartillerymastery: tornData.merit_perks.some((perk: string) =>
						perk.includes("heavy artillery"),
					)
						? parseInt(
								tornData.merit_perks
									.find((perk: string) => perk.includes("heavy artillery"))
									?.match(/\d+/)?.[0] || "0",
							)
						: 0,
					machinegunmastery: tornData.merit_perks.some((perk: string) =>
						perk.includes("machine gun"),
					)
						? parseInt(
								tornData.merit_perks
									.find((perk: string) => perk.includes("machine gun"))
									?.match(/\d+/)?.[0] || "0",
							)
						: 0,
					mechanicalmastery: tornData.merit_perks.some((perk: string) =>
						perk.includes("mechanical"),
					)
						? parseInt(
								tornData.merit_perks
									.find((perk: string) => perk.includes("mechanical"))
									?.match(/\d+/)?.[0] || "0",
							)
						: 0,
					piercingmastery: tornData.merit_perks.some((perk: string) =>
						perk.includes("piercing"),
					)
						? parseInt(
								tornData.merit_perks
									.find((perk: string) => perk.includes("piercing"))
									?.match(/\d+/)?.[0] || "0",
							)
						: 0,
					pistolmastery: tornData.merit_perks.some((perk: string) =>
						perk.includes("pistol"),
					)
						? parseInt(
								tornData.merit_perks
									.find((perk: string) => perk.includes("pistol"))
									?.match(/\d+/)?.[0] || "0",
							)
						: 0,
					riflemastery: tornData.merit_perks.some((perk: string) =>
						perk.includes("rifle"),
					)
						? parseInt(
								tornData.merit_perks
									.find((perk: string) => perk.includes("rifle"))
									?.match(/\d+/)?.[0] || "0",
							)
						: 0,
					shotgunmastery: tornData.merit_perks.some((perk: string) =>
						perk.includes("shotgun"),
					)
						? parseInt(
								tornData.merit_perks
									.find((perk: string) => perk.includes("shotgun"))
									?.match(/\d+/)?.[0] || "0",
							)
						: 0,
					slashingmastery: tornData.merit_perks.some((perk: string) =>
						perk.includes("slashing"),
					)
						? parseInt(
								tornData.merit_perks
									.find((perk: string) => perk.includes("slashing"))
									?.match(/\d+/)?.[0] || "0",
							)
						: 0,
					smgmastery: tornData.merit_perks.some((perk: string) =>
						perk.includes("smg"),
					)
						? parseInt(
								tornData.merit_perks
									.find((perk: string) => perk.includes("smg"))
									?.match(/\d+/)?.[0] || "0",
							)
						: 0,
				};
				perksUpdates.merit = meritPerks;
			}

			const finalUpdates = {
				...updates,
				perks: {
					...player.perks,
					...perksUpdates,
				},
			};

			// 处理装备数据
			if (equipmentDetails && equipmentDetails.length > 0) {
				console.log("开始处理装备数据:", equipmentDetails);

				for (const equipment of equipmentDetails) {
					const item = equipment.itemdetails;
					console.log(
						`处理装备: ${item.name} (类型: ${item.type}, ID: ${item.ID})`,
					);

					// 处理武器
					if (
						["Primary", "Secondary", "Melee", "Temporary"].includes(item.type)
					) {
						const weaponType = item.type.toLowerCase() as
							| "primary"
							| "secondary"
							| "melee"
							| "temporary";

						// 使用ID查找对应的武器数据
						const weaponData = findWeaponByIdAndUpdateStats(
							weaponType,
							item.ID,
							item,
							weaponExpData,
						);

						if (weaponData) {
							// 提取武器特效
							const weaponBonuses: SelectedWeaponBonus[] = [];
							if (item.bonuses) {
								for (const bonusKey in item.bonuses) {
									const bonus = item.bonuses[bonusKey];
									if (bonus?.bonus && typeof bonus.value === "number") {
										weaponBonuses.push({
											name: bonus.bonus,
											value: bonus.value,
										});
									}
								}
							}

							weaponsUpdates[weaponType] = {
								...weaponData,
								...(weaponBonuses.length > 0 && { weaponBonuses }),
							};
						} else {
							failedImports.push(`武器: ${item.name} (ID: ${item.ID})`);
						}
					}

					// 处理护甲
					else if (item.type === "Defensive") {
						const armourType = getArmourTypeFromName(item.name);
						if (armourType) {
							// 使用ID查找对应的护甲数据
							const armourData = findArmourByIdAndUpdateStats(
								armourType,
								item.ID,
								item,
							);

							if (armourData) {
								// 提取护甲特效（不在这里应用套装加成）
								const armourEffects: ArmourEffect[] = [];
								if (item.bonuses) {
									for (const bonusKey in item.bonuses) {
										const bonus = item.bonuses[bonusKey];
										// 护甲特效通常是 Impenetrable, Impregnable, Insurmountable, Impassable
										if (
											bonus?.bonus &&
											typeof bonus.value === "number" &&
											[
												"Impenetrable",
												"Impregnable",
												"Insurmountable",
												"Impassable",
											].includes(bonus.bonus)
										) {
											armourEffects.push({
												name: bonus.bonus,
												value: bonus.value, // 保持原始数值，套装加成在后面统一处理
											});
										}
									}
								}

								armourUpdates[armourType] = {
									...armourData,
									...(armourEffects.length > 0 && { effects: armourEffects }),
								};
							} else {
								failedImports.push(`护甲: ${item.name} (ID: ${item.ID})`);
							}
						} else {
							failedImports.push(
								`护甲: ${item.name} (无法确定类型, ID: ${item.ID})`,
							);
						}
					}
				}

				// 合并装备更新
				if (Object.keys(weaponsUpdates).length > 0) {
					finalUpdates.weapons = {
						...player.weapons,
						...weaponsUpdates,
					};
				}

				if (Object.keys(armourUpdates).length > 0) {
					// 先应用护甲更新，然后检查套装加成
					const updatedArmour = {
						...player.armour,
						...armourUpdates,
					};

					// 检查是否穿着完整套装并应用套装加成
					finalUpdates.armour = applyArmourSetBonus(updatedArmour);
				} else {
					// 即使没有导入新护甲，也要检查现有护甲的套装加成
					finalUpdates.armour = applyArmourSetBonus(player.armour);
				}
			}

			// 一次性更新所有数据
			updatePlayer(finalUpdates);

			// 显示导入结果 - 只有在装备导入失败时才弹窗提示
			if (equipmentDetails && equipmentDetails.length > 0) {
				const weaponCount = Object.keys(weaponsUpdates).length;
				const armourCount = Object.keys(armourUpdates).length;

				if (failedImports.length > 0) {
					// 只有在任意武器或护甲导入失败时才弹窗提示
					let message = `导入完成！\n\n成功导入: ${weaponCount} 件武器, ${armourCount} 件护甲`;
					message += `\n\n以下装备导入失败（可能是数据库中尚未录入）:\n${failedImports.join("\n")}`;
					alert(message);
				}
				// 如果全部成功，不弹窗提示
			}
			// 如果没有装备数据也不弹窗
		} catch (error) {
			console.error("更新玩家属性时出错:", error);
			alert("更新玩家属性失败，请检查数据格式");
		}
	};

	// 辅助函数：根据ID查找武器数据并使用API返回的实际数值
	const findWeaponByIdAndUpdateStats = (
		weaponType: "primary" | "secondary" | "melee" | "temporary",
		weaponId: number,
		weaponData: TornItemDetailsResponse["itemdetails"],
		weaponExpData?: TornWeaponExpResponse | null,
	): WeaponData | null => {
		try {
			// 先通过ID查找基础武器数据
			const baseWeapon = getWeaponById(weaponType, weaponId.toString());

			if (baseWeapon) {
				// 查找对应的武器经验
				let weaponExperience = 0;
				if (weaponExpData?.weaponexp) {
					const expEntry = weaponExpData.weaponexp.find(
						(exp) => exp.itemID === weaponId,
					);
					weaponExperience = expEntry?.exp || 0;
				}

				// 使用API返回的实际数值覆盖基础数据
				const updatedWeapon: WeaponData = {
					...baseWeapon,
					// 使用API返回的实际伤害和精准度
					damage: weaponData.damage || baseWeapon.damage,
					accuracy: weaponData.accuracy || baseWeapon.accuracy,
					// 使用从武器经验API获取的经验值
					experience: weaponExperience,
				};

				console.log(
					`成功匹配武器: ID=${weaponId}, ${weaponData.name} -> ${baseWeapon.name} (${weaponType})`,
				);
				console.log(
					`数值: 伤害=${updatedWeapon.damage}, 精准=${updatedWeapon.accuracy}, 经验=${updatedWeapon.experience}`,
				);
				return updatedWeapon;
			} else {
				console.warn(
					`未找到匹配的武器: ID=${weaponId}, ${weaponData.name} (${weaponType})`,
				);
				return null;
			}
		} catch (error) {
			console.warn(`查找武器失败: ID=${weaponId}, ${weaponData.name}`, error);
			return null;
		}
	};

	// 辅助函数：根据ID查找护甲数据并使用API返回的实际数值
	const findArmourByIdAndUpdateStats = (
		armourType: "head" | "body" | "hands" | "legs" | "feet",
		armourId: number,
		armourData: TornItemDetailsResponse["itemdetails"],
	): ArmourData | null => {
		try {
			// 先通过ID查找基础护甲数据
			const baseArmour = getArmourById(armourType, armourId.toString());

			if (baseArmour) {
				// 使用API返回的实际数值覆盖基础数据
				const updatedArmour: ArmourData = {
					...baseArmour,
					// 使用API返回的实际护甲值，如果没有则使用基础值
					armour:
						typeof armourData.armor === "number"
							? armourData.armor
							: baseArmour.armour,
				};

				console.log(
					`成功匹配护甲: ID=${armourId}, ${armourData.name} -> ${baseArmour.type || baseArmour.set} (${armourType})`,
				);
				console.log(`护甲值: ${updatedArmour.armour}`);
				return updatedArmour;
			} else {
				console.warn(
					`未找到匹配的护甲: ID=${armourId}, ${armourData.name} (${armourType})`,
				);
				return null;
			}
		} catch (error) {
			console.warn(`查找护甲失败: ID=${armourId}, ${armourData.name}`, error);
			return null;
		}
	};

	// 辅助函数：根据护甲名称确定护甲类型
	const getArmourTypeFromName = (
		armourName: string,
	): "head" | "body" | "hands" | "legs" | "feet" | null => {
		const name = armourName.toLowerCase();

		// 头部护甲
		if (
			name.includes("helmet") ||
			name.includes("hat") ||
			name.includes("mask") ||
			name.includes("head") ||
			name.includes("visage") ||
			name.includes("respirator") ||
			name.includes("gas mask")
		) {
			return "head";
		}

		// 身体护甲
		if (
			name.includes("vest") ||
			name.includes("jacket") ||
			name.includes("shirt") ||
			name.includes("body") ||
			name.includes("chest") ||
			name.includes("armor") ||
			name.includes("apron") ||
			name.includes("coat") ||
			name.includes("breastplate") ||
			name.includes("spathe")
		) {
			return "body";
		}

		// 手部护甲
		if (
			name.includes("gloves") ||
			name.includes("hands") ||
			name.includes("gauntlets") ||
			name.includes("clawshields")
		) {
			return "hands";
		}

		// 腿部护甲
		if (
			name.includes("pants") ||
			name.includes("legs") ||
			name.includes("trousers") ||
			name.includes("britches")
		) {
			return "legs";
		}

		// 脚部护甲
		if (
			name.includes("boots") ||
			name.includes("shoes") ||
			name.includes("feet") ||
			name.includes("hooves")
		) {
			return "feet";
		}

		return null;
	};

	// 辅助函数：检查是否穿着完整套装并应用套装加成
	const applyArmourSetBonus = (
		armourSet: Player["armour"],
	): Player["armour"] => {
		// 获取所有护甲部位的套装名称
		const sets = {
			head: armourSet.head.set,
			body: armourSet.body.set,
			hands: armourSet.hands.set,
			legs: armourSet.legs.set,
			feet: armourSet.feet.set,
		};

		// 检查是否所有部位都属于同一套装（且不是"n/a"）
		const setNames = Object.values(sets);
		const firstSet = setNames[0];

		// 如果第一个套装名是"n/a"或者不是所有部位都是同一套装，则不应用加成
		if (firstSet === "n/a" || !setNames.every((set) => set === firstSet)) {
			return armourSet; // 返回原始护甲数据，不应用套装加成
		}

		// 穿着完整套装，应用+10套装加成到所有护甲特效
		const result = { ...armourSet };

		(Object.keys(result) as Array<keyof Player["armour"]>).forEach((slot) => {
			const armour = result[slot];
			if (armour.effects && armour.effects.length > 0) {
				result[slot] = {
					...armour,
					effects: armour.effects.map((effect) => ({
						...effect,
						value: effect.value + 10, // 套装加成+10
					})),
				};
			}
		});

		console.log(`应用套装加成: ${firstSet} 套装，所有护甲特效+10`);
		return result;
	};

	// 新增：锻炼模拟器算法
	const gymConstants = {
		Strength: { A: 1600, B: 1700, C: 700 },
		Speed: { A: 1600, B: 2000, C: 1350 },
		Dexterity: { A: 1800, B: 1500, C: 1000 },
		Defense: { A: 2100, B: -600, C: 1500 },
	};

	const calculateSValue = (currentStat: number): number => {
		if (currentStat <= 50_000_000) {
			return currentStat;
		} else {
			return (
				50_000_000 +
				(currentStat - 50_000_000) / (8.77635 * Math.log10(currentStat))
			);
		}
	};

	const calculateSingleWorkout = (
		statType: "Strength" | "Speed" | "Dexterity" | "Defense",
		currentStat: number,
	): number => {
		const constants = gymConstants[statType];
		const { A, B } = constants;

		const S = calculateSValue(currentStat);
		const H = gymParams.happiness;

		// 第一部分: S * ROUND(1 + 0.07 * ROUND(LN(1+H/250),4),4)
		const lnPart = Math.round(Math.log(1 + H / 250) * 10000) / 10000;
		const multiplier = Math.round((1 + 0.07 * lnPart) * 10000) / 10000;
		const firstPart = S * multiplier;

		// 第二部分: 8 * H^1.05
		const secondPart = 8 * H ** 1.05;

		// 第三部分: (1-(H/99999)^2) * A
		const thirdPart = (1 - (H / 99999) ** 2) * A;

		// 第四部分: B
		const fourthPart = B;

		// 组合所有部分
		const baseGain = firstPart + secondPart + thirdPart + fourthPart;

		// 最终公式
		const dS =
			baseGain *
			(1 / 200000) *
			gymParams.gymRatio *
			gymParams.energyPerSession *
			gymParams.bonusMultiplier;

		return Math.max(0, dS);
	};

	const simulateTraining = (
		statType: "Strength" | "Speed" | "Dexterity" | "Defense",
		initialStat: number,
		totalEnergy: number,
	): number => {
		let currentStat = initialStat;
		const totalSessions = Math.floor(totalEnergy / gymParams.energyPerSession);

		for (let session = 0; session < totalSessions; session++) {
			const gain = calculateSingleWorkout(statType, currentStat);
			currentStat += gain;
		}

		return Math.round(currentStat);
	};

	// 新增：使用指定参数计算单次锻炼收益
	const calculateSingleWorkoutWithParams = (
		statType: "Strength" | "Speed" | "Dexterity" | "Defense",
		currentStat: number,
		params: typeof gymParams,
	): number => {
		const constants = gymConstants[statType];
		const { A, B } = constants;

		const S = calculateSValue(currentStat);
		const H = params.happiness;

		// 第一部分: S * ROUND(1 + 0.07 * ROUND(LN(1+H/250),4),4)
		const lnPart = Math.round(Math.log(1 + H / 250) * 10000) / 10000;
		const multiplier = Math.round((1 + 0.07 * lnPart) * 10000) / 10000;
		const firstPart = S * multiplier;

		// 第二部分: 8 * H^1.05
		const secondPart = 8 * H ** 1.05;

		// 第三部分: (1-(H/99999)^2) * A
		const thirdPart = (1 - (H / 99999) ** 2) * A;

		// 第四部分: B
		const fourthPart = B;

		// 组合所有部分
		const baseGain = firstPart + secondPart + thirdPart + fourthPart;

		// 最终公式
		const dS =
			baseGain *
			(1 / 200000) *
			params.gymRatio *
			params.energyPerSession *
			params.bonusMultiplier;

		return Math.max(0, dS);
	};

	// 新增：使用指定参数进行锻炼模拟（用于导入时的计算）
	const simulateTrainingWithParams = (
		statType: "Strength" | "Speed" | "Dexterity" | "Defense",
		initialStat: number,
		totalEnergy: number,
		params: typeof gymParams,
	): number => {
		let currentStat = initialStat;
		const totalSessions = Math.floor(totalEnergy / params.energyPerSession);

		for (let session = 0; session < totalSessions; session++) {
			const gain = calculateSingleWorkoutWithParams(
				statType,
				currentStat,
				params,
			);
			currentStat += gain;
		}

		return Math.round(currentStat);
	};

	const calculateStatsFromGym = () => {
		const newStats = {
			strength: simulateTraining(
				"Strength",
				gymParams.initialStats.strength,
				gymParams.totalEnergy.strength,
			),
			speed: simulateTraining(
				"Speed",
				gymParams.initialStats.speed,
				gymParams.totalEnergy.speed,
			),
			defense: simulateTraining(
				"Defense",
				gymParams.initialStats.defense,
				gymParams.totalEnergy.defense,
			),
			dexterity: simulateTraining(
				"Dexterity",
				gymParams.initialStats.dexterity,
				gymParams.totalEnergy.dexterity,
			),
		};

		updatePlayer({ stats: newStats });
	};

	const updateGymParam = (field: string, value: number) => {
		setGymParams((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const updateTotalEnergy = (stat: string, value: number) => {
		setGymParams((prev) => ({
			...prev,
			totalEnergy: {
				...prev.totalEnergy,
				[stat]: value,
			},
		}));
	};

	const updateInitialStat = (stat: string, value: number) => {
		setGymParams((prev) => ({
			...prev,
			initialStats: {
				...prev.initialStats,
				[stat]: value,
			},
		}));
	};

	return (
		<div className="space-y-6">
			{/* 玩家基本信息 */}
			<Card className="shadow-sm">
				<CardHeader className="pb-4">
					<div className="flex justify-between items-center">
						<CardTitle className="text-lg">
							{playerName} {isAttacker ? "(攻击方)" : "(防守方)"}
						</CardTitle>
						<div className="flex items-center gap-2">
							<Button
								onClick={() => multiplyStats(10)}
								variant="outline"
								size="sm"
								className="min-w-[72px] transition-colors duration-200"
							>
								10x 属性
							</Button>
							<Button
								onClick={() => multiplyStats(0.1)}
								variant="outline"
								size="sm"
								className="min-w-[72px] transition-colors duration-200"
							>
								1/10 属性
							</Button>
							<Button
								onClick={onCopyFromOther}
								variant="outline"
								size="sm"
								title={`从${isAttacker ? "Defender" : "Attacker"}复制配置`}
								className="flex items-center min-w-[60px] transition-colors duration-200"
							>
								{isAttacker ? "← 复制" : "→ 复制"}
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="space-y-2">
						<Label htmlFor={`${playerId}-name`}>玩家名称</Label>
						<Input
							id={`${playerId}-name`}
							type="text"
							value={player.name}
							onChange={(e) =>
								updatePlayer({
									name:
										e.target.value || (isAttacker ? "Attacker" : "Defender"),
								})
							}
							placeholder={isAttacker ? "Attacker" : "Defender"}
							aria-label={`${playerName}名称`}
						/>
						<div className="text-xs text-slate-500 mt-1">
							此名称将在战斗日志中显示
						</div>
					</div>

					{/* 新增：导入配置行 */}
					<div className="space-y-2 mt-4">
						<Label htmlFor={`${playerId}-import`}>导入配置</Label>
						<div className="flex space-x-2">
							<div className="relative flex-1">
								<Input
									id={`${playerId}-import`}
									type={showApiKey ? "text" : "password"}
									value={importKey}
									onChange={(e) => setImportKey(e.target.value)}
									placeholder="输入Torn API Key..."
									className="pr-10"
									aria-label={`${playerName}导入配置`}
								/>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
									onClick={() => setShowApiKey(!showApiKey)}
								>
									{showApiKey ? (
										<EyeOff className="h-4 w-4 text-slate-500" />
									) : (
										<Eye className="h-4 w-4 text-slate-500" />
									)}
								</Button>
							</div>
							<Button
								variant="secondary"
								className="transition-colors duration-200"
								onClick={handleTornImport}
								disabled={isImporting || !importKey.trim()}
							>
								{isImporting ? (
									<span className="flex items-center gap-2">
										<div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
										导入中...
									</span>
								) : (
									"导入"
								)}
							</Button>
						</div>
						<div className="text-xs text-slate-500">
							输入Torn API Key获取玩家装备和技能数据
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Tab 导航 */}
			<Card className="shadow-sm">
				<CardContent className="p-6">
					<Tabs
						value={activeTab}
						onValueChange={(value) => setActiveTab(value as typeof activeTab)}
					>
						<TabsList className="grid w-full grid-cols-6">
							{tabs.map((tab) => (
								<TabsTrigger key={tab.id} value={tab.id} className="text-xs">
									<tab.icon className="w-4 h-4 mr-2" />
									{tab.label}
								</TabsTrigger>
							))}
						</TabsList>

						{/* 属性与被动 Tab */}
						<TabsContent value="stats">
							<div className="space-y-6">
								{/* 输入模式切换 */}
								<div className="space-y-3">
									<h4 className="text-md font-semibold">输入模式</h4>
									<div className="flex space-x-4">
										<label className="flex items-center space-x-2">
											<input
												type="radio"
												name={`${playerId}-input-mode`}
												value="manual"
												checked={inputMode === "manual"}
												onChange={(e) =>
													setInputMode(e.target.value as "manual" | "gym")
												}
												className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
											/>
											<span className="text-sm">手动输入</span>
										</label>
										<label className="flex items-center space-x-2">
											<input
												type="radio"
												name={`${playerId}-input-mode`}
												value="gym"
												checked={inputMode === "gym"}
												onChange={(e) =>
													setInputMode(e.target.value as "manual" | "gym")
												}
												className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
											/>
											<span className="text-sm">锻炼能量计算</span>
										</label>
									</div>
								</div>

								{/* 生命值 */}
								<div className="space-y-2">
									<Label htmlFor={`${playerId}-life`}>生命值</Label>
									<Input
										id={`${playerId}-life`}
										type="number"
										value={player.life}
										onChange={(e) =>
											updatePlayer({ life: parseInt(e.target.value) || 5000 })
										}
										min="100"
										max="50000"
										aria-label={`${playerName}生命值`}
									/>
									<p className="text-xs text-muted-foreground">
										提示：等级100无荣誉=5000，满荣誉=7500，满荣誉+派系=9000
									</p>
								</div>

								{inputMode === "manual" ? (
									<>
										{/* 手动输入模式 - 基础属性 */}
										<div className="space-y-3">
											<h4 className="text-md font-semibold">基础属性</h4>
											<div className="grid grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor={`${playerId}-strength`}>
														力量(STR)
													</Label>
													<FormattedInput
														id={`${playerId}-strength`}
														value={player.stats.strength}
														onChange={(value) => updateStats("strength", value)}
														min={10}
														aria-label={`${playerName}力量`}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor={`${playerId}-speed`}>速度(SPD)</Label>
													<FormattedInput
														id={`${playerId}-speed`}
														value={player.stats.speed}
														onChange={(value) => updateStats("speed", value)}
														min={10}
														aria-label={`${playerName}速度`}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor={`${playerId}-defense`}>
														防御(DEF)
													</Label>
													<FormattedInput
														id={`${playerId}-defense`}
														value={player.stats.defense}
														onChange={(value) => updateStats("defense", value)}
														min={10}
														aria-label={`${playerName}防御`}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor={`${playerId}-dexterity`}>
														敏捷(DEX)
													</Label>
													<FormattedInput
														id={`${playerId}-dexterity`}
														value={player.stats.dexterity}
														onChange={(value) =>
															updateStats("dexterity", value)
														}
														min={10}
														aria-label={`${playerName}敏捷`}
													/>
												</div>
											</div>
										</div>
									</>
								) : (
									<>
										{/* 锻炼能量计算模式 */}
										<div className="space-y-4">
											<h4 className="text-md font-semibold">锻炼参数设置</h4>

											{/* 基础参数 */}
											<div className="grid grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label htmlFor={`${playerId}-happiness`}>
														快乐值
													</Label>
													<Input
														id={`${playerId}-happiness`}
														type="number"
														value={gymParams.happiness}
														onChange={(e) =>
															updateGymParam(
																"happiness",
																parseFloat(e.target.value) || 5025,
															)
														}
														min="0"
														max="99999"
														step="0.1"
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor={`${playerId}-gym-ratio`}>G系数</Label>
													<Input
														id={`${playerId}-gym-ratio`}
														type="number"
														value={gymParams.gymRatio}
														onChange={(e) =>
															updateGymParam(
																"gymRatio",
																parseFloat(e.target.value) || 7.3,
															)
														}
														min="0"
														max="20"
														step="0.1"
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor={`${playerId}-energy-per-session`}>
														每次锻炼能量
													</Label>
													<Input
														id={`${playerId}-energy-per-session`}
														type="number"
														value={gymParams.energyPerSession}
														onChange={(e) =>
															updateGymParam(
																"energyPerSession",
																parseInt(e.target.value) || 10,
															)
														}
														min="1"
														max="50"
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor={`${playerId}-bonus-multiplier`}>
														加成乘数
													</Label>
													<Input
														id={`${playerId}-bonus-multiplier`}
														type="number"
														value={gymParams.bonusMultiplier}
														onChange={(e) =>
															updateGymParam(
																"bonusMultiplier",
																parseFloat(e.target.value) || 1.2,
															)
														}
														min="0.1"
														max="10"
														step="0.1"
													/>
												</div>
											</div>

											{/* 初始属性设置 */}
											<div className="space-y-3">
												<h5 className="text-sm font-semibold">
													初始属性 (S值)
												</h5>
												<div className="grid grid-cols-2 gap-4">
													<div className="space-y-2">
														<Label htmlFor={`${playerId}-initial-strength`}>
															初始力量
														</Label>
														<Input
															id={`${playerId}-initial-strength`}
															type="number"
															value={gymParams.initialStats.strength}
															onChange={(e) =>
																updateInitialStat(
																	"strength",
																	parseInt(e.target.value) || 10,
																)
															}
															min="1"
															max="100000000"
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor={`${playerId}-initial-speed`}>
															初始速度
														</Label>
														<Input
															id={`${playerId}-initial-speed`}
															type="number"
															value={gymParams.initialStats.speed}
															onChange={(e) =>
																updateInitialStat(
																	"speed",
																	parseInt(e.target.value) || 10,
																)
															}
															min="1"
															max="100000000"
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor={`${playerId}-initial-defense`}>
															初始防御
														</Label>
														<Input
															id={`${playerId}-initial-defense`}
															type="number"
															value={gymParams.initialStats.defense}
															onChange={(e) =>
																updateInitialStat(
																	"defense",
																	parseInt(e.target.value) || 10,
																)
															}
															min="1"
															max="100000000"
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor={`${playerId}-initial-dexterity`}>
															初始敏捷
														</Label>
														<Input
															id={`${playerId}-initial-dexterity`}
															type="number"
															value={gymParams.initialStats.dexterity}
															onChange={(e) =>
																updateInitialStat(
																	"dexterity",
																	parseInt(e.target.value) || 10,
																)
															}
															min="1"
															max="100000000"
														/>
													</div>
												</div>
											</div>

											{/* 锻炼能量输入 */}
											<div className="space-y-3">
												<h5 className="text-sm font-semibold">锻炼总能量</h5>
												<div className="grid grid-cols-2 gap-4">
													<div className="space-y-2">
														<Label htmlFor={`${playerId}-energy-strength`}>
															力量锻炼能量
														</Label>
														<FormattedInput
															id={`${playerId}-energy-strength`}
															value={gymParams.totalEnergy.strength}
															onChange={(value) =>
																updateTotalEnergy("strength", value)
															}
															min={0}
															max={100000000}
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor={`${playerId}-energy-speed`}>
															速度锻炼能量
														</Label>
														<FormattedInput
															id={`${playerId}-energy-speed`}
															value={gymParams.totalEnergy.speed}
															onChange={(value) =>
																updateTotalEnergy("speed", value)
															}
															min={0}
															max={100000000}
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor={`${playerId}-energy-defense`}>
															防御锻炼能量
														</Label>
														<FormattedInput
															id={`${playerId}-energy-defense`}
															value={gymParams.totalEnergy.defense}
															onChange={(value) =>
																updateTotalEnergy("defense", value)
															}
															min={0}
															max={100000000}
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor={`${playerId}-energy-dexterity`}>
															敏捷锻炼能量
														</Label>
														<FormattedInput
															id={`${playerId}-energy-dexterity`}
															value={gymParams.totalEnergy.dexterity}
															onChange={(value) =>
																updateTotalEnergy("dexterity", value)
															}
															min={0}
															max={100000000}
														/>
													</div>
												</div>
											</div>

											{/* 计算按钮 */}
											<div className="flex justify-center">
												<Button
													onClick={calculateStatsFromGym}
													variant="outline"
													className="w-full max-w-md bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700 font-medium transition-colors duration-200"
												>
													计算基础属性
												</Button>
											</div>

											{/* 显示当前计算结果 */}
											<div className="space-y-3">
												<h5 className="text-sm font-semibold">计算结果</h5>
												<div className="grid grid-cols-2 gap-4">
													<div className="space-y-2">
														<Label>力量 (STR)</Label>
														<div className="p-2 bg-slate-50 rounded border text-sm">
															{player.stats.strength.toLocaleString()}
														</div>
													</div>
													<div className="space-y-2">
														<Label>速度 (SPD)</Label>
														<div className="p-2 bg-slate-50 rounded border text-sm">
															{player.stats.speed.toLocaleString()}
														</div>
													</div>
													<div className="space-y-2">
														<Label>防御 (DEF)</Label>
														<div className="p-2 bg-slate-50 rounded border text-sm">
															{player.stats.defense.toLocaleString()}
														</div>
													</div>
													<div className="space-y-2">
														<Label>敏捷 (DEX)</Label>
														<div className="p-2 bg-slate-50 rounded border text-sm">
															{player.stats.dexterity.toLocaleString()}
														</div>
													</div>
												</div>
											</div>
										</div>
									</>
								)}

								{/* 属性被动加成 */}
								<div className="space-y-3">
									<h4 className="text-md font-semibold">属性被动加成</h4>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor={`${playerId}-passive-strength`}>
												力量 %
											</Label>
											<Input
												id={`${playerId}-passive-strength`}
												type="number"
												value={player.passives.strength}
												onChange={(e) =>
													updatePassives(
														"strength",
														parseInt(e.target.value) || 0,
													)
												}
												min="0"
												max="1000"
												aria-label={`${playerName}力量被动`}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor={`${playerId}-passive-speed`}>
												速度 %
											</Label>
											<Input
												id={`${playerId}-passive-speed`}
												type="number"
												value={player.passives.speed}
												onChange={(e) =>
													updatePassives("speed", parseInt(e.target.value) || 0)
												}
												min="0"
												max="1000"
												aria-label={`${playerName}速度被动`}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor={`${playerId}-passive-defense`}>
												防御 %
											</Label>
											<Input
												id={`${playerId}-passive-defense`}
												type="number"
												value={player.passives.defense}
												onChange={(e) =>
													updatePassives(
														"defense",
														parseInt(e.target.value) || 0,
													)
												}
												min="0"
												max="1000"
												aria-label={`${playerName}防御被动`}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor={`${playerId}-passive-dexterity`}>
												敏捷 %
											</Label>
											<Input
												id={`${playerId}-passive-dexterity`}
												type="number"
												value={player.passives.dexterity}
												onChange={(e) =>
													updatePassives(
														"dexterity",
														parseInt(e.target.value) || 0,
													)
												}
												min="0"
												max="1000"
												aria-label={`${playerName}敏捷被动`}
											/>
										</div>
									</div>
								</div>
							</div>
						</TabsContent>

						{/* 武器配置 Tab */}
						<TabsContent value="weapons">
							<div className="space-y-4">
								<h4 className="text-md font-semibold">武器配置</h4>
								<div className="space-y-3">
									<WeaponSelector
										weaponType="primary"
										selectedWeapon={player.weapons.primary}
										onWeaponChange={(weapon) => updateWeapon("primary", weapon)}
										label="主武器"
										playerId={playerName}
									/>
									<WeaponSelector
										weaponType="secondary"
										selectedWeapon={player.weapons.secondary}
										onWeaponChange={(weapon) =>
											updateWeapon("secondary", weapon)
										}
										label="副武器"
										playerId={playerName}
									/>
									<WeaponSelector
										weaponType="melee"
										selectedWeapon={player.weapons.melee}
										onWeaponChange={(weapon) => updateWeapon("melee", weapon)}
										label="近战武器"
										playerId={playerName}
									/>
									<WeaponSelector
										weaponType="temporary"
										selectedWeapon={player.weapons.temporary}
										onWeaponChange={(weapon) =>
											updateWeapon("temporary", weapon)
										}
										label="临时武器"
										playerId={playerName}
									/>
								</div>
							</div>
						</TabsContent>

						{/* 护甲配置 Tab */}
						<TabsContent value="armour">
							<div className="space-y-4">
								<h4 className="text-md font-semibold">护甲配置</h4>
								<div className="space-y-3">
									<ArmourSelector
										armourType="head"
										selectedArmour={player.armour.head}
										onArmourChange={(armour) => updateArmour("head", armour)}
										label="头部护甲"
										playerId={playerId}
									/>
									<ArmourSelector
										armourType="body"
										selectedArmour={player.armour.body}
										onArmourChange={(armour) => updateArmour("body", armour)}
										label="身体护甲"
										playerId={playerId}
									/>
									<ArmourSelector
										armourType="hands"
										selectedArmour={player.armour.hands}
										onArmourChange={(armour) => updateArmour("hands", armour)}
										label="手部护甲"
										playerId={playerId}
									/>
									<ArmourSelector
										armourType="legs"
										selectedArmour={player.armour.legs}
										onArmourChange={(armour) => updateArmour("legs", armour)}
										label="腿部护甲"
										playerId={playerId}
									/>
									<ArmourSelector
										armourType="feet"
										selectedArmour={player.armour.feet}
										onArmourChange={(armour) => updateArmour("feet", armour)}
										label="脚部护甲"
										playerId={playerId}
									/>
								</div>
								<ArmourCoverage playerArmour={player.armour} />
							</div>
						</TabsContent>

						{/* 战斗设置 Tab */}
						<TabsContent value="combat">
							<div className="space-y-4">
								<h4 className="text-md font-semibold text-slate-800 mb-3">
									{isAttacker ? "攻击设置" : "防守设置"}
								</h4>
								<div className="text-xs text-slate-600 mb-3">
									{isAttacker
										? "攻击方按优先级顺序使用武器，数字越小越优先使用（1最优先，4最不优先，0不使用）"
										: "防守方按权重随机选择武器（数值越大越容易选中，0不使用，与torn的防守设置逻辑相同）"}
								</div>

								<div className="space-y-3">
									{["primary", "secondary", "melee", "temporary"].map(
										(weaponType) => (
											<div
												key={weaponType}
												className="flex items-center space-x-4"
											>
												<div className="w-20 text-sm font-medium text-slate-700">
													{weaponType === "primary"
														? "主武器"
														: weaponType === "secondary"
															? "副武器"
															: weaponType === "melee"
																? "近战"
																: "临时"}
												</div>
												<div className="flex items-center space-x-2">
													<label
														htmlFor={`${playerId}-${weaponType}-setting`}
														className="text-xs text-slate-600"
													>
														设置:
													</label>
													<input
														id={`${playerId}-${weaponType}-setting`}
														type="number"
														value={
															isAttacker
																? player.attackSettings[
																		weaponType as keyof Player["attackSettings"]
																	].setting
																: player.defendSettings[
																		weaponType as keyof Player["defendSettings"]
																	].setting
														}
														onChange={(e) => {
															const value = parseInt(e.target.value) || 0;
															if (isAttacker) {
																updateAttackSettings(
																	weaponType as keyof Player["attackSettings"],
																	"setting",
																	value,
																);
															} else {
																updateDefendSettings(
																	weaponType as keyof Player["defendSettings"],
																	"setting",
																	value,
																);
															}
														}}
														className="w-16 px-2 py-1 border rounded"
														min="0"
														max="10"
														aria-label={`${playerName}${weaponType}设置`}
													/>
												</div>
												{weaponType !== "melee" &&
													weaponType !== "temporary" && (
														<div className="flex items-center space-x-2">
															<label
																htmlFor={`${playerId}-${weaponType}-reload`}
																className="text-xs text-slate-600"
															>
																自动重装:
															</label>
															<input
																id={`${playerId}-${weaponType}-reload`}
																type="checkbox"
																checked={
																	isAttacker
																		? player.attackSettings[
																				weaponType as keyof Player["attackSettings"]
																			].reload
																		: player.defendSettings[
																				weaponType as keyof Player["defendSettings"]
																			].reload
																}
																onChange={(e) => {
																	if (isAttacker) {
																		updateAttackSettings(
																			weaponType as keyof Player["attackSettings"],
																			"reload",
																			e.target.checked,
																		);
																	} else {
																		updateDefendSettings(
																			weaponType as keyof Player["defendSettings"],
																			"reload",
																			e.target.checked,
																		);
																	}
																}}
																className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
																aria-label={`${playerName}${weaponType}自动重装`}
															/>
														</div>
													)}
											</div>
										),
									)}
								</div>
							</div>
						</TabsContent>

						{/* 高级属性 Tab */}
						<TabsContent value="advanced">
							<div className="space-y-4">
								{/* 这里暂时保持原有的高级设置内容，后续会美化 */}
								<div className="space-y-4">
									{/* 教育技能 */}
									<div>
										<h5 className="text-sm font-semibold text-slate-700 mb-2">
											教育技能
										</h5>
										<div className="grid grid-cols-2 gap-2 text-xs">
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={player.perks.education.damage}
													onChange={(e) =>
														updateEducation("damage", e.target.checked)
													}
													className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
												/>
												<span>1% 伤害</span>
											</label>
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={player.perks.education.meleedamage}
													onChange={(e) =>
														updateEducation("meleedamage", e.target.checked)
													}
													className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
												/>
												<span>2% 近战伤害</span>
											</label>
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={player.perks.education.japanesedamage}
													onChange={(e) =>
														updateEducation("japanesedamage", e.target.checked)
													}
													className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
												/>
												<span>10% 日本刀伤害</span>
											</label>
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={player.perks.education.tempdamage}
													onChange={(e) =>
														updateEducation("tempdamage", e.target.checked)
													}
													className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
												/>
												<span>5% 临时武器伤害</span>
											</label>
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={player.perks.education.needleeffect}
													onChange={(e) =>
														updateEducation("needleeffect", e.target.checked)
													}
													className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
												/>
												<span>10% 针剂效果</span>
											</label>
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={player.perks.education.fistdamage}
													onChange={(e) =>
														updateEducation("fistdamage", e.target.checked)
													}
													className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
												/>
												<span>100% 拳头伤害</span>
											</label>
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={player.perks.education.preferKick || false}
													onChange={(e) =>
														updateEducation("preferKick", e.target.checked)
													}
													className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
												/>
												<span>优先脚踢 (默认拳头)</span>
											</label>
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={player.perks.education.neckdamage}
													onChange={(e) =>
														updateEducation("neckdamage", e.target.checked)
													}
													className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
												/>
												<span>10% 颈部伤害</span>
											</label>
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={player.perks.education.critchance}
													onChange={(e) =>
														updateEducation("critchance", e.target.checked)
													}
													className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
												/>
												<span>3% 暴击几率</span>
											</label>
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={player.perks.education.ammocontrol1}
													onChange={(e) =>
														updateEducation("ammocontrol1", e.target.checked)
													}
													className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
												/>
												<span>5% 弹药控制</span>
											</label>
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={player.perks.education.ammocontrol2}
													onChange={(e) =>
														updateEducation("ammocontrol2", e.target.checked)
													}
													className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
												/>
												<span>20% 弹药控制</span>
											</label>

											{/* 武器类型精准度技能 */}
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={player.perks.education.machinegunaccuracy}
													onChange={(e) =>
														updateEducation(
															"machinegunaccuracy",
															e.target.checked,
														)
													}
													className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
												/>
												<span>+1.0 机枪精准</span>
											</label>
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={player.perks.education.smgaccuracy}
													onChange={(e) =>
														updateEducation("smgaccuracy", e.target.checked)
													}
													className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
												/>
												<span>+1.0 冲锋枪精准</span>
											</label>
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={player.perks.education.pistolaccuracy}
													onChange={(e) =>
														updateEducation("pistolaccuracy", e.target.checked)
													}
													className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
												/>
												<span>+1.0 手枪精准</span>
											</label>
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={player.perks.education.rifleaccuracy}
													onChange={(e) =>
														updateEducation("rifleaccuracy", e.target.checked)
													}
													className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
												/>
												<span>+1.0 步枪精准</span>
											</label>
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={
														player.perks.education.heavyartilleryaccuracy
													}
													onChange={(e) =>
														updateEducation(
															"heavyartilleryaccuracy",
															e.target.checked,
														)
													}
													className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
												/>
												<span>+1.0 重型火炮精准</span>
											</label>
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={player.perks.education.shotgunaccuracy}
													onChange={(e) =>
														updateEducation("shotgunaccuracy", e.target.checked)
													}
													className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
												/>
												<span>+1.0 霰弹枪精准</span>
											</label>
											<label className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={player.perks.education.temporaryaccuracy}
													onChange={(e) =>
														updateEducation(
															"temporaryaccuracy",
															e.target.checked,
														)
													}
													className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
												/>
												<span>+1.0 临时武器精准</span>
											</label>
										</div>
									</div>

									{/* 派系技能 */}
									<div>
										<h5 className="text-sm font-semibold text-slate-700 mb-2">
											派系技能
										</h5>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<label
													htmlFor={`${playerId}-faction-damage`}
													className="block text-xs text-slate-600 mb-1"
												>
													伤害加成: {player.perks.faction.damage}%
												</label>
												<input
													id={`${playerId}-faction-damage`}
													type="range"
													min="0"
													max="10"
													value={player.perks.faction.damage}
													onChange={(e) =>
														updateFaction("damage", parseInt(e.target.value))
													}
													className="w-full accent-slate-600"
													aria-label={`${playerName}派系伤害`}
												/>
											</div>
											<div>
												<label
													htmlFor={`${playerId}-faction-accuracy`}
													className="block text-xs text-slate-600 mb-1"
												>
													精准加成: +
													{(player.perks.faction.accuracy / 5).toFixed(1)}
												</label>
												<input
													id={`${playerId}-faction-accuracy`}
													type="range"
													min="0"
													max="10"
													value={player.perks.faction.accuracy}
													onChange={(e) =>
														updateFaction("accuracy", parseInt(e.target.value))
													}
													className="w-full accent-slate-600"
													aria-label={`${playerName}派系精准`}
												/>
											</div>
										</div>
									</div>

									{/* 公司技能 */}
									<div>
										<h5 className="text-sm font-semibold text-slate-700 mb-2">
											公司技能
										</h5>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<label
													htmlFor={`${playerId}-company-type`}
													className="block text-xs text-slate-600 mb-1"
												>
													公司类型
												</label>
												<Select
													value={player.perks.company.name}
													onValueChange={(value) =>
														updateCompany("name", value)
													}
												>
													<SelectTrigger
														id={`${playerId}-company-type`}
														aria-label={`${playerName}公司类型`}
													>
														<SelectValue placeholder="选择公司" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="None">无</SelectItem>
														{companies.map((company) => (
															<SelectItem key={company} value={company}>
																{company}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div>
												<label
													htmlFor={`${playerId}-company-star`}
													className="block text-xs text-slate-600 mb-1"
												>
													星级: {player.perks.company.star}
												</label>
												<input
													id={`${playerId}-company-star`}
													type="range"
													min="0"
													max="10"
													value={player.perks.company.star}
													onChange={(e) =>
														updateCompany("star", parseInt(e.target.value))
													}
													className="w-full accent-slate-600"
													aria-label={`${playerName}公司星级`}
												/>
											</div>
										</div>
									</div>

									{/* 其他技能 */}
									<div>
										<h5 className="text-sm font-semibold text-slate-700 mb-2">
											荣誉技能
										</h5>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<label
													htmlFor={`${playerId}-merit-critrate`}
													className="block text-xs text-slate-600 mb-1"
												>
													暴击率荣誉: {player.perks.merit.critrate}
												</label>
												<input
													id={`${playerId}-merit-critrate`}
													type="range"
													min="0"
													max="10"
													value={player.perks.merit.critrate}
													onChange={(e) =>
														updateMerit("critrate", parseInt(e.target.value))
													}
													className="w-full accent-slate-600"
													aria-label={`${playerName}暴击率荣誉`}
												/>
											</div>
											<div className="flex items-center space-x-2">
												<label className="flex items-center space-x-2">
													<input
														type="checkbox"
														checked={player.perks.property.damage}
														onChange={(e) =>
															updateProperty("damage", e.target.checked)
														}
														className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
													/>
													<span className="text-xs">2% 房产伤害</span>
												</label>
											</div>
										</div>

										{/* 武器精通技能 */}
										<div className="mt-4">
											<h6 className="text-xs font-semibold text-slate-600 mb-2">
												武器精通
											</h6>
											<div className="grid grid-cols-2 gap-2">
												<div>
													<label
														htmlFor={`${playerId}-primarymastery`}
														className="block text-xs text-slate-600 mb-1"
													>
														主武器精通: {player.perks.merit.primarymastery || 0}
													</label>
													<input
														id={`${playerId}-primarymastery`}
														type="range"
														min="0"
														max="10"
														value={player.perks.merit.primarymastery || 0}
														onChange={(e) =>
															updateMerit(
																"primarymastery",
																parseInt(e.target.value),
															)
														}
														className="w-full accent-slate-600"
														aria-label={`${playerName}主武器精通`}
													/>
												</div>
												<div>
													<label
														htmlFor={secondaryMasteryId}
														className="block text-xs text-slate-600 mb-1"
													>
														副武器精通:{" "}
														{player.perks.merit.secondarymastery || 0}
													</label>
													<input
														id={secondaryMasteryId}
														type="range"
														min="0"
														max="10"
														value={player.perks.merit.secondarymastery || 0}
														onChange={(e) =>
															updateMerit(
																"secondarymastery",
																parseInt(e.target.value),
															)
														}
														className="w-full accent-slate-600"
														aria-label={`${playerName}副武器精通`}
													/>
												</div>
												<div>
													<label
														htmlFor={meleeMasteryId}
														className="block text-xs text-slate-600 mb-1"
													>
														近战精通: {player.perks.merit.meleemastery || 0}
													</label>
													<input
														id={meleeMasteryId}
														type="range"
														min="0"
														max="10"
														value={player.perks.merit.meleemastery || 0}
														onChange={(e) =>
															updateMerit(
																"meleemastery",
																parseInt(e.target.value),
															)
														}
														className="w-full accent-slate-600"
														aria-label={`${playerName}近战精通`}
													/>
												</div>
												<div>
													<label
														htmlFor={temporaryMasteryId}
														className="block text-xs text-slate-600 mb-1"
													>
														临时武器精通:{" "}
														{player.perks.merit.temporarymastery || 0}
													</label>
													<input
														id={temporaryMasteryId}
														type="range"
														min="0"
														max="10"
														value={player.perks.merit.temporarymastery || 0}
														onChange={(e) =>
															updateMerit(
																"temporarymastery",
																parseInt(e.target.value),
															)
														}
														className="w-full accent-slate-600"
														aria-label={`${playerName}临时武器精通`}
													/>
												</div>
												<div>
													<label
														htmlFor={pistolMasteryId}
														className="block text-xs text-slate-600 mb-1"
													>
														手枪精通: {player.perks.merit.pistolmastery || 0}
													</label>
													<input
														id={pistolMasteryId}
														type="range"
														min="0"
														max="10"
														value={player.perks.merit.pistolmastery || 0}
														onChange={(e) =>
															updateMerit(
																"pistolmastery",
																parseInt(e.target.value),
															)
														}
														className="w-full accent-slate-600"
														aria-label={`${playerName}手枪精通`}
													/>
												</div>
												<div>
													<label
														htmlFor={rifleMasteryId}
														className="block text-xs text-slate-600 mb-1"
													>
														步枪精通: {player.perks.merit.riflemastery || 0}
													</label>
													<input
														id={rifleMasteryId}
														type="range"
														min="0"
														max="10"
														value={player.perks.merit.riflemastery || 0}
														onChange={(e) =>
															updateMerit(
																"riflemastery",
																parseInt(e.target.value),
															)
														}
														className="w-full accent-slate-600"
														aria-label={`${playerName}步枪精通`}
													/>
												</div>
												<div>
													<label
														htmlFor={shotgunMasteryId}
														className="block text-xs text-slate-600 mb-1"
													>
														霰弹枪精通: {player.perks.merit.shotgunmastery || 0}
													</label>
													<input
														id={shotgunMasteryId}
														type="range"
														min="0"
														max="10"
														value={player.perks.merit.shotgunmastery || 0}
														onChange={(e) =>
															updateMerit(
																"shotgunmastery",
																parseInt(e.target.value),
															)
														}
														className="w-full accent-slate-600"
														aria-label={`${playerName}霰弹枪精通`}
													/>
												</div>
												<div>
													<label
														htmlFor={smgMasteryId}
														className="block text-xs text-slate-600 mb-1"
													>
														冲锋枪精通: {player.perks.merit.smgmastery || 0}
													</label>
													<input
														id={smgMasteryId}
														type="range"
														min="0"
														max="10"
														value={player.perks.merit.smgmastery || 0}
														onChange={(e) =>
															updateMerit(
																"smgmastery",
																parseInt(e.target.value),
															)
														}
														className="w-full accent-slate-600"
														aria-label={`${playerName}冲锋枪精通`}
													/>
												</div>
												<div>
													<label
														htmlFor={machinegunMasteryId}
														className="block text-xs text-slate-600 mb-1"
													>
														机枪精通:{" "}
														{player.perks.merit.machinegunmastery || 0}
													</label>
													<input
														id={machinegunMasteryId}
														type="range"
														min="0"
														max="10"
														value={player.perks.merit.machinegunmastery || 0}
														onChange={(e) =>
															updateMerit(
																"machinegunmastery",
																parseInt(e.target.value),
															)
														}
														className="w-full accent-slate-600"
														aria-label={`${playerName}机枪精通`}
													/>
												</div>
												<div>
													<label
														htmlFor={heavyartilleryMasteryId}
														className="block text-xs text-slate-600 mb-1"
													>
														重型火炮精通:{" "}
														{player.perks.merit.heavyartillerymastery || 0}
													</label>
													<input
														id={heavyartilleryMasteryId}
														type="range"
														min="0"
														max="10"
														value={
															player.perks.merit.heavyartillerymastery || 0
														}
														onChange={(e) =>
															updateMerit(
																"heavyartillerymastery",
																parseInt(e.target.value),
															)
														}
														className="w-full accent-slate-600"
														aria-label={`${playerName}重型火炮精通`}
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</TabsContent>

						{/* 导入导出 Tab */}
						<TabsContent value="import-export">
							<div className="space-y-3">
								<div className="space-y-2">
									<Label>导入配置</Label>
									<div className="flex space-x-2">
										<Input
											type="text"
											value={importText}
											onChange={(e) => setImportText(e.target.value)}
											placeholder="粘贴导出的配置JSON..."
											className="flex-1"
											aria-label={`${playerName}导入配置`}
										/>
										<Button
											onClick={importPlayer}
											variant="secondary"
											disabled={!importText.trim()}
											className="transition-colors duration-200"
										>
											导入
										</Button>
									</div>
								</div>
								<div className="space-y-2">
									<Label>导出配置</Label>
									<div className="flex space-x-2">
										<Input
											type="text"
											value={exportText}
											readOnly
											placeholder="点击导出按钮生成配置..."
											className="flex-1 bg-muted"
											aria-label={`${playerName}导出配置`}
										/>
										<Button
											onClick={exportPlayer}
											variant="secondary"
											className="transition-colors duration-200"
										>
											导出
										</Button>
									</div>
								</div>
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
