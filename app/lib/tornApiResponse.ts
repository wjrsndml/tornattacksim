export interface TornApiResponse {
	rank: string;
	level: number;
	honor: number;
	gender: string;
	property: string;
	signup: string;
	awards: number;
	friends: number;
	enemies: number;
	forum_posts: number;
	karma: number;
	age: number;
	role: string;
	donator: number;
	player_id: number;
	name: string;
	property_id: number;
	revivable: number;
	profile_image: string;
	strength: number;
	speed: number;
	dexterity: number;
	defense: number;
	total: number;
	strength_modifier: number;
	defense_modifier: number;
	speed_modifier: number;
	dexterity_modifier: number;
	life: {
		current: number;
		maximum: number;
		increment: number;
		interval: number;
		ticktime: number;
		fulltime: number;
	};
	status: {
		description: string;
		details: string;
		state: string;
		color: string;
		until: number;
	};
	job: {
		job: string;
		position: string;
		company_id: number;
		company_name: string;
		company_type: number;
	};
	faction: {
		position: string;
		faction_id: number;
		days_in_faction: number;
		faction_name: string;
		faction_tag: string;
		faction_tag_image: string;
	};
	married: {
		spouse_id: number;
		spouse_name: string;
		duration: number;
	};
	basicicons: {
		icon7: string;
		icon3: string;
		icon8: string;
		icon73: string;
		icon9: string;
	};
	states: {
		hospital_timestamp: number;
		jail_timestamp: number;
	};
	last_action: {
		status: string;
		timestamp: number;
		relative: string;
	};
	competition: {
		name: string;
		status: string;
		current_hp: number;
		max_hp: number;
	};
	equipment: Array<{
		ID: number;
		UID: number;
		name: string;
		type: string;
		equipped: number;
		market_price: number;
		quantity: number;
	}>;
	faction_perks: string[];
	job_perks: string[];
	property_perks: string[];
	education_perks: string[];
	enhancer_perks: string[];
	book_perks: string[];
	stock_perks: string[];
	merit_perks: string[];
	strength_info: string[];
	defense_info: string[];
	speed_info: string[];
	dexterity_info: string[];
	company: {
		ID: number;
		company_type: number;
		rating: number;
		name: string;
		director: number;
		employees_hired: number;
		employees_capacity: number;
		daily_income: number;
		daily_customers: number;
		weekly_income: number;
		weekly_customers: number;
		days_old: number;
		employees: {
			[key: string]: {
				name: string;
				position: string;
				days_in_company: number;
				last_action: {
					status: string;
					timestamp: number;
					relative: string;
				};
				status: {
					description: string;
					details: string;
					state: string;
					color: string;
					until: number;
				};
			};
		};
	};
}

// 新增：V2 API装备响应接口
export interface TornEquipmentResponse {
	equipment: Array<{
		ID: number;
		UID: number;
		name: string;
		type:
			| "Primary"
			| "Secondary"
			| "Melee"
			| "Temporary"
			| "Defensive"
			| "Clothing";
		equipped: number;
		market_price: number;
		quantity: number;
	}>;
}

// 新增：V2 API装备详情响应接口
export interface TornItemDetailsResponse {
	itemdetails: {
		ID: number;
		UID: number;
		name: string;
		type:
			| "Primary"
			| "Secondary"
			| "Melee"
			| "Temporary"
			| "Defensive"
			| "Clothing";
		rarity: string;
		damage?: number;
		accuracy?: number;
		quality?: number;
		armor?: number;
		bonuses?: {
			[key: string]: {
				bonus: string;
				description: string;
				value: number;
			};
		};
	};
}

// 新增：V2 API武器经验响应接口
export interface TornWeaponExpResponse {
	weaponexp: Array<{
		itemID: number;
		name: string;
		exp: number;
	}>;
}

export default TornApiResponse;
