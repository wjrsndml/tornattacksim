"use client";

import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

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
}

interface SimulationResultsProps {
	results: SimulationResult;
	player1Name?: string; // Attacker名称
	player2Name?: string; // Defender名称
}

export default function SimulationResults({
	results,
	player1Name = "Attacker",
	player2Name = "Defender",
}: SimulationResultsProps) {
	const {
		totalSimulations,
		heroWins,
		villainWins,
		stalemates,
		heroWinRate,
		villainWinRate,
		stalemateRate,
		averageTurns,
		averageHeroLifeRemaining,
		averageVillainLifeRemaining,
		lastFightLog,
	} = results;

	// 确定战斗结果
	const getBattleResult = (): "player1" | "player2" | "stalemate" => {
		if (heroWinRate > villainWinRate) {
			return "player1";
		} else if (villainWinRate > heroWinRate) {
			return "player2";
		} else {
			return "stalemate";
		}
	};

	// 解析日志信息并返回颜色样式
	const getLogLineStyle = (message: string) => {
		const battleResult = getBattleResult();

		// 检查是否是胜利/平局消息
		if (message.includes("won") || message.includes("Stalemate")) {
			if (message.includes(`${player1Name} won`)) {
				return "bg-slate-50 border-l-4 border-slate-300 text-slate-700 font-medium";
			} else if (message.includes(`${player2Name} won`)) {
				return "bg-slate-50 border-l-4 border-slate-300 text-slate-700 font-medium";
			} else if (message.includes("Stalemate")) {
				return "bg-slate-50 border-l-4 border-slate-300 text-slate-700 font-medium";
			}
		}

		// 更精确地判断是谁的行动：检查消息开头
		const isPlayer1Action = message.startsWith(`${player1Name} `);
		const isPlayer2Action = message.startsWith(`${player2Name} `);

		// 基础背景色：使用更柔和的颜色
		let baseStyle =
			"p-3 rounded-md text-sm transition-colors duration-200 text-slate-600";
		if (isPlayer1Action) {
			baseStyle += " bg-slate-50/50 border-l-4 border-slate-200";
		} else if (isPlayer2Action) {
			baseStyle += " bg-slate-50/50 border-l-4 border-slate-200";
		}

		// 根据战斗结果调整颜色强度
		if (battleResult === "player1") {
			// Player1赢了
			if (isPlayer1Action) {
				baseStyle = baseStyle.replace(
					"bg-slate-50/50 border-slate-200",
					"bg-slate-100 border-slate-300",
				);
			} else if (isPlayer2Action) {
				baseStyle = baseStyle.replace(
					"bg-slate-50/50 border-slate-200",
					"bg-slate-50 border-slate-200",
				);
			}
		} else if (battleResult === "player2") {
			// Player2赢了
			if (isPlayer1Action) {
				baseStyle = baseStyle.replace(
					"bg-slate-50/50 border-slate-200",
					"bg-slate-50 border-slate-200",
				);
			} else if (isPlayer2Action) {
				baseStyle = baseStyle.replace(
					"bg-slate-50/50 border-slate-200",
					"bg-slate-100 border-slate-300",
				);
			}
		} else if (battleResult === "stalemate") {
			// 平局
			if (isPlayer1Action || isPlayer2Action) {
				baseStyle = baseStyle.replace(
					"bg-slate-50/50 border-slate-200",
					"bg-slate-100 border-slate-300",
				);
			}
		}

		return baseStyle;
	};

	return (
		<div className="space-y-6">
			{/* 总体统计 */}
			<div className="space-y-4">
				<h3 className="text-lg font-semibold">总体统计</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="text-center space-y-1">
						<div className="text-2xl font-bold text-slate-700">
							{heroWins.toLocaleString()}
						</div>
						<div className="text-xs text-slate-600">玩家1胜利</div>
						<Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 text-xs min-w-[50px] text-center">
							{heroWinRate.toFixed(1)}%
						</Badge>
					</div>
					<div className="text-center space-y-1">
						<div className="text-2xl font-bold text-slate-700">
							{villainWins.toLocaleString()}
						</div>
						<div className="text-xs text-slate-600">玩家2胜利</div>
						<Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 text-xs min-w-[50px] text-center">
							{villainWinRate.toFixed(1)}%
						</Badge>
					</div>
					<div className="text-center space-y-1">
						<div className="text-2xl font-bold text-slate-600">
							{stalemates.toLocaleString()}
						</div>
						<div className="text-xs text-slate-600">平局</div>
						<Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs min-w-[50px] text-center">
							{stalemateRate.toFixed(1)}%
						</Badge>
					</div>
					<div className="text-center space-y-1">
						<div className="text-2xl font-bold text-slate-700">
							{averageTurns.toFixed(1)}
						</div>
						<div className="text-xs text-slate-600">平均回合数</div>
					</div>
				</div>
			</div>

			{/* 胜率图表 */}
			<div className="space-y-4">
				<h3 className="text-lg font-semibold">胜率分布</h3>
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<div className="w-16 text-sm font-medium">玩家1</div>
							<Progress
								value={heroWinRate}
								className="flex-1 h-2 rounded-full"
							/>
						</div>
						<div className="flex items-center space-x-2">
							<Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs">
								{heroWinRate.toFixed(1)}%
							</Badge>
							<span className="text-xs text-slate-600 w-16 text-right">
								{heroWins.toLocaleString()}
							</span>
						</div>
					</div>

					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<div className="w-16 text-sm font-medium">玩家2</div>
							<Progress
								value={villainWinRate}
								className="flex-1 h-2 rounded-full"
							/>
						</div>
						<div className="flex items-center space-x-2">
							<Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs">
								{villainWinRate.toFixed(1)}%
							</Badge>
							<span className="text-xs text-slate-600 w-16 text-right">
								{villainWins.toLocaleString()}
							</span>
						</div>
					</div>

					{stalemates > 0 && (
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<div className="w-16 text-sm font-medium">平局</div>
								<Progress
									value={stalemateRate}
									className="flex-1 h-2 rounded-full"
								/>
							</div>
							<div className="flex items-center space-x-2">
								<Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs">
									{stalemateRate.toFixed(1)}%
								</Badge>
								<span className="text-xs text-slate-600 w-16 text-right">
									{stalemates.toLocaleString()}
								</span>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* 详细统计 */}
			<div className="space-y-4">
				<h3 className="text-lg font-semibold">详细统计</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-3">
						<div>
							<div className="text-xs text-slate-600">总模拟次数</div>
							<div className="text-xl font-semibold">
								{totalSimulations.toLocaleString()}
							</div>
						</div>
						<div>
							<div className="text-xs text-slate-600">平均回合数</div>
							<div className="text-xl font-semibold">
								{averageTurns.toFixed(1)}
							</div>
						</div>
					</div>
					<div className="space-y-3">
						<div>
							<div className="text-xs text-slate-600">玩家1平均剩余生命</div>
							<div className="text-xl font-semibold text-slate-700">
								{averageHeroLifeRemaining.toFixed(0)}
							</div>
						</div>
						<div>
							<div className="text-xs text-slate-600">玩家2平均剩余生命</div>
							<div className="text-xl font-semibold text-slate-700">
								{averageVillainLifeRemaining.toFixed(0)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* 最后一场战斗日志 */}
			{lastFightLog && lastFightLog.length > 0 && (
				<div className="space-y-4">
					<h3 className="text-lg font-semibold">最后一场战斗日志</h3>
					<div className="space-y-1 max-h-80 overflow-y-auto">
						{lastFightLog.map((message, index) => (
							<div
								key={`${message.slice(0, 20)}-${index}`}
								className={getLogLineStyle(message)}
							>
								{message}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
