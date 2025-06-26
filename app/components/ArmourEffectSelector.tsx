"use client";

import { useState } from "react";
import type { ArmourEffect } from "../lib/fightSimulatorTypes";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

interface ArmourEffectSelectorProps {
	selectedEffect?: ArmourEffect | undefined;
	onEffectChange: (effect?: ArmourEffect | undefined) => void;
	playerId: string;
	armourType: string;
}

// 可用的护甲特效列表
const availableArmourEffects = [
	{
		name: "Impenetrable",
		description: "减少来自主武器或副武器的伤害",
		defaultValue: 20,
		minValue: 5,
		maxValue: 50,
	},
	{
		name: "Impregnable",
		description: "减少来自近战武器的伤害",
		defaultValue: 20,
		minValue: 5,
		maxValue: 50,
	},
	{
		name: "Insurmountable",
		description: "在血量≤25%时减少受到的伤害",
		defaultValue: 30,
		minValue: 10,
		maxValue: 60,
	},
	{
		name: "Impassable",
		description: "有概率完全免疫伤害",
		defaultValue: 15,
		minValue: 5,
		maxValue: 30,
	},
];

export default function ArmourEffectSelector({
	selectedEffect,
	onEffectChange,
	playerId,
	armourType,
}: ArmourEffectSelectorProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	const handleEffectSelect = (effectName: string) => {
		if (effectName === "none") {
			onEffectChange(undefined);
			return;
		}

		const effectConfig = availableArmourEffects.find(
			(e) => e.name === effectName,
		);
		if (effectConfig) {
			onEffectChange({
				name: effectConfig.name,
				value: effectConfig.defaultValue,
			});
		}
	};

	const handleValueChange = (value: number) => {
		if (selectedEffect) {
			onEffectChange({
				...selectedEffect,
				value,
			});
		}
	};

	const handleRemoveEffect = () => {
		onEffectChange(undefined);
	};

	const getEffectColor = (effectName: string) => {
		const colors = {
			Impenetrable: "bg-blue-100 text-blue-800 border-blue-200",
			Impregnable: "bg-green-100 text-green-800 border-green-200",
			Insurmountable: "bg-purple-100 text-purple-800 border-purple-200",
			Impassable: "bg-orange-100 text-orange-800 border-orange-200",
		};
		return (
			colors[effectName as keyof typeof colors] || "bg-gray-100 text-gray-800"
		);
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<Label>护甲特效</Label>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setIsExpanded(!isExpanded)}
				>
					{isExpanded ? "收起" : "展开"}
				</Button>
			</div>

			{isExpanded && (
				<div className="space-y-3 border rounded-lg p-3 bg-slate-50">
					{/* 特效选择 */}
					<div className="space-y-2">
						<Label htmlFor={`${playerId}-${armourType}-effect`}>选择特效</Label>
						<Select
							value={selectedEffect?.name || "none"}
							onValueChange={handleEffectSelect}
						>
							<SelectTrigger id={`${playerId}-${armourType}-effect`}>
								<SelectValue>
									{selectedEffect ? (
										<div className="flex items-center gap-2">
											<Badge
												variant="outline"
												className={`text-xs ${getEffectColor(selectedEffect.name)}`}
											>
												{selectedEffect.name}
											</Badge>
											<span className="text-sm">{selectedEffect.value}%</span>
										</div>
									) : (
										"无特效"
									)}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">无特效</SelectItem>
								{availableArmourEffects.map((effect) => (
									<SelectItem key={effect.name} value={effect.name}>
										<div>
											<div className="font-medium">{effect.name}</div>
											<div className="text-xs text-muted-foreground">
												{effect.description}
											</div>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* 特效数值调整 */}
					{selectedEffect && (
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor={`${playerId}-${armourType}-effect-value`}>
									特效数值 (%)
								</Label>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={handleRemoveEffect}
									className="text-red-600 hover:text-red-700 h-auto p-1"
								>
									移除
								</Button>
							</div>
							<Input
								id={`${playerId}-${armourType}-effect-value`}
								type="number"
								value={selectedEffect.value}
								onChange={(e) => {
									const value = parseInt(e.target.value) || 0;
									handleValueChange(value);
								}}
								min={
									availableArmourEffects.find(
										(e) => e.name === selectedEffect.name,
									)?.minValue || 1
								}
								max={
									availableArmourEffects.find(
										(e) => e.name === selectedEffect.name,
									)?.maxValue || 100
								}
								step="1"
								placeholder="特效数值"
							/>
							<div className="text-xs text-muted-foreground">
								{
									availableArmourEffects.find(
										(e) => e.name === selectedEffect.name,
									)?.description
								}
							</div>
						</div>
					)}

					{/* 当前特效显示 */}
					{selectedEffect && (
						<div className="pt-2 border-t">
							<div className="text-sm font-medium mb-1">当前特效:</div>
							<Badge
								variant="outline"
								className={`text-xs ${getEffectColor(selectedEffect.name)}`}
							>
								{selectedEffect.name} ({selectedEffect.value}%)
							</Badge>
						</div>
					)}
				</div>
			)}

			{/* 简化显示（收起状态） */}
			{!isExpanded && selectedEffect && (
				<div className="flex items-center gap-2">
					<Badge
						variant="outline"
						className={`text-xs ${getEffectColor(selectedEffect.name)}`}
					>
						{selectedEffect.name}
					</Badge>
					<span className="text-sm text-muted-foreground">
						{selectedEffect.value}%
					</span>
				</div>
			)}
		</div>
	);
}
