"use client";

import { useEffect, useState } from "react";
import {
	getRawWeaponsData,
	getWeaponList,
	loadGameData,
} from "../lib/dataLoader";
import type {
	SelectedWeaponBonus,
	WeaponData,
} from "../lib/fightSimulatorTypes";
import {
	calculateWeaponQuality,
	findWeaponRangeData,
	getQualityTierText,
	type WeaponQuality,
} from "../lib/weaponQuality";
import ModSelector from "./ModSelector";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import WeaponBonusSelector from "./WeaponBonusSelector";

interface WeaponSelectorProps {
	weaponType: "primary" | "secondary" | "melee" | "temporary";
	selectedWeapon: WeaponData;
	onWeaponChange: (weapon: WeaponData) => void;
	label: string;
	playerId: string;
}

const QUALITY_BADGE_CLASSES: Record<string, string> = {
	white: "bg-gray-400/20 text-gray-400 border border-gray-400/40",
	yellow: "bg-yellow-500/20 text-yellow-600 border border-yellow-600/40",
	orange: "bg-orange-600/20 text-orange-600 border border-orange-600/40",
	red: "bg-red-600/20 text-red-600 border border-red-600/40",
	custom: "bg-gray-500/20 text-gray-500 border border-gray-500/40",
};

export default function WeaponSelector({
	weaponType,
	selectedWeapon,
	onWeaponChange,
	label,
	playerId,
}: WeaponSelectorProps) {
	const [weapons, setWeapons] = useState<
		Array<{ id: string; weapon: WeaponData }>
	>([]);
	const [loading, setLoading] = useState(true);
	const [weaponQuality, setWeaponQuality] = useState<WeaponQuality | null>(
		null,
	);

	useEffect(() => {
		async function loadWeapons() {
			try {
				await loadGameData();
				const weaponList = getWeaponList(weaponType);
				setWeapons(weaponList);
			} catch (error) {
				console.error("Failed to load weapons:", error);
			} finally {
				setLoading(false);
			}
		}

		loadWeapons();
	}, [weaponType]);

	// 计算武器品质
	useEffect(() => {
		if (!selectedWeapon || !selectedWeapon.name) {
			setWeaponQuality(null);
			return;
		}

		const rawWeaponsData = getRawWeaponsData();
		if (!rawWeaponsData) {
			setWeaponQuality(null);
			return;
		}

		const weaponRangeData = findWeaponRangeData(
			selectedWeapon.name,
			rawWeaponsData,
		);
		const quality = calculateWeaponQuality(
			selectedWeapon.name,
			selectedWeapon.damage || 0,
			selectedWeapon.accuracy || 0,
			weaponRangeData || undefined,
		);

		setWeaponQuality(quality);
	}, [selectedWeapon]);

	const handleWeaponSelect = (weaponId: string) => {
		const weaponData = weapons.find((w) => w.id === weaponId);
		if (!weaponData) return;

		// 保留现有的改装和武器特效（如果有的话）
		const updatedWeapon = {
			...weaponData.weapon,
			mods: selectedWeapon.mods || [],
			weaponBonuses: selectedWeapon.weaponBonuses || [],
		};
		onWeaponChange(updatedWeapon);
	};

	const handleModsChange = (mods: string[]) => {
		const updatedWeapon = {
			...selectedWeapon,
			mods,
		};
		onWeaponChange(updatedWeapon);
	};

	const handleWeaponBonusesChange = (bonuses: SelectedWeaponBonus[]) => {
		const updatedWeapon = {
			...selectedWeapon,
			weaponBonuses: bonuses,
		};
		onWeaponChange(updatedWeapon);
	};

	// 判断武器是否支持改装（主武器和副武器支持改装）
	const supportsModifications =
		weaponType === "primary" || weaponType === "secondary";

	if (loading) {
		return (
			<div className="space-y-2">
				<Label>{label}</Label>
				<div className="animate-pulse bg-slate-200 h-10 rounded-md"></div>
				{supportsModifications && (
					<div className="animate-pulse bg-slate-200 h-10 rounded-md"></div>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{/* 武器选择 */}
			<div className="space-y-2">
				<Label htmlFor={`${playerId}-${weaponType}-weapon`}>{label}</Label>
				<Select
					value={
						weapons.find((w) => w.weapon.name === selectedWeapon.name)?.id || ""
					}
					onValueChange={handleWeaponSelect}
				>
					<SelectTrigger
						id={`${playerId}-${weaponType}-weapon`}
						className="min-h-9 h-auto items-start [&>span]:line-clamp-none [&>span]:whitespace-normal"
					>
						<SelectValue>
							<div className="text-left w-full">
								<div className="font-medium flex items-center gap-2">
									{selectedWeapon.name}
									{weaponQuality && (
										<span
											className={`text-xs px-1.5 py-0.5 rounded font-medium ${QUALITY_BADGE_CLASSES[weaponQuality.tier]}`}
										>
											{getQualityTierText(weaponQuality.tier)}
										</span>
									)}
								</div>
								<div className="text-xs text-muted-foreground">
									{selectedWeapon.category} • 伤害: {selectedWeapon.damage} •
									精准: {selectedWeapon.accuracy}%
									{weaponQuality && weaponQuality.tier !== "custom" && (
										<span className="ml-2">
											• 品质: {weaponQuality.level.toFixed(1)}%
										</span>
									)}
									{selectedWeapon.bonus && (
										<span className="ml-2">• {selectedWeapon.bonus.name}</span>
									)}
								</div>
							</div>
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						{weapons.map((weaponData) => {
							const rawWeaponsData = getRawWeaponsData();
							const weaponRangeData = rawWeaponsData
								? findWeaponRangeData(weaponData.weapon.name, rawWeaponsData)
								: null;
							const quality = calculateWeaponQuality(
								weaponData.weapon.name,
								weaponData.weapon.damage || 0,
								weaponData.weapon.accuracy || 0,
								weaponRangeData || undefined,
							);

							return (
								<SelectItem key={weaponData.id} value={weaponData.id}>
									<div>
										<div className="font-medium flex items-center gap-2">
											{weaponData.weapon.name}
											{quality && (
												<span
													className={`text-xs px-1.5 py-0.5 rounded font-medium ${QUALITY_BADGE_CLASSES[quality.tier]}`}
												>
													{getQualityTierText(quality.tier)}
												</span>
											)}
										</div>
										<div className="text-xs text-muted-foreground">
											{weaponData.weapon.category} • 伤害:{" "}
											{weaponData.weapon.damage} • 精准:{" "}
											{weaponData.weapon.accuracy}%
											{quality && quality.tier !== "custom" && (
												<span className="ml-2">
													• 品质: {quality.level.toFixed(1)}%
												</span>
											)}
											{(weaponData.weapon.clipsize ?? 0) > 0 && (
												<span> • 弹夹: {weaponData.weapon.clipsize}</span>
											)}
											{weaponData.weapon.bonus && (
												<span className="ml-2">
													• {weaponData.weapon.bonus.name}
												</span>
											)}
										</div>
									</div>
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>
			</div>

			{/* 改装选择（仅主武器和副武器支持） */}
			{supportsModifications && (
				<ModSelector
					selectedMods={selectedWeapon.mods || []}
					onModsChange={handleModsChange}
					maxMods={2}
					label="武器改装"
				/>
			)}

			{/* 武器经验值 */}
			<div className="space-y-2">
				<Label htmlFor={`${playerId}-${weaponType}-experience`}>
					武器经验值
				</Label>
				<Input
					id={`${playerId}-${weaponType}-experience`}
					type="number"
					value={selectedWeapon.experience || 0}
					onChange={(e) => {
						const experience = parseInt(e.target.value) || 0;
						const updatedWeapon = { ...selectedWeapon, experience };
						onWeaponChange(updatedWeapon);
					}}
					min="0"
					max="100"
					placeholder="0-100"
					aria-label={`${label}经验值`}
				/>
				<div className="text-xs text-muted-foreground">
					经验值影响精准度和伤害加成
				</div>
			</div>

			{/* 武器属性调整（临时武器除外） */}
			{weaponType !== "temporary" && (
				<>
					<div className="space-y-2">
						<Label htmlFor={`${playerId}-${weaponType}-damage`}>武器伤害</Label>
						<Input
							id={`${playerId}-${weaponType}-damage`}
							type="number"
							value={selectedWeapon.damage || 0}
							onChange={(e) => {
								const damage = parseFloat(e.target.value) || 0;
								const updatedWeapon = { ...selectedWeapon, damage };
								onWeaponChange(updatedWeapon);
							}}
							min="0"
							max="1000"
							step="0.1"
							placeholder="伤害值"
							aria-label={`${label}伤害`}
						/>
						<div className="text-xs text-muted-foreground">
							武器的基础伤害值
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor={`${playerId}-${weaponType}-accuracy`}>
							武器精准
						</Label>
						<Input
							id={`${playerId}-${weaponType}-accuracy`}
							type="number"
							value={selectedWeapon.accuracy || 0}
							onChange={(e) => {
								const accuracy = parseFloat(e.target.value) || 0;
								const updatedWeapon = { ...selectedWeapon, accuracy };
								onWeaponChange(updatedWeapon);
							}}
							min="0"
							max="200"
							step="0.1"
							placeholder="精准值"
							aria-label={`${label}精准`}
						/>
						<div className="text-xs text-muted-foreground">
							武器的基础精准值
						</div>
					</div>
				</>
			)}

			{/* 弹药类型（仅主武器和副武器支持） */}
			{supportsModifications && (
				<div className="space-y-2">
					<Label htmlFor={`${playerId}-${weaponType}-ammo`}>弹药类型</Label>
					<Select
						value={selectedWeapon.ammo || "Standard"}
						onValueChange={(ammo) => {
							const updatedWeapon = { ...selectedWeapon, ammo };
							onWeaponChange(updatedWeapon);
						}}
					>
						<SelectTrigger id={`${playerId}-${weaponType}-ammo`}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="Standard">标准弹药</SelectItem>
							<SelectItem value="TR">追踪弹 (TR) - 精准+10</SelectItem>
							<SelectItem value="PI">穿甲弹 (PI) - 穿甲+50%</SelectItem>
							<SelectItem value="HP">
								空心弹 (HP) - 伤害+50%, 穿甲/1.5
							</SelectItem>
							<SelectItem value="IN">燃烧弹 (IN) - 伤害+40%</SelectItem>
						</SelectContent>
					</Select>
				</div>
			)}

			{/* 武器特效选择 */}
			<WeaponBonusSelector
				weapon={selectedWeapon}
				onBonusesChange={handleWeaponBonusesChange}
				playerId={playerId}
				weaponType={weaponType}
			/>
		</div>
	);
}
