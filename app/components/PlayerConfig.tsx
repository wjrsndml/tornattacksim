"use client";

import {
	BarChart3,
	Download,
	Settings,
	Shield,
	Swords,
	Zap,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { getCompanyList, loadGameData } from "../lib/dataLoader";
import type {
	ArmourData,
	BattleStats,
	CompanyPerks,
	EducationPerks,
	FactionPerks,
	MeritPerks,
	PropertyPerks,
	WeaponData,
} from "../lib/fightSimulatorTypes";
import ArmourCoverage from "./ArmourCoverage";
import ArmourSelector from "./ArmourSelector";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
}

export default function PlayerConfig({
	player,
	onPlayerChange,
	playerName,
	isAttacker,
	onCopyFromOther,
}: PlayerConfigProps) {
	const [companies, setCompanies] = useState<string[]>([]);
	const [_showAdvanced, _setShowAdvanced] = useState(false);
	const [importText, setImportText] = useState("");
	const [exportText, setExportText] = useState("");
	const [activeTab, setActiveTab] = useState<
		"stats" | "weapons" | "armour" | "combat" | "advanced"
	>("stats");

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
		weaponType: keyof Player["attacksettings"],
		field: "setting" | "reload",
		value: number | boolean,
	) => {
		updatePlayer({
			attacksettings: {
				...player.attacksettings,
				[weaponType]: { ...player.attacksettings[weaponType], [field]: value },
			},
		});
	};

	const updateDefendSettings = (
		weaponType: keyof Player["defendsettings"],
		field: "setting" | "reload",
		value: number | boolean,
	) => {
		updatePlayer({
			defendsettings: {
				...player.defendsettings,
				[weaponType]: { ...player.defendsettings[weaponType], [field]: value },
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
			isAttacker ? player.attacksettings : "", // 8: attackSettings
			!isAttacker ? player.defendsettings : "", // 9: defendSettings
			player.perks.education, // 10: educationPerks
			player.perks.faction, // 11: factionPerks
			player.perks.company, // 12: companyPerks
			player.perks.property, // 13: propertyPerks
			player.perks.merit, // 14: meritPerks
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
				const stats = importData[3] || player.stats;
				const life = importData[4] || player.life;
				const passives = importData[5] || player.passives;
				const weapons = importData[6] || player.weapons;
				const armour = importData[7] || player.armour;
				const attacksettings = importData[8] || player.attacksettings;
				const defendsettings = importData[9] || player.defendsettings;
				const education = importData[10] || player.perks.education;
				const faction = importData[11] || player.perks.faction;
				const company = importData[12] || player.perks.company;
				const property = importData[13] || player.perks.property;
				const merit = importData[14] || player.perks.merit;

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
					attacksettings: attacksettings || player.attacksettings,
					defendsettings: defendsettings || player.defendsettings,
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
				updatePlayer({
					name: importData.name || player.name,
					life: importData.life || player.life,
					stats: importData.stats || player.stats,
					passives: importData.passives || player.passives,
					weapons: importData.weapons || player.weapons,
					armour: importData.armour || player.armour,
					attacksettings: importData.attacksettings || player.attacksettings,
					defendsettings: importData.defendsettings || player.defendsettings,
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

								{/* 基础属性 */}
								<div className="space-y-3">
									<h4 className="text-md font-semibold">基础属性</h4>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor={`${playerId}-strength`}>力量</Label>
											<Input
												id={`${playerId}-strength`}
												type="number"
												value={player.stats.strength}
												onChange={(e) =>
													updateStats(
														"strength",
														parseInt(e.target.value) || 1000,
													)
												}
												min="100"
												max="10000000"
												aria-label={`${playerName}力量`}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor={`${playerId}-speed`}>速度</Label>
											<Input
												id={`${playerId}-speed`}
												type="number"
												value={player.stats.speed}
												onChange={(e) =>
													updateStats("speed", parseInt(e.target.value) || 1000)
												}
												min="100"
												max="10000000"
												aria-label={`${playerName}速度`}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor={`${playerId}-defense`}>防御</Label>
											<Input
												id={`${playerId}-defense`}
												type="number"
												value={player.stats.defense}
												onChange={(e) =>
													updateStats(
														"defense",
														parseInt(e.target.value) || 1000,
													)
												}
												min="100"
												max="10000000"
												aria-label={`${playerName}防御`}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor={`${playerId}-dexterity`}>敏捷</Label>
											<Input
												id={`${playerId}-dexterity`}
												type="number"
												value={player.stats.dexterity}
												onChange={(e) =>
													updateStats(
														"dexterity",
														parseInt(e.target.value) || 1000,
													)
												}
												min="100"
												max="10000000"
												aria-label={`${playerName}敏捷`}
											/>
										</div>
									</div>
								</div>

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
										? "攻击方按优先级顺序使用武器（1最优先，0不使用）"
										: "防守方按权重随机选择武器（数值越大越容易选中，0不使用）"}
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
																? player.attacksettings[
																		weaponType as keyof Player["attacksettings"]
																	].setting
																: player.defendsettings[
																		weaponType as keyof Player["defendsettings"]
																	].setting
														}
														onChange={(e) => {
															const value = parseInt(e.target.value) || 0;
															if (isAttacker) {
																updateAttackSettings(
																	weaponType as keyof Player["attacksettings"],
																	"setting",
																	value,
																);
															} else {
																updateDefendSettings(
																	weaponType as keyof Player["defendsettings"],
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
																		? player.attacksettings[
																				weaponType as keyof Player["attacksettings"]
																			].reload
																		: player.defendsettings[
																				weaponType as keyof Player["defendsettings"]
																			].reload
																}
																onChange={(e) => {
																	if (isAttacker) {
																		updateAttackSettings(
																			weaponType as keyof Player["attacksettings"],
																			"reload",
																			e.target.checked,
																		);
																	} else {
																		updateDefendSettings(
																			weaponType as keyof Player["defendsettings"],
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
