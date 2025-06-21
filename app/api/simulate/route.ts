import { NextRequest, NextResponse } from 'next/server'
import { fight } from '../../lib/fightSimulator'
import { FightPlayer, FightResults, BattleStats, WeaponData, ArmourData, PlayerPerks } from '../../lib/fightSimulatorTypes'

// 创建默认玩家数据的辅助函数
function createDefaultPlayer(name: string, overrides: Partial<FightPlayer> = {}): FightPlayer {
  const defaultStats: BattleStats = {
    strength: 1000,
    speed: 1000,
    defense: 1000,
    dexterity: 1000
  }

  const defaultWeapon: WeaponData = {
    name: "Fists",
    damage: 100,
    accuracy: 50,
    category: "Fists",
    clipsize: 0,
    rateoffire: [1, 1],
    experience: 0
  }

  const defaultArmour: ArmourData = {
    armour: 0,
    set: "n/a"
  }

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
    id: 1,
    name,
    life: 5000,
    position: "defend",
    battleStats: defaultStats,
    passives: { ...defaultStats },
    weapons: {
      primary: defaultWeapon,
      secondary: defaultWeapon,
      melee: defaultWeapon,
      temporary: defaultWeapon,
      fists: defaultWeapon,
      kick: defaultWeapon
    },
    armour: {
      head: defaultArmour,
      body: defaultArmour,
      hands: defaultArmour,
      legs: defaultArmour,
      feet: defaultArmour
    },
    attacksettings: {
      primary: { setting: 1, reload: true },
      secondary: { setting: 0, reload: true },
      melee: { setting: 0, reload: false },
      temporary: { setting: 0, reload: false }
    },
    defendsettings: {
      primary: { setting: 5, reload: true },
      secondary: { setting: 3, reload: true },
      melee: { setting: 2, reload: false },
      temporary: { setting: 0, reload: false }
    },
    perks: defaultPerks,
    ...overrides
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { player1, player2, simulations = 1000 } = body

    // 创建玩家数据
    const hero = createDefaultPlayer("Hero", {
      position: "attack",
      battleStats: player1.stats || { strength: 1000, speed: 1000, defense: 1000, dexterity: 1000 },
      life: player1.life || 5000,
      weapons: {
        primary: player1.weapons?.primary || createDefaultPlayer("").weapons.primary,
        secondary: player1.weapons?.secondary || createDefaultPlayer("").weapons.secondary,
        melee: player1.weapons?.melee || createDefaultPlayer("").weapons.melee,
        temporary: player1.weapons?.temporary || createDefaultPlayer("").weapons.temporary,
        fists: createDefaultPlayer("").weapons.fists,
        kick: createDefaultPlayer("").weapons.kick
      }
    })

    const villain = createDefaultPlayer("Villain", {
      position: "defend",
      battleStats: player2.stats || { strength: 1000, speed: 1000, defense: 1000, dexterity: 1000 },
      life: player2.life || 5000,
      weapons: {
        primary: player2.weapons?.primary || createDefaultPlayer("").weapons.primary,
        secondary: player2.weapons?.secondary || createDefaultPlayer("").weapons.secondary,
        melee: player2.weapons?.melee || createDefaultPlayer("").weapons.melee,
        temporary: player2.weapons?.temporary || createDefaultPlayer("").weapons.temporary,
        fists: createDefaultPlayer("").weapons.fists,
        kick: createDefaultPlayer("").weapons.kick
      }
    })

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
      { success: false, error: 'Simulation failed' },
      { status: 500 }
    )
  }
} 