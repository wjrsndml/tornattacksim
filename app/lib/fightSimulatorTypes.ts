// 战斗模拟器的类型定义

// 战斗属性接口
export interface BattleStats {
  strength: number
  speed: number
  defense: number
  dexterity: number
}

// 真实武器数据接口
export interface RealWeaponData {
  name: string
  category: string
  damage_range: [number, number]
  accuracy_range: [number, number]
  clipsize: number
  rateoffire: [number, number]
  bonus: {
    name: string
    procrange: string | [number, number]
  }
}

// 简化武器数据接口（用于前端）
export interface WeaponData {
  name: string
  damage: number
  accuracy: number
  category: string
  clipsize: number
  rateoffire: [number, number]
  experience?: number
  bonus?: {
    name: string
    proc: number
  }
  mods?: string[] // 武器改装列表
  ammo?: string // 弹药类型：TR(追踪弹), PI(穿甲弹), HP(空心弹), IN(燃烧弹)
}

// 真实护甲数据接口
export interface RealArmourData {
  set: string
  type: string
  armour_range: [number, number]
  default?: boolean
}

// 简化护甲数据接口
export interface ArmourData {
  armour: number
  set: string
  type?: string
}

// 改装数据接口
export interface ModData {
  acc_bonus: number
  enemy_acc_bonus: number
  crit_chance: number
  dmg_bonus: number
  dex_passive: number
  clip_size_multi: number
  extra_clips: number
  rate_of_fire_multi: number
  turn1?: {
    acc_bonus?: number
  }
}

// 武器数据集合
export interface WeaponDataSet {
  primary: { [key: string]: RealWeaponData }
  secondary: { [key: string]: RealWeaponData }
  melee: { [key: string]: RealWeaponData }
  temporary: { [key: string]: RealWeaponData }
  tempBlock: { [key: string]: string[] }
}

// 护甲数据集合
export interface ArmourDataSet {
  head: { [key: string]: RealArmourData }
  body: { [key: string]: RealArmourData }
  hands: { [key: string]: RealArmourData }
  legs: { [key: string]: RealArmourData }
  feet: { [key: string]: RealArmourData }
}

// 公司数据
export interface CompanyDataSet {
  [companyName: string]: number[]
}

// 改装数据集合
export interface ModDataSet {
  [modName: string]: ModData
}

// 护甲覆盖数据
export interface ArmourCoverageData {
  [itemName: string]: string[]
}

// 教育技能接口
export interface EducationPerks {
  damage: boolean
  meleedamage: boolean
  japanesedamage: boolean
  tempdamage: boolean
  needleeffect: boolean
  fistdamage: boolean
  neckdamage: boolean
  critchance: boolean
  ammocontrol1: boolean
  ammocontrol2: boolean
  machinegunaccuracy?: boolean
  smgaccuracy?: boolean
  pistolaccuracy?: boolean
  rifleaccuracy?: boolean
  heavyartilleryaccuracy?: boolean
  shotgunaccuracy?: boolean
  temporaryaccuracy?: boolean
}

// 派系技能接口
export interface FactionPerks {
  accuracy: number
  damage: number
}

// 公司技能接口
export interface CompanyPerks {
  name: string
  star: number
}

// 房产技能接口
export interface PropertyPerks {
  damage: boolean
}

// 荣誉技能接口
export interface MeritPerks {
  critrate: number
  primarymastery?: number
  secondarymastery?: number
  meleemastery?: number
  temporarymastery?: number
  clubbingmastery?: number
  heavyartillerymastery?: number
  machinegunmastery?: number
  mechanicalmastery?: number
  piercingmastery?: number
  pistolmastery?: number
  riflemastery?: number
  shotgunmastery?: number
  slashingmastery?: number
  smgmastery?: number
}

// 玩家技能集合
export interface PlayerPerks {
  education: EducationPerks
  faction: FactionPerks
  company: CompanyPerks
  property: PropertyPerks
  merit: MeritPerks
}

// 武器状态接口
export interface WeaponState {
  primary: {
    ammoleft: number
    maxammo: number
    clipsleft: number
    rof: [number, number]
  }
  secondary: {
    ammoleft: number
    maxammo: number
    clipsleft: number
    rof: [number, number]
  }
  melee: {
    ammoleft: string
    storageused: boolean
  }
  temporary: {
    ammoleft: string
    initialsetting: number
  }
}

// 状态效果：[施加的, 受到的]
export type StatusEffects = [[number, number, number, number, number, number], [number, number, number, number, number, number]]

// DOT效果：[伤害值, 持续时间]
export type DOTEffects = [[number, number], [number, number], [number, number], [number, number]]

// 临时效果：[效果类型, 持续时间]
export type TempEffects = Array<[string, number]>

// 战斗玩家接口
export interface FightPlayer {
  id: number
  name: string
  life: number
  position: "attack" | "defend"
  battleStats: BattleStats
  passives: BattleStats
  weapons: {
    primary: WeaponData
    secondary: WeaponData
    melee: WeaponData
    temporary: WeaponData
    fists: WeaponData
    kick: WeaponData
  }
  armour: {
    head: ArmourData
    body: ArmourData
    hands: ArmourData
    legs: ArmourData
    feet: ArmourData
  }
  attacksettings: {
    primary: { setting: number; reload: boolean }
    secondary: { setting: number; reload: boolean }
    melee: { setting: number; reload: boolean }
    temporary: { setting: number; reload: boolean }
  }
  defendsettings: {
    primary: { setting: number; reload: boolean }
    secondary: { setting: number; reload: boolean }
    melee: { setting: number; reload: boolean }
    temporary: { setting: number; reload: boolean }
  }
  perks: PlayerPerks
}

// 战斗结果类型：[英雄胜利, 反派胜利, 平局, 总回合数, 英雄剩余生命, 反派剩余生命, 战斗日志, 英雄特效次数, 英雄生命分布, 反派生命分布]
export type FightResults = [number, number, number, number, number, number, string[], number, number[], number[]]

// 回合结果类型
export type TurnResults = [string[], number, number, WeaponState, WeaponState, StatusEffects, StatusEffects, DOTEffects, DOTEffects, any, any, TempEffects, TempEffects]

// 行动结果类型
export type ActionResults = [string[], number, number, WeaponState, WeaponState, StatusEffects, StatusEffects, DOTEffects, DOTEffects, any, any, TempEffects, TempEffects]

// 战斗数据接口
export interface FightData {
  players: { [key: string]: FightPlayer }
  weapons: WeaponDataSet
  armours: ArmourDataSet
  mods: ModDataSet
  companies: CompanyDataSet
  armourCoverage: ArmourCoverageData
} 