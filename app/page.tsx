'use client'

import { useState, useEffect } from 'react'
import SimulationResults from './components/SimulationResults'
import PlayerConfig from './components/PlayerConfig'
import BattleLog from './components/BattleLog'
import BattleLogExport from './components/BattleLogExport'
import LifeHistogram from './components/LifeHistogram'
import { getDefaultWeapon, getDefaultArmour, loadGameData } from './lib/dataLoader'
import { WeaponData, ArmourData, BattleStats, EducationPerks, FactionPerks, CompanyPerks, PropertyPerks, MeritPerks } from './lib/fightSimulatorTypes'
import { runClientSimulation } from './lib/clientSimulator'

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
  allBattleLogs?: any[] // 可选的战斗日志数组
}

const createDefaultPlayer = (name: string, isAttacker: boolean): Player => {
  const defaultStats: BattleStats = {
    strength: 1000000,
    speed: 1000000,
    defense: 1000000,
    dexterity: 1000000
  }

  const defaultPassives: BattleStats = {
    strength: 10,
    speed: 10,
    defense: 10,
    dexterity: 10
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
    damage: 2
  }

  const defaultCompany: CompanyPerks = {
    name: "n/a",
    star: 0
  }

  const defaultProperty: PropertyPerks = {
    damage: false
  }

  const defaultMerit: MeritPerks = {
    critrate: 2,
    riflemastery: 2,
    smgmastery: 2,
    piercingmastery: 1,
    temporarymastery: 2
  }

  // 默认武器配置
  const defaultPrimary: WeaponData = {
    name: "ArmaLite M-15A4",
    category: "Rifle",
    clipsize: 15,
    rateoffire: [3, 5] as [number, number],
    bonus: {
      name: "n/a",
      proc: 0
    },
    accuracy: 57,
    damage: 68,
    experience: 5,
    ammo: "",
    mods: ["1mW Laser", "ACOG Sight"]
  }

  const defaultSecondary: WeaponData = {
    name: "BT MP9",
    category: "SMG",
    clipsize: 30,
    rateoffire: [2, 25] as [number, number],
    bonus: {
      name: "n/a",
      proc: 0
    },
    accuracy: 55,
    damage: 61.4,
    experience: 12,
    ammo: "",
    mods: ["Thermal Sight", "Skeet Choke"]
  }

  const defaultMelee: WeaponData = {
    name: "Macana",
    category: "Piercing",
    clipsize: 0,
    rateoffire: [1, 1] as [number, number],
    bonus: {
      name: "n/a",
      proc: 0
    },
    accuracy: 65,
    damage: 57,
    experience: 16,
    ammo: "",
    mods: []
  }

  const defaultTemporary: WeaponData = {
    name: "HEG",
    category: "Throwable",
    clipsize: 1,
    rateoffire: [1, 1] as [number, number],
    bonus: {
      name: "n/a",
      proc: 0
    },
    accuracy: 116,
    damage: 90,
    experience: 7,
    ammo: "",
    mods: []
  }

  // 默认护甲配置
  const defaultArmour = {
    head: {
      set: "n/a",
      type: "Motorcycle Helmet",
      armour_range: [30, 35],
      default: true,
      id: "642",
      armour: 32.5
    },
    body: {
      set: "n/a",
      type: "Full Body Armor",
      armour_range: [31, 36],
      default: true,
      id: "49",
      armour: 33.5
    },
    hands: {
      set: "Combat",
      type: "Combat Gloves",
      armour_range: [38, 43],
      default: true,
      id: "654",
      armour: 40.5
    },
    legs: {
      set: "Combat",
      type: "Combat Pants",
      armour_range: [38, 43],
      default: true,
      id: "652",
      armour: 40.5
    },
    feet: {
      set: "Combat",
      type: "Combat Boots",
      armour_range: [38, 43],
      default: true,
      id: "653",
      armour: 40.5
    }
  }

  return {
    name,
    life: 2375,
    stats: defaultStats,
    passives: defaultPassives,
    weapons: {
      primary: defaultPrimary,
      secondary: defaultSecondary,
      melee: defaultMelee,
      temporary: defaultTemporary
    },
    armour: defaultArmour,
    attacksettings: {
      primary: { setting: isAttacker ? 1 : 0, reload: true },
      secondary: { setting: isAttacker ? 0 : 0, reload: true },
      melee: { setting: isAttacker ? 2 : 0, reload: false },
      temporary: { setting: isAttacker ? 0 : 0, reload: false }
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
  const [allBattleLogs, setAllBattleLogs] = useState<any[]>([]) // 存储所有战斗日志
  const [lifeData, setLifeData] = useState<{player1: number[], player2: number[]}>({
    player1: [],
    player2: []
  })
  const [simulationSettings, setSimulationSettings] = useState({
    fights: 10000,
    enableLog: false,
    enableLifeHisto: false
  })
  const [battleResult, setBattleResult] = useState<'player1' | 'player2' | 'stalemate' | null>(null)

  const [player1, setPlayer1] = useState<Player>(createDefaultPlayer('Attacker', true))
  const [player2, setPlayer2] = useState<Player>(createDefaultPlayer('Defender', false))

  useEffect(() => {
    async function initializeData() {
      try {
        await loadGameData()
        
        // 重新创建默认玩家，这次使用加载的数据
        setPlayer1(createDefaultPlayer('Attacker', true))
        setPlayer2(createDefaultPlayer('Defender', false))

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
    setAllBattleLogs([]) // 清空所有战斗日志
    setLifeData({ player1: [], player2: [] })
    setBattleResult(null)
    
    try {
      // 使用客户端模拟器
      const data = await runClientSimulation(
        player1,
        player2,
        simulationSettings.fights,
        simulationSettings.enableLog
      )
      
      if (data.success) {
        setResults(data.results)
        
        // 如果启用了战斗日志，设置所有战斗日志数据
        if (simulationSettings.enableLog && data.results.allBattleLogs) {
          setAllBattleLogs(data.results.allBattleLogs)
        }
        
        // 根据模拟结果设置战斗结果
        if (data.results.heroWinRate > data.results.villainWinRate) {
          setBattleResult('player1') // Attacker赢
        } else if (data.results.villainWinRate > data.results.heroWinRate) {
          setBattleResult('player2') // Defender赢
        } else {
          setBattleResult('stalemate') // 平局
        }
        
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
      alert('运行模拟时出错: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setIsSimulating(false)
    }
  }

  const copyPlayer = (from: Player, to: 1 | 2) => {
    const copiedPlayer = { 
      ...from, 
      name: to === 1 ? 'Attacker' : 'Defender'
    }
    if (to === 1) {
      setPlayer1(copiedPlayer)
    } else {
      setPlayer2(copiedPlayer)
    }
  }

  const clearBattleLogs = () => {
    setBattleLogs([])
    setBattleResult(null)
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
                  <span className="text-sm text-gray-700">启用战斗日志记录</span>
                </label>
                <label className="flex items-center space-x-2">
                  {/* <input
                    type="checkbox"
                    checked={simulationSettings.enableLifeHisto}
                    onChange={(e) => setSimulationSettings(prev => ({ ...prev, enableLifeHisto: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">启用生命值分布</span> */}
                </label>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => copyPlayer(player2, 1)}
                className="btn-secondary"
              >
                复制Defender→Attacker
              </button>
              <button
                onClick={() => copyPlayer(player1, 2)}
                className="btn-secondary"
              >
                复制Attacker→Defender
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
              playerName="Attacker"
              isAttacker={true}
            />
          </div>

          {/* 玩家2配置 */}
          <div>
            <PlayerConfig
              player={player2}
              onPlayerChange={setPlayer2}
              playerName="Defender"
              isAttacker={false}
            />
          </div>

          {/* 结果显示 */}
          <div>
            {results ? (
              <SimulationResults 
                results={results}
                player1Name={player1.name}
                player2Name={player2.name}
              />
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
            {/* 隐藏原先的战斗日志组件，因为它不能正常工作
            <BattleLog
              logs={battleLogs}
              isActive={isSimulating}
              onClear={clearBattleLogs}
              player1Name={player1.name}
              player2Name={player2.name}
              battleResult={battleResult}
            />
            */}
            
            {/* 战斗日志导出 */}
            <BattleLogExport
              allBattleLogs={allBattleLogs}
              player1Name={player1.name}
              player2Name={player2.name}
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