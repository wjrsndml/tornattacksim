"use client";

import {
	BarChart3,
	FileText,
	Lightbulb,
	Swords,
	TrendingUp,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import BattleLogExport from "./components/BattleLogExport";
import LifeHistogram from "./components/LifeHistogram";
import PlayerConfig from "./components/PlayerConfig";
import SimulationResults from "./components/SimulationResults";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { runClientSimulation } from "./lib/clientSimulator";
import { loadGameData } from "./lib/dataLoader";
import type {
	ArmourData,
	BattleStats,
	CompanyPerks,
	EducationPerks,
	FactionPerks,
	MeritPerks,
	PropertyPerks,
	WeaponData,
} from "./lib/fightSimulatorTypes";

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

interface BattleLogEntry {
	turn: number;
	attacker: string;
	action: string;
	target: string;
	damage: number;
	weapon: string;
	bodyPart: string;
	effect?: string;
	timestamp: number;
}

interface SimulationResult {
	totalSimulations: number;
	heroWins: number;
	villainWins: number;
	stalemates: number;
	heroWinRate: number;
	villainWinRate: number;
	stalemateRate: number;
	averageTurns: number;
	averageHeroLifeRemaining: number;
	averageVillainLifeRemaining: number;
	lastFightLog: string[];
	heroLifeDistribution: Record<string, number>;
	villainLifeDistribution: Record<string, number>;
	allBattleLogs:
		| Array<{
				battleNumber: number;
				winner: string;
				turns: number;
				heroDamageDealt: number;
				villainDamageDealt: number;
				heroFinalLife: number;
				villainFinalLife: number;
				battleLog: string[];
		  }>
		| undefined; // 可选的战斗日志数组
}

const createDefaultPlayer = (name: string, isAttacker: boolean): Player => {
	const defaultStats: BattleStats = {
		strength: 1000000,
		speed: 1000000,
		defense: 1000000,
		dexterity: 1000000,
	};

	const defaultPassives: BattleStats = {
		strength: 10,
		speed: 10,
		defense: 10,
		dexterity: 10,
	};

	const defaultEducation: EducationPerks = {
		damage: false,
		meleedamage: false,
		japanesedamage: false,
		tempdamage: false,
		needleeffect: false,
		fistdamage: false,
		neckdamage: false,
		critchance: false,
		ammocontrol1: false,
		ammocontrol2: false,
		machinegunaccuracy: false,
		smgaccuracy: false,
		pistolaccuracy: false,
		rifleaccuracy: false,
		heavyartilleryaccuracy: false,
		shotgunaccuracy: false,
		temporaryaccuracy: false,
	};

	const defaultFaction: FactionPerks = {
		accuracy: 0,
		damage: 2,
	};

	const defaultCompany: CompanyPerks = {
		name: "n/a",
		star: 0,
	};

	const defaultProperty: PropertyPerks = {
		damage: false,
	};

	const defaultMerit: MeritPerks = {
		critrate: 2,
		riflemastery: 2,
		smgmastery: 2,
		piercingmastery: 1,
		temporarymastery: 2,
	};

	// 默认武器配置
	const defaultPrimary: WeaponData = {
		name: "ArmaLite M-15A4",
		category: "Rifle",
		clipsize: 15,
		rateoffire: [3, 5] as [number, number],
		bonus: {
			name: "n/a",
			proc: 0,
		},
		accuracy: 57,
		damage: 68,
		experience: 5,
		ammo: "",
		mods: ["1mW Laser", "ACOG Sight"],
	};

	const defaultSecondary: WeaponData = {
		name: "BT MP9",
		category: "SMG",
		clipsize: 30,
		rateoffire: [2, 25] as [number, number],
		bonus: {
			name: "n/a",
			proc: 0,
		},
		accuracy: 55,
		damage: 61.4,
		experience: 12,
		ammo: "",
		mods: ["Thermal Sight", "Skeet Choke"],
	};

	const defaultMelee: WeaponData = {
		name: "Macana",
		category: "Piercing",
		clipsize: 0,
		rateoffire: [1, 1] as [number, number],
		bonus: {
			name: "n/a",
			proc: 0,
		},
		accuracy: 65,
		damage: 57,
		experience: 16,
		ammo: "",
		mods: [],
	};

	const defaultTemporary: WeaponData = {
		name: "HEG",
		category: "Throwable",
		clipsize: 1,
		rateoffire: [1, 1] as [number, number],
		bonus: {
			name: "n/a",
			proc: 0,
		},
		accuracy: 116,
		damage: 90,
		experience: 7,
		ammo: "",
		mods: [],
	};

	// 默认护甲配置
	const defaultArmour = {
		head: {
			set: "n/a",
			type: "Motorcycle Helmet",
			armour_range: [30, 35],
			default: true,
			id: "642",
			armour: 32.5,
		},
		body: {
			set: "n/a",
			type: "Full Body Armor",
			armour_range: [31, 36],
			default: true,
			id: "49",
			armour: 33.5,
		},
		hands: {
			set: "Combat",
			type: "Combat Gloves",
			armour_range: [38, 43],
			default: true,
			id: "654",
			armour: 40.5,
		},
		legs: {
			set: "Combat",
			type: "Combat Pants",
			armour_range: [38, 43],
			default: true,
			id: "652",
			armour: 40.5,
		},
		feet: {
			set: "Combat",
			type: "Combat Boots",
			armour_range: [38, 43],
			default: true,
			id: "653",
			armour: 40.5,
		},
	};

	return {
		name,
		life: 2375,
		stats: defaultStats,
		passives: defaultPassives,
		weapons: {
			primary: defaultPrimary,
			secondary: defaultSecondary,
			melee: defaultMelee,
			temporary: defaultTemporary,
		},
		armour: defaultArmour,
		attacksettings: {
			primary: { setting: isAttacker ? 1 : 0, reload: true },
			secondary: { setting: isAttacker ? 0 : 0, reload: true },
			melee: { setting: isAttacker ? 2 : 0, reload: false },
			temporary: { setting: isAttacker ? 0 : 0, reload: false },
		},
		defendsettings: {
			primary: { setting: isAttacker ? 0 : 5, reload: true },
			secondary: { setting: isAttacker ? 0 : 3, reload: true },
			melee: { setting: isAttacker ? 0 : 2, reload: false },
			temporary: { setting: isAttacker ? 0 : 0, reload: false },
		},
		perks: {
			education: defaultEducation,
			faction: defaultFaction,
			company: defaultCompany,
			property: defaultProperty,
			merit: defaultMerit,
		},
	};
};

export default function Home() {
	const simulationCountId = useId();
	const [_simulations, _setSimulations] = useState(10000);
	const [isSimulating, setIsSimulating] = useState(false);
	const [results, setResults] = useState<SimulationResult | null>(null);
	const [dataLoaded, setDataLoaded] = useState(false);
	const [_battleLogs, setBattleLogs] = useState<BattleLogEntry[]>([]);
	const [allBattleLogs, setAllBattleLogs] = useState<
		Array<{
			battleNumber: number;
			winner: string;
			turns: number;
			heroDamageDealt: number;
			villainDamageDealt: number;
			heroFinalLife: number;
			villainFinalLife: number;
			battleLog: string[];
		}>
	>([]); // 存储所有战斗日志
	const [lifeData, setLifeData] = useState<{
		player1: number[];
		player2: number[];
	}>({
		player1: [],
		player2: [],
	});
	const [simulationSettings, setSimulationSettings] = useState({
		fights: 10000,
		enableLog: false,
		enableLifeHisto: false,
	});
	const [_battleResult, setBattleResult] = useState<
		"player1" | "player2" | "stalemate" | null
	>(null);

	const [player1, setPlayer1] = useState<Player>(
		createDefaultPlayer("Attacker", true),
	);
	const [player2, setPlayer2] = useState<Player>(
		createDefaultPlayer("Defender", false),
	);

	useEffect(() => {
		async function initializeData() {
			try {
				await loadGameData();

				// 重新创建默认玩家，这次使用加载的数据
				setPlayer1(createDefaultPlayer("Attacker", true));
				setPlayer2(createDefaultPlayer("Defender", false));

				setDataLoaded(true);
			} catch (error) {
				console.error("Failed to load game data:", error);
			}
		}

		initializeData();
	}, []);

	const handleSimulate = async () => {
		setIsSimulating(true);
		setBattleLogs([]);
		setAllBattleLogs([]); // 清空所有战斗日志
		setLifeData({ player1: [], player2: [] });
		setBattleResult(null);

		try {
			// 使用客户端模拟器
			const data = await runClientSimulation(
				player1,
				player2,
				simulationSettings.fights,
				simulationSettings.enableLog,
			);

			if (data.success && data.results) {
				const results = data.results;
				setResults(results);

				// 如果启用了战斗日志，设置所有战斗日志数据
				if (simulationSettings.enableLog && results.allBattleLogs) {
					setAllBattleLogs(results.allBattleLogs);
				}

				// 根据模拟结果设置战斗结果
				if (results.heroWinRate > results.villainWinRate) {
					setBattleResult("player1"); // Attacker赢
				} else if (results.villainWinRate > results.heroWinRate) {
					setBattleResult("player2"); // Defender赢
				} else {
					setBattleResult("stalemate"); // 平局
				}

				// 如果启用了生命值分布，设置数据
				if (
					simulationSettings.enableLifeHisto &&
					results.heroLifeDistribution
				) {
					// 将生命值分布转换为数组格式
					const convertLifeDistribution = (
						lifeDist: number[] | Record<string, number>,
					): number[] => {
						// 如果已经是数组，直接返回
						if (Array.isArray(lifeDist)) {
							return lifeDist;
						}

						// 如果是对象，转换为数组
						const lifeArray: number[] = [];
						for (const [life, count] of Object.entries(lifeDist)) {
							const lifeValue = parseInt(life);
							if (
								!Number.isNaN(lifeValue) &&
								typeof count === "number" &&
								count > 0
							) {
								// 根据出现次数添加相应数量的生命值
								for (let i = 0; i < count; i++) {
									lifeArray.push(lifeValue);
								}
							}
						}
						return lifeArray;
					};

					const player1LifeData = convertLifeDistribution(
						results.heroLifeDistribution,
					);
					const player2LifeData = convertLifeDistribution(
						results.villainLifeDistribution,
					);

					setLifeData({
						player1: player1LifeData,
						player2: player2LifeData,
					});
				}
			} else {
				console.error("Simulation failed:", data.error);
				alert(`模拟失败: ${data.error}`);
			}
		} catch (error) {
			console.error("Error running simulation:", error);
			alert(
				"运行模拟时出错: " +
					(error instanceof Error ? error.message : "未知错误"),
			);
		} finally {
			setIsSimulating(false);
		}
	};

	const copyPlayer = (from: Player, to: 1 | 2) => {
		const copiedPlayer = {
			...from,
			name: to === 1 ? "Attacker" : "Defender",
		};
		if (to === 1) {
			setPlayer1(copiedPlayer);
		} else {
			setPlayer2(copiedPlayer);
		}
	};

	if (!dataLoaded) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="text-center space-y-4">
					<div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-900 border-t-transparent mx-auto"></div>
					<p className="text-lg text-slate-600">正在加载游戏数据...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* 模拟控制 */}
			<Card className="shadow-sm">
				<CardContent className="p-6">
					<div className="flex flex-col lg:flex-row justify-between items-center gap-6">
						<div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
							<div className="space-y-2">
								<Label
									htmlFor={simulationCountId}
									className="text-sm font-medium"
								>
									模拟次数: {simulationSettings.fights.toLocaleString()}
								</Label>
								<Input
									id={simulationCountId}
									type="range"
									min="100"
									max="100000"
									step="100"
									value={simulationSettings.fights}
									onChange={(e) =>
										setSimulationSettings((prev) => ({
											...prev,
											fights: parseInt(e.target.value),
										}))
									}
									className="w-48 accent-slate-600"
								/>
								<div className="flex justify-between text-xs text-slate-500">
									<span>100</span>
									<span>100,000</span>
								</div>
							</div>

							<div className="flex flex-col justify-center space-y-2">
								<label className="flex items-center space-x-2 text-sm">
									<input
										type="checkbox"
										checked={simulationSettings.enableLog}
										onChange={(e) =>
											setSimulationSettings((prev) => ({
												...prev,
												enableLog: e.target.checked,
											}))
										}
										className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
									/>
									启用战斗日志记录
								</label>
								<label className="flex items-center space-x-2 text-sm">
									<input
										type="checkbox"
										checked={simulationSettings.enableLifeHisto}
										onChange={(e) =>
											setSimulationSettings((prev) => ({
												...prev,
												enableLifeHisto: e.target.checked,
											}))
										}
										className="rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
									/>
									启用生命值分布图
								</label>
							</div>
						</div>

						<div className="flex justify-end">
							<Button
								onClick={handleSimulate}
								disabled={isSimulating}
								className="min-w-[120px] bg-slate-900 hover:bg-slate-800 text-white font-medium disabled:bg-slate-400 transition-colors duration-200"
								size="lg"
							>
								{isSimulating ? (
									<span className="flex items-center gap-2">
										<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
										模拟中...
									</span>
								) : (
									"开始战斗"
								)}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* 玩家1配置 */}
				<div className="space-y-4">
					<PlayerConfig
						player={player1}
						onPlayerChange={setPlayer1}
						playerName="Attacker"
						isAttacker={true}
						onCopyFromOther={() => copyPlayer(player2, 1)}
					/>
				</div>

				{/* 玩家2配置 */}
				<div className="space-y-4">
					<PlayerConfig
						player={player2}
						onPlayerChange={setPlayer2}
						playerName="Defender"
						isAttacker={false}
						onCopyFromOther={() => copyPlayer(player1, 2)}
					/>
				</div>

				{/* 结果显示 */}
				<div className="space-y-4">
					<Card className="shadow-sm">
						<CardHeader className="pb-4">
							<CardTitle className="text-lg">模拟结果</CardTitle>
						</CardHeader>
						<CardContent className="pt-0">
							<Tabs defaultValue="results" className="w-full">
								<TabsList className="grid w-full grid-cols-3">
									<TabsTrigger value="results" className="text-xs">
										<BarChart3 className="w-4 h-4 mr-2" />
										战斗结果
									</TabsTrigger>
									<TabsTrigger
										value="logs"
										className="text-xs"
										disabled={
											!simulationSettings.enableLog ||
											allBattleLogs.length === 0
										}
									>
										<FileText className="w-4 h-4 mr-2" />
										战斗日志
									</TabsTrigger>
									<TabsTrigger
										value="life"
										className="text-xs"
										disabled={
											!simulationSettings.enableLifeHisto ||
											lifeData.player1.length === 0
										}
									>
										<TrendingUp className="w-4 h-4 mr-2" />
										生命分布
									</TabsTrigger>
								</TabsList>

								<TabsContent value="results" className="mt-4">
									{results ? (
										<SimulationResults
											results={results}
											player1Name={player1.name}
											player2Name={player2.name}
										/>
									) : (
										<div className="space-y-6 flex flex-col justify-center">
											{/* 空状态占位内容 */}
											<div className="text-center space-y-4">
												<div className="flex justify-center">
													<Swords className="w-16 h-16 text-slate-300" />
												</div>
												<h3 className="text-lg font-medium text-slate-700">
													准备开始战斗模拟
												</h3>
												<p className="text-sm text-slate-500 max-w-md mx-auto">
													配置好攻击方和防守方的属性、武器装备后，点击上方的"开始战斗"按钮来运行模拟
												</p>
											</div>

											{/* 模拟器功能预览 */}
											<div className="space-y-4">
												<h4 className="text-md font-medium text-slate-700 text-center">
													即将获得
												</h4>
												<div className="grid grid-cols-1 gap-3">
													<div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-md">
														<BarChart3 className="w-5 h-5 text-slate-500" />
														<div className="text-sm">
															<div className="font-medium text-slate-700">
																详细统计数据
															</div>
															<div className="text-slate-600 text-xs">
																胜率分析、平均回合数、剩余生命值
															</div>
														</div>
													</div>
													<div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-md">
														<FileText className="w-5 h-5 text-slate-500" />
														<div className="text-sm">
															<div className="font-medium text-slate-700">
																战斗日志
															</div>
															<div className="text-slate-600 text-xs">
																详细的战斗过程记录和CSV导出
															</div>
														</div>
													</div>
													<div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-md">
														<TrendingUp className="w-5 h-5 text-slate-500" />
														<div className="text-sm">
															<div className="font-medium text-slate-700">
																生命值分布图
															</div>
															<div className="text-slate-600 text-xs">
																可视化的生命值分布统计图表
															</div>
														</div>
													</div>
												</div>
											</div>

											{/* 快速提示 */}
											<div className="bg-slate-50 border border-slate-200 rounded-md p-4">
												<div className="flex items-start space-x-3">
													<Lightbulb className="w-5 h-5 text-slate-500 mt-0.5" />
													<div className="text-sm">
														<div className="font-medium text-slate-700 mb-1">
															快速开始提示
														</div>
														<div className="text-slate-600 text-xs space-y-1">
															<p>• 默认配置已经可以直接开始模拟</p>
															<p>• 建议先用较少次数（如1000次）测试</p>
															<p>• 启用日志记录可以查看详细战斗过程</p>
														</div>
													</div>
												</div>
											</div>
										</div>
									)}
								</TabsContent>

								<TabsContent value="logs" className="mt-4">
									{simulationSettings.enableLog && allBattleLogs.length > 0 && (
										<BattleLogExport
											allBattleLogs={allBattleLogs}
											player1Name={player1.name}
											player2Name={player2.name}
										/>
									)}
								</TabsContent>

								<TabsContent value="life" className="mt-4">
									{simulationSettings.enableLifeHisto &&
										lifeData.player1.length > 0 && (
											<div className="space-y-4">
												<LifeHistogram
													lifeData={lifeData.player1}
													playerName={player1.name}
													totalFights={simulationSettings.fights}
												/>
												<LifeHistogram
													lifeData={lifeData.player2}
													playerName={player2.name}
													totalFights={simulationSettings.fights}
												/>
											</div>
										)}
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
