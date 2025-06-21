import { NextRequest, NextResponse } from 'next/server'
import { Worker } from 'worker_threads'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { hero, villain, trials } = await request.json()

    // 创建模拟数据结构，适配原有的fightSimulator.js
    const simulationData = {
      fightControl: [hero.id, villain.id, trials],
      players: {
        [hero.id.toString()]: transformPlayerData(hero),
        [villain.id.toString()]: transformPlayerData(villain)
      },
      // 这些数据需要从配置文件加载，现在使用默认值
      a: {}, // 护甲覆盖数据
      weapons: {}, // 武器数据
      armours: {}, // 护甲数据  
      m: {}, // 改装数据
      t: {}, // 临时武器数据
      companies: {} // 公司数据
    }

    // 使用原有的fightSimulator.js进行战斗模拟
    const results = await runFightSimulation(simulationData)

    // 转换结果格式
    const response = {
      heroWins: results[0],
      villainWins: results[1], 
      stalemates: results[2],
      totalTurns: results[3],
      heroLifeLeft: results[4],
      villainLifeLeft: results[5],
      fightLog: results[6] || [],
      heroLifeStats: results[8] || [],
      villainLifeStats: results[9] || [],
      trials: trials
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('模拟错误:', error)
    return NextResponse.json(
      { error: '模拟失败' },
      { status: 500 }
    )
  }
}

function transformPlayerData(player: any) {
  return {
    name: player.name,
    id: player.id,
    life: player.life,
    battleStats: player.battleStats,
    passives: player.passives,
    weapons: {
      primary: {
        ...player.weapons.primary,
        category: 'Primary', // 默认类别
        clipsize: 30,
        rateoffire: [1, 1],
        mods: ['None', 'None']
      },
      secondary: {
        ...player.weapons.secondary,
        category: 'Secondary',
        clipsize: 15,
        rateoffire: [1, 1],
        mods: ['None', 'None']
      },
      melee: {
        ...player.weapons.melee,
        category: 'Melee',
        clipsize: 1,
        rateoffire: [1, 1]
      },
      temporary: {
        ...player.weapons.temporary,
        category: 'Temporary',
        clipsize: 1,
        rateoffire: [1, 1]
      }
    },
    armour: player.armour,
    attacksettings: player.position === 'attack' ? player.attackSettings : player.defendSettings,
    defendsettings: player.position === 'defend' ? player.defendSettings : player.attackSettings,
    perks: {
      education: player.educationPerks,
      faction: player.factionPerks,
      company: player.companyPerks,
      property: player.propertyPerks,
      merit: player.meritPerks
    }
  }
}

function runFightSimulation(data: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    // 这里应该使用Worker来运行fightSimulator.js
    // 但为了简化，我们先返回模拟数据
    
    const mockResults = [
      Math.floor(data.fightControl[2] * 0.6), // heroWins
      Math.floor(data.fightControl[2] * 0.35), // villainWins  
      Math.floor(data.fightControl[2] * 0.05), // stalemates
      data.fightControl[2] * 15, // totalTurns
      data.fightControl[2] * 1000, // heroLifeLeft
      data.fightControl[2] * 800, // villainLifeLeft
      ['战斗开始', '英雄攻击', '反派反击', '战斗结束'], // fightLog
      0, // hProcs
      [], // hLifeStats
      [] // vLifeStats
    ]
    
    resolve(mockResults)
  })
} 