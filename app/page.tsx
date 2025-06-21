'use client'

import React, { useState } from 'react'
import PlayerConfig from './components/PlayerConfig'
import SimulationResults from './components/SimulationResults'
import { Player, SimulationResult } from './types'

const defaultPlayer: Player = {
  id: 1,
  name: '玩家',
  position: 'attack',
  battleStats: {
    strength: 1000000,
    speed: 1000000,
    defense: 1000000,
    dexterity: 1000000,
  },
  life: 2375,
  passives: {
    strength: 0,
    speed: 0,
    defense: 0,
    dexterity: 0,
  },
  weapons: {
    primary: { id: '0', damage: 50, accuracy: 50, experience: 0 },
    secondary: { id: '0', damage: 30, accuracy: 60, experience: 0 },
    melee: { id: '0', damage: 40, accuracy: 55, experience: 0 },
    temporary: { id: '0', damage: 60, accuracy: 45, experience: 0 },
  },
  armour: {
    head: { id: '0', armour: 10 },
    body: { id: '0', armour: 15 },
    hands: { id: '0', armour: 8 },
    legs: { id: '0', armour: 12 },
    feet: { id: '0', armour: 6 },
  },
  attackSettings: {
    primary: { setting: 1, reload: true },
    secondary: { setting: 0, reload: true },
    melee: { setting: 2, reload: false },
    temporary: { setting: 0, reload: false },
  },
  defendSettings: {
    primary: { setting: 100, reload: true },
    secondary: { setting: 0, reload: true },
    melee: { setting: 1, reload: false },
    temporary: { setting: 0, reload: false },
  },
  educationPerks: {
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
    ammocontrol2: false,
  },
  factionPerks: {
    accuracy: 0,
    damage: 0,
  },
  companyPerks: {
    name: 'None',
    star: 0,
  },
  propertyPerks: {
    damage: false,
  },
  meritPerks: {
    critrate: 0,
    primarymastery: 0,
    secondarymastery: 0,
    meleemastery: 0,
    temporarymastery: 0,
  },
}

export default function Home() {
  const [hero, setHero] = useState<Player>({ ...defaultPlayer, id: 1, name: '英雄' })
  const [villain, setVillain] = useState<Player>({ 
    ...defaultPlayer, 
    id: 2, 
    name: '反派',
    position: 'defend',
    attackSettings: {
      primary: { setting: 100, reload: true },
      secondary: { setting: 0, reload: true },
      melee: { setting: 1, reload: false },
      temporary: { setting: 0, reload: false },
    },
    defendSettings: {
      primary: { setting: 1, reload: true },
      secondary: { setting: 0, reload: true },
      melee: { setting: 2, reload: false },
      temporary: { setting: 0, reload: false },
    },
  })
  const [trials, setTrials] = useState(10000)
  const [results, setResults] = useState<SimulationResult | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [progress, setProgress] = useState(0)

  const transformPlayerForSimulation = (player: Player) => {
    return {
      name: player.name,
      id: player.id,
      life: player.life,
      battleStats: player.battleStats,
      passives: player.passives,
      weapons: player.weapons,
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

  const runSimulation = async () => {
    if (isSimulating) return
    
    setIsSimulating(true)
    setResults(null)
    setProgress(0)

    try {
      const worker = new Worker('/fightSimulator.js')
      
      const workerMsg = {
        fightControl: [hero.id, villain.id, trials],
        players: {
          [hero.id.toString()]: transformPlayerForSimulation(hero),
          [villain.id.toString()]: transformPlayerForSimulation(villain)
        },
        a: {}, 
        weapons: {}, 
        armours: {}, 
        m: {}, 
        t: {}, 
        companies: {}
      }
      
      worker.postMessage(workerMsg)
      
      worker.onmessage = function(e) {
        const currentProgress = (e.data.trials / trials) * 100
        setProgress(currentProgress)
        
        if (e.data.trials === trials) {
          const simulationResult: SimulationResult = {
            heroWins: e.data.results[0],
            villainWins: e.data.results[1],
            stalemates: e.data.results[2],
            totalTurns: e.data.results[3],
            heroLifeLeft: e.data.results[4],
            villainLifeLeft: e.data.results[5],
            fightLog: e.data.results[6] || [],
            heroLifeStats: e.data.results[8] || [],
            villainLifeStats: e.data.results[9] || [],
            trials: trials
          }
          
          setResults(simulationResult)
          worker.terminate()
          setIsSimulating(false)
          setProgress(100)
        }
      }
      
      worker.onerror = function(error) {
        console.error('Worker错误:', error)
        worker.terminate()
        setIsSimulating(false)
        alert('模拟过程中出现错误，请重试')
      }
      
    } catch (error) {
      console.error('模拟错误:', error)
      setIsSimulating(false)
      alert('模拟过程中出现错误，请重试')
    }
  }

  const copyHeroToVillain = () => {
    setVillain({
      ...hero,
      id: 2,
      name: '反派',
      position: 'defend',
    })
  }

  const copyVillainToHero = () => {
    setHero({
      ...villain,
      id: 1,
      name: '英雄',
      position: 'attack',
    })
  }

  return (
    <div className="space-y-8">
      {/* 控制面板 */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold mb-4">模拟设置</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模拟次数
            </label>
            <input
              type="number"
              value={trials}
              onChange={(e) => setTrials(Number(e.target.value))}
              className="input-field w-32"
              min="1"
              max="1000000"
              disabled={isSimulating}
            />
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            {isSimulating && (
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600">
                  进度: {progress.toFixed(1)}%
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-torn-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className={`btn-primary ${isSimulating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSimulating ? '模拟中...' : '开始模拟'}
            </button>
          </div>
        </div>
      </div>

      {/* 玩家配置 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PlayerConfig
          player={hero}
          onPlayerChange={setHero}
          title="英雄设置"
          copyAction={copyVillainToHero}
          copyLabel="复制反派设置"
        />
        <PlayerConfig
          player={villain}
          onPlayerChange={setVillain}
          title="反派设置"
          copyAction={copyHeroToVillain}
          copyLabel="复制英雄设置"
        />
      </div>

      {/* 结果显示 */}
      {results && (
        <SimulationResults results={results} heroName={hero.name} villainName={villain.name} />
      )}
    </div>
  )
} 