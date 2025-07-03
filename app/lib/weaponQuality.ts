// 武器品质计算工具

export interface WeaponQuality {
	level: number;
	tier: "custom" | "white" | "yellow" | "orange" | "red";
	color: string;
	normalizedDamage: number;
	normalizedAccuracy: number;
}

export interface WeaponRange {
	damage_range: [number, number];
	accuracy_range: [number, number];
}

export interface WeaponEntry {
	name: string;
	damage_range: [number, number];
	accuracy_range: [number, number];
}

export type WeaponsData = Record<
	"primary" | "secondary" | "melee" | "temporary",
	Record<string, WeaponEntry>
>;

/**
 * 计算武器品质
 * @param weaponName 武器名称
 * @param currentDamage 当前伤害值
 * @param currentAccuracy 当前精准值
 * @param weaponData 武器数据（包含区间信息）
 * @returns 武器品质信息
 */
export function calculateWeaponQuality(
	_weaponName: string,
	currentDamage: number,
	currentAccuracy: number,
	weaponData?: WeaponRange,
): WeaponQuality {
	// 如果没有武器数据或者是自定义武器，返回自定义品质
	if (!weaponData || !weaponData.damage_range || !weaponData.accuracy_range) {
		return {
			level: -1,
			tier: "custom",
			color: "#6B7280", // 灰色
			normalizedDamage: 0,
			normalizedAccuracy: 0,
		};
	}

	const [damageMin, damageMax] = weaponData.damage_range;
	const [accuracyMin, accuracyMax] = weaponData.accuracy_range;

	// 计算归一化值
	const normalizedDamage =
		damageMax > damageMin
			? (currentDamage - damageMin) / (damageMax - damageMin)
			: 0;

	const normalizedAccuracy =
		accuracyMax > accuracyMin
			? (currentAccuracy - accuracyMin) / (accuracyMax - accuracyMin)
			: 0;

	// 计算品质等级 (0.5 * (归一化攻击 + 归一化精准度) * 100%)
	const qualityLevel = 0.5 * (normalizedDamage + normalizedAccuracy) * 100;

	// 确定品质档次和颜色
	let tier: WeaponQuality["tier"];
	let color: string;

	if (qualityLevel < 0 || qualityLevel >= 310) {
		tier = "custom";
		color = "#6B7280"; // 灰色
	} else if (qualityLevel >= 0 && qualityLevel < 100) {
		tier = "white";
		color = "#9CA3AF"; // 白色（浅灰）
	} else if (qualityLevel >= 100 && qualityLevel < 150) {
		tier = "yellow";
		color = "#F59E0B"; // 黄色
	} else if (qualityLevel >= 150 && qualityLevel < 200) {
		tier = "orange";
		color = "#EA580C"; // 橙色
	} else if (qualityLevel >= 200 && qualityLevel < 310) {
		tier = "red";
		color = "#DC2626"; // 红色
	} else {
		tier = "custom";
		color = "#6B7280"; // 灰色
	}

	return {
		level: qualityLevel,
		tier,
		color,
		normalizedDamage,
		normalizedAccuracy,
	};
}

/**
 * 获取品质等级的显示文本
 */
export function getQualityTierText(tier: WeaponQuality["tier"]): string {
	switch (tier) {
		case "white":
			return "白色品质";
		case "yellow":
			return "黄色品质";
		case "orange":
			return "橙色品质";
		case "red":
			return "红色品质";
		case "custom":
			return "自定义";
		default:
			return "未知";
	}
}

/**
 * 从武器JSON数据中查找武器区间信息
 */
export function findWeaponRangeData(
	weaponName: string,
	weaponsData: WeaponsData,
): WeaponRange | null {
	// 遍历所有武器类型
	for (const category of [
		"primary",
		"secondary",
		"melee",
		"temporary",
	] as (keyof WeaponsData)[]) {
		const categoryData = weaponsData[category];
		if (!categoryData) continue;

		// 遍历该类别下的所有武器
		for (const weaponId in categoryData) {
			const weapon = categoryData[weaponId];
			if (weapon && weapon.name === weaponName) {
				return {
					damage_range: weapon.damage_range,
					accuracy_range: weapon.accuracy_range,
				};
			}
		}
	}

	return null;
}
