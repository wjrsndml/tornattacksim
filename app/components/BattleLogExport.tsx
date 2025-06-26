"use client";

import { useId, useState } from "react";
import type { BattleStatsCollector } from "../lib/fightSimulatorTypes";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface BattleLogData {
	battleNumber: number;
	winner: string;
	turns: number;
	heroDamageDealt: number;
	villainDamageDealt: number;
	heroFinalLife: number;
	villainFinalLife: number;
	battleLog: string[];
	// 新增：详细统计数据
	detailedStats?: BattleStatsCollector;
}

interface BattleLogExportProps {
	allBattleLogs: BattleLogData[];
	player1Name: string;
	player2Name: string;
}

export default function BattleLogExport({
	allBattleLogs,
	player1Name,
	player2Name,
}: BattleLogExportProps) {
	const battleNumberInputId = useId();
	const [viewBattleNumber, setViewBattleNumber] = useState<string>("");
	const [selectedBattle, setSelectedBattle] = useState<BattleLogData | null>(
		null,
	);

	// 新增：导出选项状态
	const [exportOptions, setExportOptions] = useState({
		basicSummary: true,
		damageStats: false,
		weaponEffects: false,
		armourEffects: false,
		weaponUsage: false,
		statusEffects: false,
		detailedLogs: false, // 新增：详细战斗日志选项
	});

	const exportToCSV = () => {
		if (!allBattleLogs || allBattleLogs.length === 0) {
			alert("没有战斗日志可导出");
			return;
		}

		// 检查是否有任何选项被选中
		const hasSelectedOptions = Object.values(exportOptions).some(Boolean);
		if (!hasSelectedOptions) {
			alert("请至少选择一个导出选项");
			return;
		}

		let csvData: string[][] = [];
		let headers: string[] = [];

		// 基础战斗摘要
		if (exportOptions.basicSummary) {
			headers = [
				"战斗编号",
				"胜利者",
				"回合数",
				`${player1Name}造成伤害`,
				`${player2Name}造成伤害`,
				`${player1Name}剩余生命`,
				`${player2Name}剩余生命`,
			];
		}

		// 详细战斗日志
		if (exportOptions.detailedLogs) {
			headers.push("详细战斗日志");
		}

		// 伤害统计
		if (exportOptions.damageStats) {
			// 添加伤害统计相关的列
			for (const playerName of [player1Name, player2Name]) {
				headers.push(
					`${playerName}_主武器伤害`,
					`${playerName}_副武器伤害`,
					`${playerName}_近战武器伤害`,
					`${playerName}_临时武器伤害`,
					`${playerName}_徒手伤害`,
					`${playerName}_脚踢伤害`,
					`${playerName}_普通伤害`,
					`${playerName}_暴击伤害`,
					`${playerName}_最大单次伤害`,
					`${playerName}_总攻击次数`,
					`${playerName}_命中次数`,
					`${playerName}_暴击次数`,
					`${playerName}_命中率`,
					`${playerName}_暴击率`,
				);
			}
		}

		// 武器使用统计
		if (exportOptions.weaponUsage) {
			for (const playerName of [player1Name, player2Name]) {
				headers.push(
					`${playerName}_主武器弹药消耗`,
					`${playerName}_副武器弹药消耗`,
					`${playerName}_主武器重装次数`,
					`${playerName}_副武器重装次数`,
					`${playerName}_攻击时主武器选择`,
					`${playerName}_攻击时副武器选择`,
					`${playerName}_攻击时近战武器选择`,
					`${playerName}_防御时主武器选择`,
					`${playerName}_防御时副武器选择`,
					`${playerName}_防御时近战武器选择`,
				);
			}
		}

		// 身体部位命中统计
		if (exportOptions.armourEffects) {
			for (const playerName of [player1Name, player2Name]) {
				headers.push(
					`${playerName}_头部被击中次数`,
					`${playerName}_身体被击中次数`,
					`${playerName}_手部被击中次数`,
					`${playerName}_腿部被击中次数`,
					`${playerName}_脚部被击中次数`,
				);
			}
		}

		// 转换数据为CSV格式
		csvData = allBattleLogs.map((battle) => {
			const row: string[] = [];

			// 基础战斗摘要
			if (exportOptions.basicSummary) {
				row.push(
					String(battle.battleNumber),
					battle.winner,
					String(battle.turns),
					String(battle.heroDamageDealt),
					String(battle.villainDamageDealt),
					String(battle.heroFinalLife),
					String(battle.villainFinalLife),
				);
			}

			// 详细战斗日志
			if (exportOptions.detailedLogs) {
				row.push(`"${battle.battleLog.join("; ")}"`);
			}

			// 伤害统计
			if (exportOptions.damageStats && battle.detailedStats) {
				for (const playerName of [player1Name, player2Name]) {
					const stats = battle.detailedStats.damageStats[playerName];
					if (stats) {
						row.push(
							String(stats.weaponDamage.primary),
							String(stats.weaponDamage.secondary),
							String(stats.weaponDamage.melee),
							String(stats.weaponDamage.temporary),
							String(stats.weaponDamage.fists),
							String(stats.weaponDamage.kick),
							String(stats.damageTypes.normal),
							String(stats.damageTypes.critical),
							String(stats.damageTypes.maxSingleHit),
							String(stats.hitStats.totalAttacks),
							String(stats.hitStats.hits),
							String(stats.hitStats.criticals),
							String(
								stats.hitStats.totalAttacks > 0
									? (stats.hitStats.hits / stats.hitStats.totalAttacks) * 100
									: 0,
							),
							String(
								stats.hitStats.hits > 0
									? (stats.hitStats.criticals / stats.hitStats.hits) * 100
									: 0,
							),
						);
					} else {
						// 如果没有统计数据，填充空值
						row.push(...new Array(14).fill("0"));
					}
				}
			}

			// 武器使用统计
			if (exportOptions.weaponUsage && battle.detailedStats) {
				for (const playerName of [player1Name, player2Name]) {
					const usage = battle.detailedStats.weaponUsage[playerName];
					if (usage) {
						row.push(
							String(usage.ammoConsumption.primary || 0),
							String(usage.ammoConsumption.secondary || 0),
							String(usage.reloadCount.primary || 0),
							String(usage.reloadCount.secondary || 0),
							String(usage.weaponChoices.attack.primary || 0),
							String(usage.weaponChoices.attack.secondary || 0),
							String(usage.weaponChoices.attack.melee || 0),
							String(usage.weaponChoices.defend.primary || 0),
							String(usage.weaponChoices.defend.secondary || 0),
							String(usage.weaponChoices.defend.melee || 0),
						);
					} else {
						row.push(...new Array(10).fill("0"));
					}
				}
			}

			// 身体部位命中统计
			if (exportOptions.armourEffects && battle.detailedStats) {
				for (const playerName of [player1Name, player2Name]) {
					const armour = battle.detailedStats.armourEffects[playerName];
					if (armour) {
						row.push(
							String(armour.bodyPartHits.head),
							String(armour.bodyPartHits.body),
							String(armour.bodyPartHits.hands),
							String(armour.bodyPartHits.legs),
							String(armour.bodyPartHits.feet),
						);
					} else {
						row.push(...new Array(5).fill("0"));
					}
				}
			}

			return row;
		});

		// 创建CSV内容
		const csvContent = [
			headers.join(","),
			...csvData.map((row) => row.join(",")),
		].join("\n");

		// 创建并下载文件
		const blob = new Blob([`\uFEFF${csvContent}`], {
			type: "text/csv;charset=utf-8;",
		});
		const link = document.createElement("a");
		const url = URL.createObjectURL(blob);

		link.setAttribute("href", url);
		link.setAttribute(
			"download",
			`battle_stats_${new Date().toISOString().slice(0, 10)}.csv`,
		);
		link.style.visibility = "hidden";

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const viewBattleLog = () => {
		const battleNum = parseInt(viewBattleNumber);
		if (
			Number.isNaN(battleNum) ||
			battleNum < 1 ||
			battleNum > allBattleLogs.length
		) {
			alert(`请输入有效的战斗编号 (1-${allBattleLogs.length})`);
			return;
		}

		const battle = allBattleLogs.find((b) => b.battleNumber === battleNum);
		if (battle) {
			setSelectedBattle(battle);
		} else {
			alert("找不到指定的战斗记录");
		}
	};

	// 解析日志信息并返回颜色样式（攻击者绿色，防御者红色）
	const getLogLineStyle = (
		message: string,
		battleResult: "player1" | "player2" | "stalemate",
	) => {
		// 检查是否是胜利/平局消息
		if (message.includes("won") || message.includes("Stalemate")) {
			if (message.includes(`${player1Name} won`)) {
				return "p-2 rounded-md text-sm transition-colors bg-green-100/80 border-l-4 border-green-300/80 text-green-800 font-medium";
			} else if (message.includes(`${player2Name} won`)) {
				return "p-2 rounded-md text-sm transition-colors bg-red-100/80 border-l-4 border-red-300/80 text-red-800 font-medium";
			} else if (message.includes("Stalemate")) {
				return "p-2 rounded-md text-sm transition-colors bg-yellow-100/80 border-l-4 border-yellow-300/80 text-yellow-800 font-medium";
			}
		}

		// 更精确地判断是谁的行动：检查消息开头
		const isPlayer1Action = message.startsWith(`${player1Name} `);
		const isPlayer2Action = message.startsWith(`${player2Name} `);

		// 基础背景色：攻击者使用淡绿色，防御者使用淡红色
		let baseStyle = "p-2 rounded-md text-sm transition-colors text-slate-600";
		if (isPlayer1Action) {
			baseStyle += " bg-green-50/60 border-l-4 border-green-200/60";
		} else if (isPlayer2Action) {
			baseStyle += " bg-red-50/60 border-l-4 border-red-200/60";
		}

		// 根据战斗结果调整颜色强度
		if (battleResult === "player1") {
			// Player1赢了，增强攻击者颜色
			if (isPlayer1Action) {
				baseStyle = baseStyle.replace(
					"bg-green-50/60 border-green-200/60",
					"bg-green-100/80 border-green-300/80",
				);
			} else if (isPlayer2Action) {
				baseStyle = baseStyle.replace(
					"bg-red-50/60 border-red-200/60",
					"bg-red-50/40 border-red-200/40",
				);
			}
		} else if (battleResult === "player2") {
			// Player2赢了，增强防御者颜色
			if (isPlayer1Action) {
				baseStyle = baseStyle.replace(
					"bg-green-50/60 border-green-200/60",
					"bg-green-50/40 border-green-200/40",
				);
			} else if (isPlayer2Action) {
				baseStyle = baseStyle.replace(
					"bg-red-50/60 border-red-200/60",
					"bg-red-100/80 border-red-300/80",
				);
			}
		} else if (battleResult === "stalemate") {
			// 平局，保持基础颜色但稍微增强
			if (isPlayer1Action) {
				baseStyle = baseStyle.replace(
					"bg-green-50/60 border-green-200/60",
					"bg-green-100/70 border-green-300/70",
				);
			} else if (isPlayer2Action) {
				baseStyle = baseStyle.replace(
					"bg-red-50/60 border-red-200/60",
					"bg-red-100/70 border-red-300/70",
				);
			}
		}

		return baseStyle;
	};

	if (!allBattleLogs || allBattleLogs.length === 0) {
		return null;
	}

	return (
		<div className="space-y-6">
			{/* 导出功能 */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold">战斗日志导出</h3>
					<Badge className="bg-slate-100 text-slate-700 border-slate-200">
						{allBattleLogs.length.toLocaleString()} 场战斗
					</Badge>
				</div>

				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-slate-600">
								共 {allBattleLogs.length.toLocaleString()} 场战斗日志可导出
							</p>
						</div>
						<Button
							onClick={exportToCSV}
							className="bg-slate-700 hover:bg-slate-800 text-white transition-colors duration-200"
						>
							导出CSV文件
						</Button>
					</div>

					{/* 导出选项 */}
					<div className="space-y-4 border border-slate-200 rounded-lg p-4">
						<div className="flex items-center justify-between">
							<h4 className="font-medium text-slate-700">选择导出数据类型</h4>
							<div className="flex space-x-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										setExportOptions({
											basicSummary: true,
											detailedLogs: false,
											damageStats: true,
											weaponUsage: false,
											armourEffects: false,
											weaponEffects: false,
											statusEffects: false,
										})
									}
									className="text-xs"
								>
									快速分析
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										setExportOptions({
											basicSummary: true,
											detailedLogs: true,
											damageStats: true,
											weaponUsage: true,
											armourEffects: true,
											weaponEffects: false,
											statusEffects: false,
										})
									}
									className="text-xs"
								>
									完整导出
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										setExportOptions({
											basicSummary: false,
											detailedLogs: true,
											damageStats: false,
											weaponUsage: false,
											armourEffects: false,
											weaponEffects: false,
											statusEffects: false,
										})
									}
									className="text-xs"
								>
									仅日志
								</Button>
							</div>
						</div>

						{/* 基础数据选项 */}
						<div className="space-y-3">
							<h5 className="text-sm font-medium text-slate-600">基础数据</h5>
							<div className="grid grid-cols-2 gap-3">
								<label className="flex items-center space-x-2 cursor-pointer">
									<input
										type="checkbox"
										checked={exportOptions.basicSummary}
										onChange={(e) =>
											setExportOptions((prev) => ({
												...prev,
												basicSummary: e.target.checked,
											}))
										}
										className="rounded border-slate-300"
									/>
									<span className="text-sm">基础战斗摘要</span>
								</label>

								<label className="flex items-center space-x-2 cursor-pointer">
									<input
										type="checkbox"
										checked={exportOptions.detailedLogs}
										onChange={(e) =>
											setExportOptions((prev) => ({
												...prev,
												detailedLogs: e.target.checked,
											}))
										}
										className="rounded border-slate-300"
									/>
									<span className="text-sm">详细战斗日志</span>
								</label>
							</div>
						</div>

						{/* 统计数据选项 */}
						<div className="space-y-3">
							<h5 className="text-sm font-medium text-slate-600">统计数据</h5>
							<div className="grid grid-cols-2 gap-3">
								<label className="flex items-center space-x-2 cursor-pointer">
									<input
										type="checkbox"
										checked={exportOptions.damageStats}
										onChange={(e) =>
											setExportOptions((prev) => ({
												...prev,
												damageStats: e.target.checked,
											}))
										}
										className="rounded border-slate-300"
									/>
									<span className="text-sm">伤害统计详情</span>
								</label>

								<label className="flex items-center space-x-2 cursor-pointer">
									<input
										type="checkbox"
										checked={exportOptions.weaponUsage}
										onChange={(e) =>
											setExportOptions((prev) => ({
												...prev,
												weaponUsage: e.target.checked,
											}))
										}
										className="rounded border-slate-300"
									/>
									<span className="text-sm">武器使用统计</span>
								</label>

								<label className="flex items-center space-x-2 cursor-pointer">
									<input
										type="checkbox"
										checked={exportOptions.armourEffects}
										onChange={(e) =>
											setExportOptions((prev) => ({
												...prev,
												armourEffects: e.target.checked,
											}))
										}
										className="rounded border-slate-300"
									/>
									<span className="text-sm">身体部位统计</span>
								</label>

								<label className="flex items-center space-x-2 cursor-pointer">
									<input
										type="checkbox"
										checked={exportOptions.weaponEffects}
										onChange={(e) =>
											setExportOptions((prev) => ({
												...prev,
												weaponEffects: e.target.checked,
											}))
										}
										className="rounded border-slate-300"
									/>
									<span className="text-sm text-slate-400">
										武器特效分析 (开发中)
									</span>
								</label>

								<label className="flex items-center space-x-2 cursor-pointer">
									<input
										type="checkbox"
										checked={exportOptions.statusEffects}
										onChange={(e) =>
											setExportOptions((prev) => ({
												...prev,
												statusEffects: e.target.checked,
											}))
										}
										className="rounded border-slate-300"
									/>
									<span className="text-sm text-slate-400">
										状态效果统计 (开发中)
									</span>
								</label>
							</div>
						</div>
					</div>

					<div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200">
						<p className="font-medium mb-2">导出功能说明：</p>
						<div className="space-y-2">
							<div>
								<p className="font-medium text-slate-700">基础数据：</p>
								<ul className="list-disc list-inside ml-2 space-y-1">
									<li>
										<strong>基础战斗摘要</strong>
										：战斗编号、胜利者、回合数、伤害和生命值
									</li>
									<li>
										<strong>详细战斗日志</strong>：完整的回合制战斗过程记录
									</li>
								</ul>
							</div>
							<div>
								<p className="font-medium text-slate-700">统计数据：</p>
								<ul className="list-disc list-inside ml-2 space-y-1">
									<li>
										<strong>伤害统计详情</strong>
										：各武器类型伤害、命中率、暴击率等
									</li>
									<li>
										<strong>武器使用统计</strong>
										：弹药消耗、重装次数、武器选择偏好
									</li>
									<li>
										<strong>身体部位统计</strong>：各身体部位被攻击的次数统计
									</li>
								</ul>
							</div>
						</div>
						<div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
							<p className="text-blue-700 text-xs">
								<strong>💡 使用建议：</strong>
							</p>
							<ul className="text-blue-600 text-xs list-disc list-inside ml-2 space-y-1">
								<li>
									<strong>快速分析</strong>：仅选择基础摘要 + 伤害统计
								</li>
								<li>
									<strong>深度分析</strong>：选择多个统计选项进行综合分析
								</li>
								<li>
									<strong>问题调试</strong>：包含详细日志查看具体战斗过程
								</li>
								<li>
									<strong>文件大小</strong>：详细日志会显著增加文件大小
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>

			{/* 查看特定战斗日志 */}
			<div className="space-y-4">
				<h3 className="text-lg font-semibold">查看战斗日志</h3>

				<div className="space-y-4">
					<div className="flex items-center space-x-4">
						<div className="flex items-center space-x-2">
							<Label
								htmlFor={battleNumberInputId}
								className="text-sm font-medium"
							>
								战斗编号:
							</Label>
							<Input
								id={battleNumberInputId}
								type="number"
								min="1"
								max={allBattleLogs.length}
								value={viewBattleNumber}
								onChange={(e) => setViewBattleNumber(e.target.value)}
								placeholder={`1-${allBattleLogs.length}`}
								className="w-32"
							/>
						</div>
						<Button
							onClick={viewBattleLog}
							variant="outline"
							className="transition-colors duration-200"
						>
							查看日志
						</Button>
						{selectedBattle && (
							<Button
								onClick={() => setSelectedBattle(null)}
								variant="ghost"
								size="sm"
								className="transition-colors duration-200"
							>
								清除
							</Button>
						)}
					</div>

					{/* 显示选中的战斗日志 */}
					{selectedBattle && (
						<div className="space-y-4">
							<div className="border-t pt-4">
								{/* 战斗统计 */}
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
									<div className="text-center space-y-1">
										<div className="text-sm text-slate-600">战斗编号</div>
										<div className="text-lg font-semibold">
											#{selectedBattle.battleNumber}
										</div>
									</div>
									<div className="text-center space-y-1">
										<div className="text-sm text-slate-600">胜利者</div>
										<Badge className="bg-slate-100 text-slate-700 border-slate-200">
											{selectedBattle.winner}
										</Badge>
									</div>
									<div className="text-center space-y-1">
										<div className="text-sm text-slate-600">回合数</div>
										<div className="text-lg font-semibold">
											{selectedBattle.turns}
										</div>
									</div>
									<div className="text-center space-y-1">
										<div className="text-sm text-slate-600">伤害对比</div>
										<div className="text-sm">
											<div className="text-slate-700">
												{selectedBattle.heroDamageDealt}
											</div>
											<div className="text-slate-700">
												{selectedBattle.villainDamageDealt}
											</div>
										</div>
									</div>
								</div>

								{/* 战斗日志 */}
								<div>
									<h4 className="font-medium mb-3">详细战斗日志</h4>
									<div className="space-y-2 max-h-80 overflow-y-auto bg-slate-50/50 p-4 rounded-md border border-slate-200">
										{selectedBattle.battleLog.map((message, index) => {
											const battleResult =
												selectedBattle.winner === player1Name
													? "player1"
													: selectedBattle.winner === player2Name
														? "player2"
														: "stalemate";
											return (
												<div
													key={`battle-${selectedBattle.battleNumber}-log-${index}`}
													className={getLogLineStyle(message, battleResult)}
												>
													{message}
												</div>
											);
										})}
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
