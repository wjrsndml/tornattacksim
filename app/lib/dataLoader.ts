import { 
  WeaponDataSet, 
  ArmourDataSet, 
  ModDataSet, 
  CompanyDataSet, 
  ArmourCoverageData,
  RealWeaponData,
  WeaponData,
  RealArmourData,
  ArmourData,
  FightData
} from './fightSimulatorTypes'

// 全局数据缓存
let gameData: FightData | null = null
let tempBlockData: { [weaponName: string]: string[] } = {}

/**
 * 获取基础URL
 */
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // 客户端
    return window.location.origin
  }
  // 服务器端
  return process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000'
}

/**
 * 加载游戏数据
 */
export async function loadGameData(): Promise<FightData> {
  if (gameData) {
    return gameData
  }

  try {
    const baseUrl = getBaseUrl()
    
    const [weaponsResponse, armoursResponse, modsResponse, armourCoverageResponse, companiesResponse] = await Promise.all([
      fetch(`${baseUrl}/weapons.json`),
      fetch(`${baseUrl}/armour.json`),
      fetch(`${baseUrl}/mods.json`),
      fetch(`${baseUrl}/armourCoverage.json`),
      fetch(`${baseUrl}/companies.json`)
    ])

    const [weaponsData, armoursData, modsData, armourCoverageData, companiesData] = await Promise.all([
      weaponsResponse.json(),
      armoursResponse.json(),
      modsResponse.json(),
      armourCoverageResponse.json(),
      companiesResponse.json()
    ])

    // 提取临时武器阻挡数据
    tempBlockData = weaponsData.tempBlock || {}

    gameData = {
      weapons: weaponsData,
      armours: armoursData,
      mods: modsData,
      armourCoverage: armourCoverageData,
      companies: companiesData,
      players: {} // 初始化为空对象，将在运行时填充
    }

    return gameData
  } catch (error) {
    console.error('Failed to load game data:', error)
    throw error
  }
}

/**
 * 将真实武器数据转换为简化格式
 */
export function convertRealWeaponData(realWeapon: RealWeaponData): WeaponData {
  // 取伤害和精准度范围的中值
  const damage = Math.round((realWeapon.damage_range[0] + realWeapon.damage_range[1]) / 2)
  const accuracy = Math.round((realWeapon.accuracy_range[0] + realWeapon.accuracy_range[1]) / 2)
  
  let bonus: { name: string; proc: number } | undefined
  if (realWeapon.bonus.name !== "n/a" && realWeapon.bonus.procrange !== "n/a") {
    const procrange = realWeapon.bonus.procrange as [number, number]
    const proc = Math.round((procrange[0] + procrange[1]) / 2)
    bonus = {
      name: realWeapon.bonus.name,
      proc
    }
  }

  return {
    name: realWeapon.name,
    damage,
    accuracy,
    category: realWeapon.category,
    clipsize: realWeapon.clipsize,
    rateoffire: realWeapon.rateoffire,
    experience: 0,
    bonus
  }
}

/**
 * 将真实护甲数据转换为简化格式
 */
export function convertRealArmourData(realArmour: RealArmourData): ArmourData {
  const armour = Math.round((realArmour.armour_range[0] + realArmour.armour_range[1]) / 2)
  
  return {
    armour,
    set: realArmour.set,
    type: realArmour.type
  }
}

/**
 * 获取指定ID的武器数据
 */
export function getWeaponById(weaponType: 'primary' | 'secondary' | 'melee' | 'temporary', weaponId: string): WeaponData | null {
  if (!gameData?.weapons) return null
  
  const realWeapon = gameData.weapons[weaponType][weaponId]
  if (!realWeapon) return null
  
  return convertRealWeaponData(realWeapon)
}

/**
 * 根据ID获取护甲数据
 */
export function getArmourById(armourType: 'head' | 'body' | 'hands' | 'legs' | 'feet', id: string): ArmourData | null {
  if (!gameData?.armours || !gameData.armours[armourType] || !gameData.armours[armourType][id]) {
    return null
  }
  
  return convertRealArmourData(gameData.armours[armourType][id])
}

/**
 * 获取默认武器数据
 */
