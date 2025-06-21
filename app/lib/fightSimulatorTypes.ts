// 战斗模拟器的类型定义

export interface BattleStats {
  strength: number
  speed: number
  defense: number
  dexterity: number
}

export interface WeaponData {
  name: string
  damage: number
  accuracy: number
  category: string
  clipsize: number
  rateoffire: number[]
  ammo?: string
  mods?: string[]
  experience?: number
  bonus?: {
    name: string
    proc: number
    procrange?: string
  }
}

export interface ArmourData {
  armour: number
  set?: string
}

export interface WeaponSettings {
  setting: number
  reload: boolean
}

export interface PlayerPerks {
  education: {
    damage: boolean
    neckdamage: boolean
    meleedamage: boolean
    tempdamage: boolean
    needleeffect: boolean
    japanesedamage: boolean
    fistdamage: boolean
    critchance: boolean
    machinegunaccuracy: boolean
    smgaccuracy: boolean
    pistolaccuracy: boolean
    rifleaccuracy: boolean
    heavyartilleryaccuracy: boolean
    temporaryaccuracy: boolean
    shotgunaccuracy: boolean
    ammocontrol1: boolean
    ammocontrol2: boolean
  }
  faction: {
    accuracy: number
    damage: number
  }
  company: {
    name: string
    star: number
  }
  property: {
    damage: boolean
  }
  merit: {
    critrate: number
    [key: string]: number
  }
}

export interface FightPlayer {
  id: number
  name: string
  life: number
  position?: string // "attack" 或 "defend"
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
    primary: WeaponSettings
    secondary: WeaponSettings
    melee: WeaponSettings
    temporary: WeaponSettings
  }
  defendsettings: {
    primary: WeaponSettings
    secondary: WeaponSettings
    melee: WeaponSettings
    temporary: WeaponSettings
  }
  perks: PlayerPerks
}

export interface WeaponState {
  primary: {
    ammoleft: number
    maxammo: number
    clipsleft: number
    rof: number[]
  }
  secondary: {
    ammoleft: number
    maxammo: number
    clipsleft: number
    rof: number[]
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

export type StatusEffects = number[][]
export type DOTEffects = number[][]
export type TempEffects = (string | number)[][]

export interface FightData {
  players: { [key: string]: FightPlayer }
  a: any // 护甲覆盖数据
  weapons: any // 武器数据
  armours: any // 护甲数据
  m: any // 改装数据
  t: any // 临时武器数据
  companies: any // 公司数据
}

export type FightResults = [
  number, // heroWins
  number, // villainWins
  number, // stalemates
  number, // totalTurns
  number, // heroLifeLeft
  number, // villainLifeLeft
  string[], // fightLog
  number, // hProcs
  number[], // hLifeStats
  number[] // vLifeStats
]

export type TurnResults = [
  string[], // log
  number, // hCL
  number, // vCL
  WeaponState, // hWS
  WeaponState, // vWS
  StatusEffects, // hSE
  StatusEffects, // vSE
  DOTEffects, // hDOT
  DOTEffects, // vDOT
  any, // h_set
  any, // v_set
  TempEffects, // h_temps
  TempEffects // v_temps
]

export type ActionResults = [
  string[], // log
  number, // xCL
  number, // yCL
  WeaponState, // xWS
  WeaponState, // yWS
  StatusEffects, // xSE
  StatusEffects, // ySE
  DOTEffects, // xDOT
  DOTEffects, // yDOT
  any, // x_set
  any, // y_set
  TempEffects, // x_temps
  TempEffects // y_temps
] 