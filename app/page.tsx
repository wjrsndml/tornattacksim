'use client'

import { useState, useEffect } from 'react'
import SimulationResults from './components/SimulationResults'
import PlayerConfig from './components/PlayerConfig'
import BattleLog from './components/BattleLog'
import LifeHistogram from './components/LifeHistogram'
import { getDefaultWeapon, getDefaultArmour, loadGameData } from './lib/dataLoader'
import { WeaponData, ArmourData, BattleStats, EducationPerks, FactionPerks, CompanyPerks, PropertyPerks, MeritPerks } from './lib/fightSimulatorTypes'

interface Player {
  name: string
  life: number
  stats: BattleStats
  passives: BattleStats
  weapons: {
    primary: WeaponData
    secondary: WeaponData
    melee: WeaponData
    temporary: WeaponData
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
  perks: {
    education: EducationPerks
    faction: FactionPerks
    company: CompanyPerks
    property: PropertyPerks
    merit: MeritPerks
  }
}

interface BattleLogEntry {
  turn: number
  attacker: string
  action: string
  target: string
  damage: number
  weapon: string
  bodyPart: string
  effect?: string
  timestamp: number
}

interface SimulationResult {
  totalSimulations: number
  heroWins: number
  villainWins: number
  stalemates: number
  heroWinRate: number
  villainWinRate: number
  stalemateRate: number
  averageTurns: number
  averageHeroLifeRemaining: number
  averageVillainLifeRemaining: number
  lastFightLog: string[]
  heroLifeDistribution: number[]
  villainLifeDistribution: number[]
}

const createDefaultPlayer = (name: string, isAttacker: boolean): Player => {
  const defaultStats: BattleStats = {
    strength: 1000000,
    speed: 1000000,
    defense: 1000000,
    dexterity: 1000000
  }

  const defaultPassives: BattleStats = {
    strength: 0,
    speed: 0,
    defense: 0,
    dexterity: 0
  }

  const defaultEducation: EducationPerks = {
    damage: false,
    meleedamage: false,
    japanesedamage: false,
    tempdamage: false,
    needleeffect: false,
    fistdamage: false,
    neckdamage: false,
    critchance: false,
    ammocontrol1: false,
    ammocontrol2: false,
    machinegunaccuracy: false,
    smgaccuracy: false,
    pistolaccuracy: false,
    rifleaccuracy: false,
    heavyartilleryaccuracy: false,
    shotgunaccuracy: false,
    temporaryaccuracy: false
  }

  const defaultFaction: FactionPerks = {
    accuracy: 0,
    damage: 0
  }

  const defaultCompany: CompanyPerks = {
    name: "None",
    star: 0
  }

  const defaultProperty: PropertyPerks = {
    damage: false
  }

  const defaultMerit: MeritPerks = {
    critrate: 0
  }

  return {
    name,
    life: 2375,
    stats: defaultStats,
    passives: defaultPassives,
    weapons: {
      primary: { ...getDefaultWeapon('primary'), mods: [] },
      secondary: { ...getDefaultWeapon('secondary'), mods: [] },
      melee: { ...getDefaultWeapon('melee'), mods: [] },
      temporary: { ...getDefaultWeapon('temporary'), mods: [] }
    },
    armour: {
      head: getDefaultArmour('head'),
      body: getDefaultArmour('body'),
      hands: getDefaultArmour('hands'),
      legs: getDefaultArmour('legs'),
      feet: getDefaultArmour('feet')
    },
    attacksettings: {
      primary: { setting: isAttacker ? 1 : 0, reload: true },
      secondary: { setting: isAttacker ? 2 : 0, reload: true },
      melee: { setting: isAttacker ? 3 : 0, reload: false },
      temporary: { setting: isAttacker ? 4 : 0, reload: false }
    },
    defendsettings: {
      primary: { setting: isAttacker ? 0 : 5, reload: true },
      secondary: { setting: isAttacker ? 0 : 3, reload: true },
      melee: { setting: isAttacker ? 0 : 2, reload: false },
      temporary: { setting: isAttacker ? 0 : 0, reload: false }
    },
    perks: {
      education: defaultEducation,
      faction: defaultFaction,
      company: defaultCompany,
      property: defaultProperty,
      merit: defaultMerit
    }
  }
}

export default function Home() {
  const [simulations, setSimulations] = useState(10000)
  const [isSimulating, setIsSimulating] = useState(false)
  const [results, setResults] = useState<SimulationResult | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [battleLogs, setBattleLogs] = useState<BattleLogEntry[]>([])
  const [lifeData, setLifeData] = useState<{player1: number[], player2: number[]}>({
    player1: [],
    player2: []
  })
  const [simulationSettings, setSimulationSettings] = useState({
    fights: 10000,
    enableLog: false,
    enableLifeHisto: false
  })

  const [player1, setPlayer1] = useState<Player>(createDefaultPlayer('英雄', true))
  const [player2, setPlayer2] = useState<Player>(createDefaultPlayer('反派', false))

  useEffect(() => {
    async function initializeData() {
      try {
        await loadGameData()
        
        // 重新创建默认玩家，这次使用加载的数据
        setPlayer1(createDefaultPlayer('英雄', true))
        setPlayer2(createDefaultPlayer('反派', false))

        setDataLoaded(true)
      } catch (error) {
        console.error('Failed to load game data:', error)
      }
    }

    initializeData()
  }, [])

  const handleSimulate = async () => {
    setIsSimulating(true)
    setBattleLogs([])
    setLifeData({ player1: [], player2: [] })
    
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player1,
          player2,
          simulations: simulationSettings.fights,
          enableLog: simulationSettings.enableLog,
          enableLifeHisto: simulationSettings.enableLifeHisto
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setResults(data.results)
        
        // 如果启用了生命值分布，设置数据
        if (simulationSettings.enableLifeHisto && data.results.heroLifeDistribution) {
          setLifeData({
            player1: data.results.heroLifeDistribution,
            player2: data.results.villainLifeDistribution
          })
        }
      } else {
        console.error('Simulation failed:', data.error)
        alert('模拟失败: ' + data.error)
      }
    } catch (error) {
      console.error('Error running simulation:', error)
      alert('运行模拟时出错')
    } finally {
      setIsSimulating(false)
    }
  }

  const copyPlayer = (from: Player, to: 1 | 2) => {
    const copiedPlayer = { 
      ...from, 
      name: to === 1 ? '英雄' : '反派'
    }
    if (to === 1) {
      setPlayer1(copiedPlayer)
    } else {
      setPlayer2(copiedPlayer)
    }
  }

  const clearBattleLogs = () => {
    setBattleLogs([])
  }

  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-torn-primary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">正在加载游戏数据...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 模拟控制 */}
        <div className="card mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模拟次数: {simulationSettings.fights.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="100"
                  max="100000"
                  step="100"
                  value={simulationSettings.fights}
                  onChange={(e) => setSimulationSettings(prev => ({ ...prev, fights: parseInt(e.target.value) }))}
                  className="w-48"
                  aria-label="模拟次数"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>100</span>
                  <span>100,000</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={simulationSettings.enableLog}
                    onChange={(e) => setSimulationSettings(prev => ({ ...prev, enableLog: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">启用战斗日志</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={simulationSettings.enableLifeHisto}
                    onChange={(e) => setSimulationSettings(prev => ({ ...prev, enableLifeHisto: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">启用生命值分布</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => copyPlayer(player2, 1)}
                className="btn-secondary"
              >
                复制反派→英雄
              </button>
              <button
                onClick={() => copyPlayer(player1, 2)}
                className="btn-secondary"
              >
                复制英雄→反派
              </button>
              <button
                onClick={handleSimulate}
                disabled={isSimulating}
                className="btn-primary"
              >
                {isSimulating ? '模拟中...' : '开始战斗'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 玩家1配置 */}
          <div>
            <PlayerConfig
              player={player1}
              onPlayerChange={setPlayer1}
              playerName="英雄"
              isAttacker={true}
            />
          </div>

          {/* 玩家2配置 */}
          <div>
            <PlayerConfig
              player={player2}
              onPlayerChange={setPlayer2}
              playerName="反派"
              isAttacker={false}
            />
          </div>

          {/* 结果显示 */}
          <div>
            {results ? (
              <SimulationResults results={results} />
            ) : (
              <div className="card text-center">
                <div className="py-12">
                  <div className="text-6xl mb-4">⚔️</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    准备开始战斗模拟
                  </h3>
                  <p className="text-gray-600">
                    配置你的玩家并点击"开始战斗"查看结果
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 战斗日志 */}
        {simulationSettings.enableLog && (
          <div className="mt-8">
            <BattleLog
              logs={battleLogs}
              isActive={isSimulating}
              onClear={clearBattleLogs}
            />
          </div>
        )}

        {/* 生命值分布 */}
        {simulationSettings.enableLifeHisto && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <LifeHistogram
              lifeData={lifeData.player1}
              playerName={player1.name}
              totalFights={simulationSettings.fights}
            />
            <LifeHistogram
              lifeData={lifeData.player2}
              playerName={player2.name}
              totalFights={simulationSettings.fights}
            />
          </div>
        )}
      </div>
    </div>
  )
} 