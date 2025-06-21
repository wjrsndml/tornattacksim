'use client'

import React from 'react'

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

interface PlayerConfigProps {
  player: Player
  onChange: (player: Player) => void
  title: string
}

export default function PlayerConfig({ player, onChange, title }: PlayerConfigProps) {
  const updatePlayer = (updates: Partial<Player>) => {
    onChange({ ...player, ...updates })
  }

  const updateStats = (stat: keyof Player['stats'], value: number) => {
    updatePlayer({
      stats: {
        ...player.stats,
        [stat]: value
      }
    })
  }

  const updateWeapon = (weaponType: keyof Player['weapons'], field: string, value: any) => {
    updatePlayer({
      weapons: {
        ...player.weapons,
        [weaponType]: {
          ...player.weapons[weaponType],
          [field]: value
        }
      }
    })
  }

  const multiplyStats = (multiplier: number) => {
    updatePlayer({
      stats: {
        strength: Math.round(player.stats.strength * multiplier),
        speed: Math.round(player.stats.speed * multiplier),
        defense: Math.round(player.stats.defense * multiplier),
        dexterity: Math.round(player.stats.dexterity * multiplier),
      }
    })
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>

      <div className="space-y-6">
        {/* 基础信息 */}
        <div>
          <label className="block text-sm font-medium mb-2">玩家名称</label>
          <input
            type="text"
            value={player.name}
            onChange={(e) => updatePlayer({ name: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">生命值</label>
          <input
            type="number"
            value={player.life}
            onChange={(e) => updatePlayer({ life: Number(e.target.value) })}
            className="input-field"
          />
        </div>

        {/* 属性 */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">战斗属性</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => multiplyStats(10)} 
                className="btn-secondary text-xs px-2 py-1"
              >
                ×10
              </button>
              <button 
                onClick={() => multiplyStats(0.1)} 
                className="btn-secondary text-xs px-2 py-1"
              >
                ÷10
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">力量</label>
              <input
                type="number"
                value={player.stats.strength}
                onChange={(e) => updateStats('strength', Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">速度</label>
              <input
                type="number"
                value={player.stats.speed}
                onChange={(e) => updateStats('speed', Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">防御</label>
              <input
                type="number"
                value={player.stats.defense}
                onChange={(e) => updateStats('defense', Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">敏捷</label>
              <input
                type="number"
                value={player.stats.dexterity}
                onChange={(e) => updateStats('dexterity', Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* 武器 */}
        <div>
          <h3 className="font-medium mb-3">武器配置</h3>
          <div className="space-y-4">
            {Object.entries(player.weapons).map(([weaponType, weapon]) => (
              <div key={weaponType} className="border rounded-lg p-3">
                <h4 className="font-medium mb-2 capitalize">
                  {weaponType === 'primary' ? '主武器' : 
                   weaponType === 'secondary' ? '副武器' :
                   weaponType === 'melee' ? '近战武器' : '临时武器'}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">名称</label>
                    <input
                      type="text"
                      value={weapon.name}
                      onChange={(e) => updateWeapon(weaponType as keyof Player['weapons'], 'name', e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">类别</label>
                    <input
                      type="text"
                      value={weapon.category}
                      onChange={(e) => updateWeapon(weaponType as keyof Player['weapons'], 'category', e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">伤害</label>
                    <input
                      type="number"
                      value={weapon.damage}
                      onChange={(e) => updateWeapon(weaponType as keyof Player['weapons'], 'damage', Number(e.target.value))}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">精准度</label>
                    <input
                      type="number"
                      value={weapon.accuracy}
                      onChange={(e) => updateWeapon(weaponType as keyof Player['weapons'], 'accuracy', Number(e.target.value))}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">弹夹容量</label>
                    <input
                      type="number"
                      value={weapon.clipsize}
                      onChange={(e) => updateWeapon(weaponType as keyof Player['weapons'], 'clipsize', Number(e.target.value))}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">经验值</label>
                    <input
                      type="number"
                      value={weapon.experience || 0}
                      onChange={(e) => updateWeapon(weaponType as keyof Player['weapons'], 'experience', Number(e.target.value))}
                      className="input-field text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 