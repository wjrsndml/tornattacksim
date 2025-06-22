"use client";

import { ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getModData, getModList, loadGameData } from "../lib/dataLoader";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Label } from "./ui/label";

interface ModSelectorProps {
	selectedMods: string[];
	onModsChange: (mods: string[]) => void;
	maxMods?: number;
	label: string;
}

export default function ModSelector({
	selectedMods,
	onModsChange,
	maxMods = 3,
	label,
}: ModSelectorProps) {
	const [availableMods, setAvailableMods] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [isOpen, setIsOpen] = useState(false);

	// 确保selectedMods始终是数组
	const safeSelectedMods = Array.isArray(selectedMods) ? selectedMods : [];

	useEffect(() => {
		async function loadMods() {
			try {
				await loadGameData();
				const modList = getModList();
				setAvailableMods(modList);
			} catch (error) {
				console.error("Failed to load mods:", error);
			} finally {
				setLoading(false);
			}
		}

		loadMods();
	}, []);

	const handleModToggle = (modName: string) => {
		const currentMods = [...safeSelectedMods];
		const modIndex = currentMods.indexOf(modName);

		if (modIndex >= 0) {
			// 移除改装
			currentMods.splice(modIndex, 1);
		} else if (currentMods.length < maxMods) {
			// 添加改装
			currentMods.push(modName);
		}

		onModsChange(currentMods);
	};

	const getModDescription = (modName: string): string => {
		const modData = getModData(modName);
		if (!modData) return "";

		const effects: string[] = [];
		if (modData.acc_bonus !== 0)
			effects.push(
				`精准${modData.acc_bonus > 0 ? "+" : ""}${modData.acc_bonus}`,
			);
		if (modData.dmg_bonus !== 0)
			effects.push(
				`伤害${modData.dmg_bonus > 0 ? "+" : ""}${modData.dmg_bonus}`,
			);
		if (modData.crit_chance !== 0)
			effects.push(
				`暴击${modData.crit_chance > 0 ? "+" : ""}${modData.crit_chance}%`,
			);
		if (modData.clip_size_multi !== 0)
			effects.push(
				`弹夹${modData.clip_size_multi > 0 ? "+" : ""}${(modData.clip_size_multi * 100).toFixed(0)}%`,
			);
		if (modData.extra_clips !== 0)
			effects.push(
				`额外弹夹${modData.extra_clips > 0 ? "+" : ""}${modData.extra_clips}`,
			);
		if (modData.rate_of_fire_multi !== 0)
			effects.push(
				`射速${modData.rate_of_fire_multi > 0 ? "+" : ""}${(modData.rate_of_fire_multi * 100).toFixed(0)}%`,
			);
		if (modData.dex_passive !== 0)
			effects.push(
				`敏捷${modData.dex_passive > 0 ? "+" : ""}${modData.dex_passive}`,
			);

		return effects.join(" • ");
	};

	if (loading) {
		return (
			<div className="space-y-2">
				<Label>{label}</Label>
				<div className="animate-pulse bg-slate-200 h-10 rounded-md"></div>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<Label>
				{label} ({safeSelectedMods.length}/{maxMods})
			</Label>

			{/* 已选择的改装 */}
			{safeSelectedMods.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{safeSelectedMods.map((modName) => (
						<Badge key={modName} variant="secondary" className="px-3 py-1.5">
							<div className="flex items-center gap-2">
								<div>
									<div className="font-medium">{modName}</div>
									<div className="text-xs opacity-80">
										{getModDescription(modName)}
									</div>
								</div>
								<button
									type="button"
									onClick={() => handleModToggle(modName)}
									className="ml-1 hover:opacity-70"
									title="移除改装"
								>
									<X className="h-3 w-3" />
								</button>
							</div>
						</Badge>
					))}
				</div>
			)}

			<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						className="w-full justify-between"
						disabled={safeSelectedMods.length >= maxMods}
					>
						<span>
							{safeSelectedMods.length >= maxMods
								? "已达到最大改装数"
								: "选择改装..."}
						</span>
						<ChevronDown className="ml-2 h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-full">
					{availableMods.map((modName) => {
						const isSelected = safeSelectedMods.includes(modName);
						const canSelect = !isSelected && safeSelectedMods.length < maxMods;

						return (
							<DropdownMenuItem
								key={modName}
								onSelect={(e) => {
									e.preventDefault();
									if (isSelected || canSelect) {
										handleModToggle(modName);
									}
								}}
								disabled={!isSelected && !canSelect}
								className={`cursor-pointer ${isSelected ? "bg-secondary" : ""}`}
							>
								<div className="w-full">
									<div className="font-medium">{modName}</div>
									<div className="text-xs text-muted-foreground">
										{getModDescription(modName)}
									</div>
								</div>
							</DropdownMenuItem>
						);
					})}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
