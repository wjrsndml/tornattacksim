"use client";

import { Lightbulb } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

interface LifeHistogramProps {
	lifeData: number[]; // 每次战斗结束时的生命值
	playerName: string;
	totalFights: number;
}

export default function LifeHistogram({
	lifeData,
	playerName,
	totalFights,
}: LifeHistogramProps) {
	const [isVisible, setIsVisible] = useState(false);
	const [binSize, setBinSize] = useState(50);

	const histogram = useMemo(() => {
		if (lifeData.length === 0) return [];

		// 检查生命值数据的有效性
		const validLifeData = lifeData.filter(
			(life) =>
				typeof life === "number" &&
				!Number.isNaN(life) &&
				Number.isFinite(life),
		);

		if (validLifeData.length === 0) return [];

		// 分离死亡(0)和存活(>0)玩家
		const deadPlayers = validLifeData.filter((life) => life === 0);
		const alivePlayers = validLifeData.filter((life) => life > 0);

		const bins = [];

		// 第一个区间：死亡玩家 (生命值 = 0)
		if (deadPlayers.length > 0) {
			bins.push({
				min: 0,
				max: 0,
				count: deadPlayers.length,
				percentage: (deadPlayers.length / totalFights) * 100,
				label: "死亡 (0)",
			});
		}

		// 如果没有存活玩家，只返回死亡数据
		if (alivePlayers.length === 0) {
			return bins;
		}

		// 对存活玩家创建常规区间
		const maxLife = Math.max(...alivePlayers);
		const minLife = Math.min(...alivePlayers);

		// 确保 binSize 是有效的正数
		const safeBinSize = Math.max(1, binSize);

		// 从1开始创建区间（不包括0）
		const startValue = Math.max(
			1,
			Math.floor(minLife / safeBinSize) * safeBinSize,
		);
		const endValue = Math.ceil(maxLife / safeBinSize) * safeBinSize;

		// 创建存活玩家的区间
		for (let value = startValue; value < endValue; value += safeBinSize) {
			const binMin = value;
			const binMax = value + safeBinSize;

			const count = alivePlayers.filter(
				(life) => life >= binMin && life < binMax,
			).length;

			if (count > 0 || value === startValue) {
				// 总是显示第一个非零区间
				bins.push({
					min: binMin,
					max: binMax,
					count: count,
					percentage: (count / totalFights) * 100,
					label: `${binMin}-${binMax}`,
				});
			}
		}

		return bins;
	}, [lifeData, binSize, totalFights]);

	const maxCount =
		histogram.length > 0 ? Math.max(...histogram.map((bin) => bin.count)) : 0;

	const downloadCSV = () => {
		const csvContent = [
			"Life Range,Count,Percentage",
			...histogram.map(
				(bin) =>
					`"${bin.label || `${bin.min}-${bin.max}`}",${bin.count},${bin.percentage.toFixed(2)}%`,
			),
		].join("\n");

		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${playerName}_life_distribution.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	if (!isVisible) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold">生命值分布</h3>
					<Button
						type="button"
						onClick={() => setIsVisible(true)}
						disabled={lifeData.length === 0}
						size="sm"
						variant="outline"
						className="border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors duration-200"
					>
						显示分布图
					</Button>
				</div>
				<div className="text-sm text-slate-600">
					数据点: {lifeData.length.toLocaleString()} /{" "}
					{totalFights.toLocaleString()} 场战斗
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-sm">
				<div className="flex items-center space-x-2">
					<Lightbulb className="w-5 h-5 text-slate-500" />
					<div>
						<div className="font-medium text-slate-700">生命值分布说明</div>
						<div className="text-slate-600 text-xs mt-1">
							此图显示该玩家在所有战斗结束时剩余生命值的分布情况。
						</div>
					</div>
				</div>
			</div>
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
				<h3 className="text-lg font-semibold">{playerName} 生命值分布</h3>
				<div className="flex items-center space-x-2">
					<Label className="text-sm whitespace-nowrap">
						区间大小:
						<select
							value={binSize}
							onChange={(e) => setBinSize(parseInt(e.target.value))}
							className="ml-2 px-2 py-1 border border-slate-300 rounded text-slate-700 bg-white focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
						>
							<option value={25}>25</option>
							<option value={50}>50</option>
							<option value={100}>100</option>
							<option value={200}>200</option>
						</select>
					</Label>
					<Button
						type="button"
						onClick={downloadCSV}
						variant="outline"
						size="sm"
						disabled={histogram.length === 0}
						className="transition-colors duration-200"
					>
						下载 CSV
					</Button>
					<Button
						type="button"
						onClick={() => setIsVisible(false)}
						variant="outline"
						size="sm"
						className="transition-colors duration-200"
					>
						隐藏
					</Button>
				</div>
			</div>

			{histogram.length === 0 ? (
				<div className="text-center text-slate-500 py-8">暂无数据</div>
			) : (
				<div className="space-y-4">
					{/* 统计信息 */}
					<div className="grid grid-cols-4 gap-4 text-sm">
						<div className="bg-slate-50 p-3 rounded">
							<div className="font-semibold text-slate-700">总战斗数</div>
							<div className="text-slate-600">
								{totalFights.toLocaleString()}
							</div>
						</div>
						<div className="bg-slate-50 p-3 rounded">
							<div className="font-semibold text-slate-700">平均生命值</div>
							<div className="text-slate-600">
								{(
									lifeData.reduce((a, b) => a + b, 0) / lifeData.length
								).toFixed(1)}
							</div>
						</div>
						<div className="bg-slate-50 p-3 rounded">
							<div className="font-semibold text-slate-700">最低生命值</div>
							<div className="text-slate-600">{Math.min(...lifeData)}</div>
						</div>
						<div className="bg-slate-50 p-3 rounded">
							<div className="font-semibold text-slate-700">最高生命值</div>
							<div className="text-slate-600">{Math.max(...lifeData)}</div>
						</div>
					</div>

					{/* 直方图 */}
					<div className="bg-white border rounded-lg p-4">
						<div className="space-y-2">
							{histogram.map((bin) => (
								<div
									key={`${bin.min}-${bin.max}`}
									className="flex items-center space-x-2"
								>
									<div className="w-20 text-xs text-slate-600 text-right">
										{bin.label || `${bin.min}-${bin.max}`}
									</div>
									<div className="flex-1 bg-slate-200 rounded-full h-6 relative">
										<div
											className={`h-full rounded-full transition-all duration-500 ${
												bin.min === 0 && bin.max === 0
													? "bg-slate-500" // 死亡玩家用深一点的灰色
													: "bg-slate-600" // 存活玩家用更深的灰色
											}`}
											style={{ width: `${(bin.count / maxCount) * 100}%` }}
										/>
										<div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
											{bin.count > 0 && (
												<span>
													{bin.count} ({bin.percentage.toFixed(1)}%)
												</span>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
