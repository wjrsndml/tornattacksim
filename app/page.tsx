'use client'

import { useState } from 'react'
import PlayerConfig from './components/PlayerConfig'
import SimulationResults from './components/SimulationResults'

interface Player {
  name: string
  life: number
  stats: {
    strength: number
    speed: number
    defense: number
    dexterity: number
  }
  weapons: {
    primary: {
      name: string
      damage: number
      accuracy: number
      category: string
      clipsize: number
      rateoffire: number[]
      experience?: number
    }
    secondary: {
      name: string
      damage: number
      accuracy: number
      category: string
      clipsize: number
      rateoffire: number[]
      experience?: number
    }
    melee: {
      name: string
      damage: number
      accuracy: number
      category: string
      clipsize: number
      rateoffire: number[]
      experience?: number
    }
    temporary: {
      name: string
      damage: number
      accuracy: number
      category: string
      clipsize: number
      rateoffire: number[]
      experience?: number
    }
  }
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

export default function Home() {
  const [player1, setPlayer1] = useState<Player>({
    name: '玩家1',
    life: 5000,
    stats: {
      strength: 1000,
      speed: 1000,
      defense: 1000,
      dexterity: 1000
    },
    weapons: {
      primary: {
        name: 'AK-47',
        damage: 300,
        accuracy: 75,
        category: 'Rifle',
        clipsize: 30,
        rateoffire: [1, 3],
        experience: 100
      },
      secondary: {
        name: 'Glock 18C',
        damage: 200,
        accuracy: 80,
        category: 'Pistol',
        clipsize: 17,
        rateoffire: [1, 2],
        experience: 50
      },
      melee: {
        name: 'Katana',
        damage: 400,
        accuracy: 85,
        category: 'Slashing',
        clipsize: 1,
        rateoffire: [1, 1],
        experience: 75
      },
      temporary: {
        name: 'Grenade',
        damage: 500,
        accuracy: 60,
        category: 'Temporary',
        clipsize: 1,
        rateoffire: [1, 1],
        experience: 0
      }
    }
  })

  const [player2, setPlayer2] = useState<Player>({
    name: '玩家2',
    life: 5000,
    stats: {
      strength: 1200,
      speed: 800,
      defense: 1100,
      dexterity: 900
    },
    weapons: {
      primary: {
        name: 'M4A1',
        damage: 280,
        accuracy: 80,
        category: 'Rifle',
        clipsize: 30,
        rateoffire: [1, 3],
        experience: 120
      },
      secondary: {
        name: 'Desert Eagle',
        damage: 350,
        accuracy: 70,
        category: 'Pistol',
        clipsize: 7,
        rateoffire: [1, 1],
        experience: 80
      },
      melee: {
        name: 'Baseball Bat',
        damage: 250,
        accuracy: 75,
        category: 'Clubbing',
        clipsize: 1,
        rateoffire: [1, 1],
        experience: 60
      },
      temporary: {
        name: 'Molotov Cocktail',
        damage: 300,
        accuracy: 70,
        category: 'Temporary',
        clipsize: 1,
        rateoffire: [1, 1],
        experience: 0
      }
    }
  })

  const [simulations, setSimulations] = useState(1000)
  const [results, setResults] = useState<SimulationResult | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [progress, setProgress] = useState(0)

  const runSimulation = async () => {
    setIsSimulating(true)
    setProgress(0)
    setResults(null)

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player1,
          player2,
          simulations
        })
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        throw new Error('模拟请求失败')
      }

      const data = await response.json()
      
      if (data.success) {
        setResults(data.results)
      } else {
        throw new Error(data.error || '模拟失败')
      }
    } catch (error) {
      console.error('模拟错误:', error)
      alert('模拟失败，请重试')
    } finally {
      setIsSimulating(false)
      setProgress(0)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-torn-primary mb-2">
          Torn 战斗模拟器
        </h1>
        <p className="text-gray-600">
          基于真实游戏数据的高精度战斗模拟系统
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <PlayerConfig
          player={player1}
          onChange={setPlayer1}
          title="玩家 1 (攻击方)"
        />
        <PlayerConfig
          player={player2}
          onChange={setPlayer2}
          title="玩家 2 (防守方)"
        />
      </div>

      <div className="card mb-8">
        <h3 className="text-xl font-semibold mb-4">模拟设置</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              模拟次数: {simulations.toLocaleString()}
            </label>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={simulations}
              onChange={(e) => setSimulations(parseInt(e.target.value))}
              className="w-full"
              aria-label="模拟次数"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>100</span>
              <span>10,000</span>
            </div>
          </div>

          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="btn-primary w-full py-3 text-lg font-semibold"
          >
            {isSimulating ? '模拟中...' : '开始模拟'}
          </button>

          {isSimulating && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-torn-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {results && (
        <SimulationResults results={results} />
      )}
    </div>
  )
} 