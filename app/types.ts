export interface BattleStats {
	strength: number;
	speed: number;
	defense: number;
	dexterity: number;
}

export interface Weapon {
	id: string;
	damage: number;
	accuracy: number;
	experience: number;
	category?: string;
	mods?: {
		one: string;
		two: string;
	};
	ammo?: string;
}

export interface Armour {
	id: string;
	armour: number;
}

export interface WeaponSettings {
	setting: number;
	reload: boolean | null;
}

export interface EducationPerks {
	damage: boolean;
	neckdamage: boolean;
	meleedamage: boolean;
	tempdamage: boolean;
	needleeffect: boolean;
	japanesedamage: boolean;
	fistdamage: boolean;
	critchance: boolean;
	machinegunaccuracy: boolean;
	smgaccuracy: boolean;
	pistolaccuracy: boolean;
	rifleaccuracy: boolean;
	heavyartilleryaccuracy: boolean;
	temporaryaccuracy: boolean;
	shotgunaccuracy: boolean;
	ammocontrol1: boolean;
	ammocontrol2: boolean;
	preferKick: boolean; // 新增：是否优先使用脚踢而不是拳头
}

export interface FactionPerks {
	accuracy: number;
	damage: number;
}

export interface CompanyPerks {
	name: string;
	star: number;
}

export interface PropertyPerks {
	damage: boolean;
}

export interface MeritPerks {
	critrate: number;
	primarymastery: number;
	secondarymastery: number;
	meleemastery: number;
	temporarymastery: number;
}

export interface Player {
	id: number;
	name: string;
	position: "attack" | "defend";
	battleStats: BattleStats;
	life: number;
	passives: BattleStats;
	weapons: {
		primary: Weapon;
		secondary: Weapon;
		melee: Weapon;
		temporary: Weapon;
	};
	armour: {
		head: Armour;
		body: Armour;
		hands: Armour;
		legs: Armour;
		feet: Armour;
	};
	attackSettings: {
		primary: WeaponSettings;
		secondary: WeaponSettings;
		melee: WeaponSettings;
		temporary: WeaponSettings;
	};
	defendSettings: {
		primary: WeaponSettings;
		secondary: WeaponSettings;
		melee: WeaponSettings;
		temporary: WeaponSettings;
	};
	educationPerks: EducationPerks;
	factionPerks: FactionPerks;
	companyPerks: CompanyPerks;
	propertyPerks: PropertyPerks;
	meritPerks: MeritPerks;
}

export interface SimulationResult {
	heroWins: number;
	villainWins: number;
	stalemates: number;
	totalTurns: number;
	heroLifeLeft: number;
	villainLifeLeft: number;
	fightLog: string[];
	heroLifeStats: Record<string, number>;
	villainLifeStats: Record<string, number>;
	trials: number;
}
