import { 
  WeaponDataSet, 
  ArmourDataSet, 
  ModDataSet, 
  CompanyDataSet, 
  ArmourCoverageData,
  RealWeaponData,
  WeaponData,
  RealArmourData,
  ArmourData
} from './fightSimulatorTypes'

// 缓存加载的数据
let cachedData: {
  weapons?: WeaponDataSet
  armours?: ArmourDataSet
  mods?: ModDataSet
  companies?: CompanyDataSet
  armourCoverage?: ArmourCoverageData
} = {}

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
 * 加载所有游戏数据
 */
export async function loadGameData() {
  if (Object.keys(cachedData).length > 0) {
    return cachedData
  }

  try {
    const baseUrl = getBaseUrl()
    
    const [weaponsRes, armoursRes, modsRes, companiesRes, armourCoverageRes] = await Promise.all([
      fetch(`${baseUrl}/weapons.json`),
      fetch(`${baseUrl}/armour.json`),
      fetch(`${baseUrl}/mods.json`),
      fetch(`${baseUrl}/companies.json`),
      fetch(`${baseUrl}/armourCoverage.json`)
    ])

    const [weapons, armours, mods, companies, armourCoverage] = await Promise.all([
      weaponsRes.json() as Promise<WeaponDataSet>,
      armoursRes.json() as Promise<ArmourDataSet>,
      modsRes.json() as Promise<ModDataSet>,
      companiesRes.json() as Promise<CompanyDataSet>,
      armourCoverageRes.json() as Promise<ArmourCoverageData>
    ])

    cachedData = { weapons, armours, mods, companies, armourCoverage }
    return cachedData
  } catch (error) {
    console.error('Failed to load game data:', error)
    throw new Error('Failed to load game data')
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
  if (!cachedData.weapons) return null
  
  const realWeapon = cachedData.weapons[weaponType][weaponId]
  if (!realWeapon) return null
  
  return convertRealWeaponData(realWeapon)
}

/**
 * 获取指定ID的护甲数据
 */
export function getArmourById(armourType: 'head' | 'body' | 'hands' | 'legs' | 'feet', armourId: string): ArmourData | null {
  if (!cachedData.armours) return null
  
  const realArmour = cachedData.armours[armourType][armourId]
  if (!realArmour) return null
  
  return convertRealArmourData(realArmour)
}

/**
 * 获取默认武器数据
 */
export function getDefaultWeapon(weaponType: 'primary' | 'secondary' | 'melee' | 'temporary'): WeaponData {
  if (cachedData.weapons) {
    // 尝试获取ID为"0"的默认武器
    const defaultWeapon = cachedData.weapons[weaponType]["0"]
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
  if (cachedData.armours) {
    // 查找标记为default的护甲
    const armourData = cachedData.armours[armourType]
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
  if (!cachedData.weapons) return []
  
  const weapons = cachedData.weapons[weaponType]
  return Object.entries(weapons)
    .filter(([id, weapon]) => weapon.name !== "") // 过滤掉空名称的武器
    .map(([id, weapon]) => ({
      id,
      weapon: convertRealWeaponData(weapon)
    }))
    .sort((a, b) => a.weapon.name.localeCompare(b.weapon.name))
}

/**
 * 获取所有护甲列表（用于UI选择）
 */
export function getArmourList(armourType: 'head' | 'body' | 'hands' | 'legs' | 'feet'): Array<{id: string, armour: ArmourData}> {
  if (!cachedData.armours) return []
  
  const armours = cachedData.armours[armourType]
  return Object.entries(armours)
    .filter(([id, armour]) => armour.type !== "") // 过滤掉空名称的护甲
    .map(([id, armour]) => ({
      id,
      armour: convertRealArmourData(armour)
    }))
    .sort((a, b) => a.armour.type!.localeCompare(b.armour.type!))
}

/**
 * 获取公司列表
 */
export function getCompanyList(): string[] {
  if (!cachedData.companies) return []
  
  return Object.keys(cachedData.companies)
}

/**
 * 获取改装数据
 */
export function getModData(modName: string) {
  if (!cachedData.mods) return null
  return cachedData.mods[modName]
}

/**
 * 获取所有改装列表
 */
export function getModList(): string[] {
  if (!cachedData.mods) return []
  return Object.keys(cachedData.mods)
} 