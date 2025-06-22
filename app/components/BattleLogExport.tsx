"use client";

import { useId, useState } from "react";
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

	const exportToCSV = () => {
		if (!allBattleLogs || allBattleLogs.length === 0) {
			alert("没有战斗日志可导出");
			return;
		}

		// CSV 头部
		const headers = [
			"战斗编号",
			"胜利者",
			"回合数",
			`${player1Name}造成伤害`,
			`${player2Name}造成伤害`,
			`${player1Name}剩余生命`,
			`${player2Name}剩余生命`,
			"详细战斗日志",
		];

		// 转换数据为CSV格式
		const csvData = allBattleLogs.map((battle) => [
			battle.battleNumber,
			battle.winner,
			battle.turns,
			battle.heroDamageDealt,
			battle.villainDamageDealt,
			battle.heroFinalLife,
			battle.villainFinalLife,
			`"${battle.battleLog.join("; ")}"`, // 用分号分隔日志条目，用引号包围以处理逗号
		]);

		// 创建CSV内容
		const csvContent = [
			headers.join(","),
			...csvData.map((row) => row.join(",")),
		].join("\n");

		// 创建并下载文件
		const blob = new Blob([`\uFEFF${csvContent}`], {
			type: "text/csv;charset=utf-8;",
		}); // 添加BOM以支持中文
		const link = document.createElement("a");
		const url = URL.createObjectURL(blob);

		link.setAttribute("href", url);
		link.setAttribute(
			"download",
			`battle_logs_${new Date().toISOString().slice(0, 10)}.csv`,
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

					<div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200">
						<p className="font-medium mb-2">导出的CSV文件包含以下列：</p>
						<ul className="list-disc list-inside space-y-1">
							<li>战斗编号、胜利者、回合数</li>
							<li>双方造成的伤害和剩余生命值</li>
							<li>完整的战斗日志详情</li>
						</ul>
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