export function getDefaultWeapon(weaponType: 'primary' | 'secondary' | 'melee' | 'temporary'): WeaponData {
  if (gameData?.weapons) {
    // 尝试获取ID为"0"的默认武器
    const defaultWeapon = gameData.weapons[weaponType]["0"]
    if (defaultWeapon) {
      return convertRealWeaponData(defaultWeapon)
    }
  }

  // 如果没有找到，返回硬编码的默认值
  const defaults = {
    primary: { name: "Fists", damage: 50, accuracy: 50, category: "Fists", clipsize: 0, rateoffire: [1, 1] as [number, number] },
    secondary: { name: "Fists", damage: 30, accuracy: 60, category: "Fists", clipsize: 0, rateoffire: [1, 1] as [number, number] },
    melee: { name: "Fists", damage: 40, accuracy: 55, category: "Fists", clipsize: 0, rateoffire: [1, 1] as [number, number] },
    temporary: { name: "None", damage: 0, accuracy: 0, category: "Temporary", clipsize: 0, rateoffire: [1, 1] as [number, number] }
  }

  return {
    ...defaults[weaponType],
    experience: 0
  }
}

/**
 * 获取默认护甲数据
 */
export function getDefaultArmour(armourType: 'head' | 'body' | 'hands' | 'legs' | 'feet'): ArmourData {
  if (gameData?.armours) {
    // 查找标记为default的护甲
    const armourData = gameData.armours[armourType]
    for (const id in armourData) {
      if (armourData[id].default) {
        return convertRealArmourData(armourData[id])
      }
    }
    
    // 如果没有默认护甲，尝试获取ID为"0"的护甲
    const defaultArmour = armourData["0"]
    if (defaultArmour) {
      return convertRealArmourData(defaultArmour)
    }
  }

  // 如果没有找到，返回无护甲
  return {
    armour: 0,
    set: "n/a",
    type: ""
  }
}

/**
 * 获取所有武器列表（用于UI选择）
 */
export function getWeaponList(weaponType: 'primary' | 'secondary' | 'melee' | 'temporary'): Array<{id: string, weapon: WeaponData}> {
  if (!gameData?.weapons) return []
  
  const weapons = gameData.weapons[weaponType]
  return Object.entries(weapons)
    .filter(([id, weapon]) => weapon.name !== "") // 过滤掉空名称的武器
    .map(([id, weapon]) => ({
      id,
      weapon: convertRealWeaponData(weapon)
    }))
    .sort((a, b) => a.weapon.name.localeCompare(b.weapon.name))
}

/**
 * 获取护甲列表
 */
export function getArmourList(armourType: 'head' | 'body' | 'hands' | 'legs' | 'feet'): Array<{id: string, armour: ArmourData}> {
  if (!gameData?.armours || !gameData.armours[armourType]) return []
  
  return Object.entries(gameData.armours[armourType]).map(([id, realArmour]) => ({
    id,
    armour: convertRealArmourData(realArmour)
  }))
}

/**
 * 获取公司列表
 */
export function getCompanyList(): string[] {
  if (!gameData?.companies) return []
  
  return Object.keys(gameData.companies)
}

/**
 * 获取改装数据
 */
export function getModData(modName: string) {
  if (!gameData?.mods) return null
  return gameData.mods[modName]
}

/**
 * 获取所有改装列表
 */
export function getModList(): string[] {
  if (!gameData?.mods) return []
  return Object.keys(gameData.mods)
} 

/**
 * 获取护甲覆盖数据
 */
export function getArmourCoverage(): any {
  return gameData?.armourCoverage || {}
}

/**
 * 检查护甲是否能阻挡临时武器
 */
export function canArmourBlock(weaponName: string, armourType: string): boolean {
  const blockingArmours = tempBlockData[weaponName]
  return blockingArmours ? blockingArmours.includes(armourType) : false
}

/**
 * 获取所有护甲套装列表（用于护甲覆盖显示）
 */
export function getAllArmourSets(): string[] {
  if (!gameData?.armours) return []
  
  const sets = new Set<string>()
  
  // 收集所有护甲套装名称
  Object.values(gameData.armours).forEach(armourTypeData => {
    Object.values(armourTypeData).forEach((armour: RealArmourData) => {
      sets.add(armour.set)
    })
  })
  
  return Array.from(sets).sort()
} 