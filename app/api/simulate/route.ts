import { NextRequest, NextResponse } from 'next/server'
import { fight, setModData } from '../../lib/fightSimulator'
import { FightPlayer, FightResults, BattleStats, WeaponData, ArmourData, PlayerPerks } from '../../lib/fightSimulatorTypes'
import { loadGameData, getDefaultWeapon, getDefaultArmour } from '../../lib/dataLoader'

// 转换前端武器数据为战斗武器数据
function convertToFightWeapon(weapon: any): WeaponData {
  return {
    name: weapon.name || "Unknown",
    damage: weapon.damage || 50,
    accuracy: weapon.accuracy || 50,
    category: weapon.category || "Fists",
    clipsize: weapon.clipsize || 0,
    rateoffire: weapon.rateoffire || [1, 1],
    experience: weapon.experience || 0,
    bonus: weapon.bonus,
    mods: weapon.mods || []
  }
}

// 转换前端护甲数据为战斗护甲数据
function convertToFightArmour(armour: any): ArmourData {
  return {
    armour: armour.armour || 0,
    set: armour.set || "n/a",
    type: armour.type || ""
  }
}

// 转换前端玩家数据为战斗玩家数据
function convertToFightPlayer(playerData: any, position: "attack" | "defend", id: number): FightPlayer {
  const defaultPerks: PlayerPerks = {
    education: {
      damage: false,
      neckdamage: false,
      meleedamage: false,
      tempdamage: false,
      needleeffect: false,
      japanesedamage: false,
      fistdamage: false,
      critchance: false,
      machinegunaccuracy: false,
      smgaccuracy: false,
      pistolaccuracy: false,
      rifleaccuracy: false,
      heavyartilleryaccuracy: false,
      temporaryaccuracy: false,
      shotgunaccuracy: false,
      ammocontrol1: false,
      ammocontrol2: false
    },
    faction: {
      accuracy: 0,
      damage: 0
    },
    company: {
      name: "None",
      star: 0
    },
    property: {
      damage: false
    },
    merit: {
      critrate: 0
    }
  }

  return {
    id,
    name: playerData.name || "Player",
    life: playerData.life || 5000,
    position,
    battleStats: playerData.stats || { strength: 1000, speed: 1000, defense: 1000, dexterity: 1000 },
    passives: playerData.passives || { strength: 0, speed: 0, defense: 0, dexterity: 0 },
    weapons: {
      primary: playerData.weapons?.primary ? convertToFightWeapon(playerData.weapons.primary) : getDefaultWeapon('primary'),
      secondary: playerData.weapons?.secondary ? convertToFightWeapon(playerData.weapons.secondary) : getDefaultWeapon('secondary'),
      melee: playerData.weapons?.melee ? convertToFightWeapon(playerData.weapons.melee) : getDefaultWeapon('melee'),
      temporary: playerData.weapons?.temporary ? convertToFightWeapon(playerData.weapons.temporary) : getDefaultWeapon('temporary'),
      fists: { name: "Fists", damage: 50, accuracy: 50, category: "Fists", clipsize: 0, rateoffire: [1, 1], experience: 0 },
      kick: { name: "Kick", damage: 40, accuracy: 55, category: "Fists", clipsize: 0, rateoffire: [1, 1], experience: 0 }
    },
    armour: {
      head: playerData.armour?.head ? convertToFightArmour(playerData.armour.head) : getDefaultArmour('head'),
      body: playerData.armour?.body ? convertToFightArmour(playerData.armour.body) : getDefaultArmour('body'),
      hands: playerData.armour?.hands ? convertToFightArmour(playerData.armour.hands) : getDefaultArmour('hands'),
      legs: playerData.armour?.legs ? convertToFightArmour(playerData.armour.legs) : getDefaultArmour('legs'),
      feet: playerData.armour?.feet ? convertToFightArmour(playerData.armour.feet) : getDefaultArmour('feet')
    },
    attacksettings: playerData.attacksettings || {
      primary: { setting: position === "attack" ? 1 : 0, reload: true },
      secondary: { setting: position === "attack" ? 2 : 0, reload: true },
      melee: { setting: position === "attack" ? 3 : 0, reload: false },
      temporary: { setting: position === "attack" ? 4 : 0, reload: false }
    },
    defendsettings: playerData.defendsettings || {
      primary: { setting: position === "defend" ? 5 : 0, reload: true },
      secondary: { setting: position === "defend" ? 3 : 0, reload: true },
      melee: { setting: position === "defend" ? 2 : 0, reload: false },
      temporary: { setting: position === "defend" ? 0 : 0, reload: false }
    },
    perks: {
      education: { ...defaultPerks.education, ...playerData.perks?.education },
      faction: { ...defaultPerks.faction, ...playerData.perks?.faction },
      company: { ...defaultPerks.company, ...playerData.perks?.company },
      property: { ...defaultPerks.property, ...playerData.perks?.property },
      merit: { ...defaultPerks.merit, ...playerData.perks?.merit }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // 加载游戏数据
    const gameData = await loadGameData()
    
    // 设置改装数据到战斗模拟器
    if (gameData.mods) {
      setModData(gameData.mods)
    }
    
    const body = await request.json()
    const { player1, player2, simulations = 1000 } = body

    // 创建玩家数据
    const hero = convertToFightPlayer(player1, "attack", 1)
    const villain = convertToFightPlayer(player2, "defend", 2)

    // 初始化结果数组
    let results: FightResults = [
      0,    // heroWins
      0,    // villainWins  
      0,    // stalemates
      0,    // totalTurns
      0,    // heroLifeLeft
      0,    // villainLifeLeft
      [],   // fightLog
      0,    // hProcs
      [],   // hLifeStats
      []    // vLifeStats
    ]

    // 运行模拟
    for (let i = 0; i < simulations; i++) {
      results = fight(hero, villain, results)
    }

    // 计算统计数据
    const totalFights = results[0] + results[1] + results[2]
    const heroWinRate = totalFights > 0 ? (results[0] / totalFights * 100).toFixed(2) : '0.00'
    const villainWinRate = totalFights > 0 ? (results[1] / totalFights * 100).toFixed(2) : '0.00'
    const stalemateRate = totalFights > 0 ? (results[2] / totalFights * 100).toFixed(2) : '0.00'
    const avgTurns = totalFights > 0 ? (results[3] / totalFights).toFixed(2) : '0.00'
    const avgHeroLife = totalFights > 0 ? (results[4] / totalFights).toFixed(0) : '0'
    const avgVillainLife = totalFights > 0 ? (results[5] / totalFights).toFixed(0) : '0'

    return NextResponse.json({
      success: true,
      results: {
        totalSimulations: simulations,
        heroWins: results[0],
        villainWins: results[1],
        stalemates: results[2],
        heroWinRate: parseFloat(heroWinRate),
        villainWinRate: parseFloat(villainWinRate),
        stalemateRate: parseFloat(stalemateRate),
        averageTurns: parseFloat(avgTurns),
        averageHeroLifeRemaining: parseInt(avgHeroLife),
        averageVillainLifeRemaining: parseInt(avgVillainLife),
        lastFightLog: results[6],
        heroLifeDistribution: results[8],
        villainLifeDistribution: results[9]
      }
    })

  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json(
      { success: false, error: 'Simulation failed: ' + (error as Error).message },
      { status: 500 }
    )
  }
} 