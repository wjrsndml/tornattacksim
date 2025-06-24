"use client";

import { useEffect, useState } from "react";
import { getArmourList, loadGameData } from "../lib/dataLoader";
import type { ArmourData } from "../lib/fightSimulatorTypes";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

interface ArmourSelectorProps {
	armourType: "head" | "body" | "hands" | "legs" | "feet";
	selectedArmour: ArmourData;
	onArmourChange: (armour: ArmourData) => void;
	label: string;
	playerId: string;
}

export default function ArmourSelector({
	armourType,
	selectedArmour,
	onArmourChange,
	label,
	playerId,
}: ArmourSelectorProps) {
	const [armours, setArmours] = useState<
		Array<{ id: string; armour: ArmourData }>
	>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadArmours() {
			try {
				await loadGameData();
				const armourList = getArmourList(armourType);
				setArmours(armourList);
			} catch (error) {
				console.error("Failed to load armours:", error);
			} finally {
				setLoading(false);
			}
		}

		loadArmours();
	}, [armourType]);

	const handleArmourSelect = (armourId: string) => {
		const armourData = armours.find((a) => a.id === armourId);
		if (!armourData) return;

		onArmourChange(armourData.armour);
	};

	const getArmourRating = (armour: number) => {
		if (armour >= 50) return { text: "极佳", color: "text-slate-800" };
		if (armour >= 30) return { text: "优秀", color: "text-slate-700" };
		if (armour >= 20) return { text: "良好", color: "text-slate-700" };
		if (armour >= 10) return { text: "一般", color: "text-slate-600" };
		return { text: "较差", color: "text-slate-500" };
	};

	const getDisplayName = (armour: ArmourData) => {
		return armour.type || "无护甲";
	};

	if (loading) {
		return (
			<div className="space-y-2">
				<Label>{label}</Label>
				<div className="animate-pulse bg-slate-200 h-10 rounded-md"></div>
			</div>
		);
	}

	const rating = getArmourRating(selectedArmour.armour);

	return (
		<div className="space-y-2">
			<Label htmlFor={`${playerId}-${armourType}-armour`}>{label}</Label>
			<Select
				value={
					armours.find((a) => a.armour.type === selectedArmour.type)?.id || ""
				}
				onValueChange={handleArmourSelect}
			>
				<SelectTrigger
					id={`${playerId}-${armourType}-armour`}
					className="min-h-9 h-auto items-start [&>span]:line-clamp-none [&>span]:whitespace-normal"
				>
					<SelectValue>
						<div className="text-left w-full">
							<div className="font-medium">
								{getDisplayName(selectedArmour)}
							</div>
							<div className="text-xs text-muted-foreground">
								护甲值: {selectedArmour.armour} •
								<span className={`ml-1 ${rating.color}`}>{rating.text}</span>
							</div>
						</div>
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					{armours.length === 0 ? (
						<div className="px-3 py-2 text-muted-foreground text-sm">
							无可用护甲
						</div>
					) : (
						armours.map((armourData) => {
							const itemRating = getArmourRating(armourData.armour.armour);
							return (
								<SelectItem key={armourData.id} value={armourData.id}>
									<div>
										<div className="font-medium">
											{getDisplayName(armourData.armour)}
										</div>
										<div className="text-xs text-muted-foreground">
											护甲值: {armourData.armour.armour} •
											<span className={`ml-1 ${itemRating.color}`}>
												{itemRating.text}
											</span>
										</div>
									</div>
								</SelectItem>
							);
						})
					)}
				</SelectContent>
			</Select>

			{/* 护甲值调整 */}
			<div className="space-y-2">
				<Label htmlFor={`${playerId}-${armourType}-value`}>护甲值</Label>
				<Input
					id={`${playerId}-${armourType}-value`}
					type="number"
					value={selectedArmour.armour || 0}
					onChange={(e) => {
						const armour = parseFloat(e.target.value) || 0;
						const updatedArmour = { ...selectedArmour, armour };
						onArmourChange(updatedArmour);
					}}
					min="0"
					max="100"
					step="0.1"
					placeholder="护甲值"
					aria-label={`${label}护甲值`}
				/>
				<div className="text-xs text-muted-foreground">
					护甲的防护值，影响伤害减免
				</div>
			</div>
		</div>
	);
}
