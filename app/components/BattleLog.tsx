"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";

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

interface BattleLogProps {
	logs: BattleLogEntry[];
	isActive: boolean;
	onClear: () => void;
	player1Name?: string; // Attacker名称
	player2Name?: string; // Defender名称
	battleResult?: "player1" | "player2" | "stalemate" | null; // 战斗结果
}

export default function BattleLog({
	logs,
	isActive,
	onClear,
	player1Name = "Attacker",
	player2Name = "Defender",
	battleResult,
}: BattleLogProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [autoScroll, setAutoScroll] = useState(true);
	const logEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (autoScroll && logEndRef.current) {
			logEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [autoScroll]);

	const formatAction = (entry: BattleLogEntry) => {
		const damageText =
			entry.damage > 0 ? `造成 ${entry.damage} 伤害` : "未命中";
		const bodyPartText = entry.bodyPart ? ` (${entry.bodyPart})` : "";
		const effectText = entry.effect ? ` [${entry.effect}]` : "";

		return `${entry.attacker} 使用 ${entry.weapon} 对 ${entry.target} 进行${entry.action}，${damageText}${bodyPartText}${effectText}`;
	};

	const getLogColor = (entry: BattleLogEntry) => {
		if (entry.damage === 0) return "text-slate-500";
		if (entry.damage > 100) return "text-slate-700 font-bold";
		if (entry.damage > 50) return "text-slate-600";
		return "text-slate-600";
	};

	const getLogBackgroundColor = (entry: BattleLogEntry) => {
		const isAttackerAction = entry.attacker === player1Name;
		const isDefenderAction = entry.attacker === player2Name;

		// 基础背景色：使用柔和的灰色系
		let baseColor = "";
		if (isAttackerAction) {
			baseColor = "bg-slate-50/50 border-l-4 border-slate-200";
		} else if (isDefenderAction) {
			baseColor = "bg-slate-50/50 border-l-4 border-slate-200";
		}

		// 如果有战斗结果，根据结果调整颜色强度
		if (battleResult) {
			if (battleResult === "player1") {
				// Attacker赢了
				if (isAttackerAction) {
					baseColor = "bg-slate-100 border-l-4 border-slate-300";
				} else if (isDefenderAction) {
					baseColor = "bg-slate-50 border-l-4 border-slate-200";
				}
			} else if (battleResult === "player2") {
				// Defender赢了
				if (isAttackerAction) {
					baseColor = "bg-slate-50 border-l-4 border-slate-200";
				} else if (isDefenderAction) {
					baseColor = "bg-slate-100 border-l-4 border-slate-300";
				}
			} else if (battleResult === "stalemate") {
				// 平局
				baseColor = "bg-slate-100 border-l-4 border-slate-300";
			}
		}

		return baseColor;
	};

	return (
		<Card>
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg">战斗日志</CardTitle>
					<div className="flex items-center space-x-2">
						<Label className="flex items-center text-sm cursor-pointer">
							<input
								type="checkbox"
								checked={autoScroll}
								onChange={(e) => setAutoScroll(e.target.checked)}
								className="mr-2 w-4 h-4 rounded border-slate-300 accent-slate-600 focus:ring-slate-500"
							/>
							自动滚动
						</Label>
						<Button
							type="button"
							onClick={() => setIsExpanded(!isExpanded)}
							variant="outline"
							size="sm"
						>
							{isExpanded ? "收起" : "展开"}
						</Button>
						<Button
							type="button"
							onClick={onClear}
							variant="outline"
							size="sm"
							disabled={logs.length === 0}
						>
							清空
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="pt-0">
				{/* 战斗结果和颜色说明 */}
				{logs.length > 0 && (
					<div className="mb-4 p-3 bg-slate-50 rounded-lg">
						<div className="flex items-center justify-between text-sm">
							<div className="flex items-center space-x-4">
								<div className="flex items-center space-x-2">
									<div className="w-4 h-4 bg-slate-100 border-l-4 border-slate-300 rounded"></div>
									<span className="text-slate-600">{player1Name} 攻击</span>
								</div>
								<div className="flex items-center space-x-2">
									<div className="w-4 h-4 bg-slate-100 border-l-4 border-slate-300 rounded"></div>
									<span className="text-slate-600">{player2Name} 反击</span>
								</div>
								{battleResult === "stalemate" && (
									<div className="flex items-center space-x-2">
										<div className="w-4 h-4 bg-slate-100 border-l-4 border-slate-300 rounded"></div>
										<span className="text-slate-600">平局</span>
									</div>
								)}
							</div>
							{battleResult && (
								<div className="text-sm font-medium">
									{battleResult === "player1" && (
										<span className="text-slate-700">
											🏆 {player1Name} 获胜
										</span>
									)}
									{battleResult === "player2" && (
										<span className="text-slate-700">
											🏆 {player2Name} 获胜
										</span>
									)}
									{battleResult === "stalemate" && (
										<span className="text-slate-700">🤝 平局</span>
									)}
								</div>
							)}
						</div>
					</div>
				)}

				<div
					className={`bg-slate-50 rounded-lg p-4 ${isExpanded ? "max-h-96" : "max-h-48"} overflow-y-auto transition-all duration-300`}
				>
					{logs.length === 0 ? (
						<div className="text-center text-slate-500 py-8">
							{isActive ? "战斗进行中..." : "暂无战斗记录"}
						</div>
					) : (
						<div className="space-y-1">
							{logs.map((entry, index) => (
								<div
									key={`${entry.turn}-${entry.attacker}-${index}`}
									className={`text-sm font-mono p-2 rounded-md transition-colors duration-200 ${getLogBackgroundColor(entry)}`}
								>
									<span className="text-slate-400 mr-2">回合{entry.turn}:</span>
									<span className={getLogColor(entry)}>
										{formatAction(entry)}
									</span>
								</div>
							))}
							<div ref={logEndRef} />
						</div>
					)}
				</div>

				{logs.length > 0 && (
					<div className="mt-2 text-xs text-slate-500">
						共 {logs.length} 条记录
					</div>
				)}
			</CardContent>
		</Card>
	);
}
