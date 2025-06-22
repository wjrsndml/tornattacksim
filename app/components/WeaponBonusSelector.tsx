"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import type {
	SelectedWeaponBonus,
	WeaponBonus,
	WeaponData,
} from "../lib/fightSimulatorTypes";
import {
	getAvailableBonusesForWeapon,
	getWeaponBonus,
} from "../lib/weaponBonuses";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

interface WeaponBonusSelectorProps {
	weapon: WeaponData;
	onBonusesChange: (bonuses: SelectedWeaponBonus[]) => void;
	playerId: string;
	weaponType: string;
}

export default function WeaponBonusSelector({
	weapon,
	onBonusesChange,
	playerId,
	weaponType,
}: WeaponBonusSelectorProps) {
	const [selectedBonuses, setSelectedBonuses] = useState<SelectedWeaponBonus[]>(
		weapon.weaponBonuses || [],
	);
	const [availableBonuses, setAvailableBonuses] = useState<WeaponBonus[]>([]);

	// 当武器变化时，更新可用特效列表
	useEffect(() => {
		const bonuses = getAvailableBonusesForWeapon(weapon.category);
		setAvailableBonuses(bonuses);

		// 如果当前选择的特效不适用于新武器，清空选择
		const validBonuses = selectedBonuses.filter((selected) =>
			bonuses.some((bonus) => bonus.name === selected.name),
		);

		if (validBonuses.length !== selectedBonuses.length) {
			setSelectedBonuses(validBonuses);
			onBonusesChange(validBonuses);
		}
	}, [
		weapon.category,
		onBonusesChange,
		selectedBonuses.filter,
		selectedBonuses.length,
	]);

	// 更新选中的特效
	useEffect(() => {
		setSelectedBonuses(weapon.weaponBonuses || []);
	}, [weapon.weaponBonuses]);

	const handleAddBonus = () => {
		if (selectedBonuses.length >= 2) return; // 最多两个特效

		setSelectedBonuses([...selectedBonuses, { name: "", value: 0 }]);
	};

	const handleRemoveBonus = (index: number) => {
		const newBonuses = selectedBonuses.filter((_, i) => i !== index);
		setSelectedBonuses(newBonuses);
		onBonusesChange(newBonuses);
	};

	const handleBonusNameChange = (index: number, bonusName: string) => {
		const newBonuses = [...selectedBonuses];
		const bonusInfo = getWeaponBonus(bonusName);

		newBonuses[index] = {
			name: bonusName,
			value: bonusInfo ? bonusInfo.minValue : 0, // 默认为最小值
		};

		setSelectedBonuses(newBonuses);
		onBonusesChange(newBonuses);
	};

	const handleBonusValueChange = (index: number, value: number) => {
		const newBonuses = [...selectedBonuses];
		if (newBonuses[index]) {
			newBonuses[index].value = value;
		}
		setSelectedBonuses(newBonuses);
		onBonusesChange(newBonuses);
	};

	const getUsedBonusNames = () => {
		return selectedBonuses
			.map((bonus) => bonus.name)
			.filter((name) => name !== "");
	};

	const getAvailableOptions = (currentIndex: number) => {
		const usedNames = getUsedBonusNames();
		const currentName = selectedBonuses[currentIndex]?.name;

		return availableBonuses.filter(
			(bonus) => !usedNames.includes(bonus.name) || bonus.name === currentName,
		);
	};

	const getBonusTypeColor = (type: string) => {
		switch (type) {
			case "Buff":
				return "text-slate-700";
			case "Enemy Debuff":
				return "text-slate-600";
			case "DOT":
				return "text-slate-700";
			case "De-Buff":
				return "text-slate-600";
			case "Buff / De-Buff":
				return "text-slate-700";
			default:
				return "text-slate-600";
		}
	};

	if (availableBonuses.length === 0) {
		return (
			<div className="space-y-2">
				<Label>武器特效</Label>
				<p className="text-sm text-muted-foreground">此武器类别暂无可用特效</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label>武器特效</Label>
				{selectedBonuses.length < 2 && (
					<Button
						type="button"
						onClick={handleAddBonus}
						size="sm"
						variant="outline"
					>
						<Plus className="h-3 w-3 mr-1" />
						添加特效
					</Button>
				)}
			</div>

			<div className="space-y-2">
				{selectedBonuses.map((selectedBonus, index) => {
					const bonusInfo = getWeaponBonus(selectedBonus.name);
					const availableOptions = getAvailableOptions(index);

					return (
						<Card key={`bonus-${selectedBonus.name}-${index}`} className="p-3">
							<div className="flex items-center gap-2 mb-2">
								<Select
									value={selectedBonus.name}
									onValueChange={(value) => handleBonusNameChange(index, value)}
								>
									<SelectTrigger
										className="flex-1 h-8 text-sm"
										title={`选择第${index + 1}个武器特效`}
										aria-label={`选择第${index + 1}个武器特效`}
									>
										<SelectValue placeholder="选择特效..." />
									</SelectTrigger>
									<SelectContent>
										{availableOptions.map((bonus) => (
											<SelectItem key={bonus.name} value={bonus.name}>
												{bonus.name} ({bonus.type})
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<Button
									type="button"
									onClick={() => handleRemoveBonus(index)}
									size="sm"
									variant="ghost"
									title={`删除第${index + 1}个武器特效`}
									className="h-8 w-8 p-0"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>

							{bonusInfo && (
								<>
									<div className="mb-2">
										<p className="text-xs text-muted-foreground mb-1">
											<span className={getBonusTypeColor(bonusInfo.type)}>
												[{bonusInfo.type}]
											</span>{" "}
											{bonusInfo.description}
										</p>
									</div>

									<div className="flex items-center gap-2">
										<Label
											htmlFor={`bonus-value-${playerId}-${weaponType}-${index}`}
											className="text-xs"
										>
											数值:
										</Label>
										<Input
											id={`bonus-value-${playerId}-${weaponType}-${index}`}
											type="number"
											min={bonusInfo.minValue}
											max={bonusInfo.maxValue}
											value={selectedBonus.value}
											onChange={(e) =>
												handleBonusValueChange(
													index,
													parseInt(e.target.value) || bonusInfo.minValue,
												)
											}
											className="w-20 h-8"
											title={`设置${bonusInfo.name}特效数值`}
										/>
										<span className="text-xs text-muted-foreground">
											({bonusInfo.minValue} - {bonusInfo.maxValue}
											{bonusInfo.unit})
										</span>
									</div>
								</>
							)}
						</Card>
					);
				})}
			</div>

			{selectedBonuses.length === 0 && (
				<p className="text-xs text-muted-foreground italic">
					暂无选择的武器特效
				</p>
			)}
		</div>
	);
}
