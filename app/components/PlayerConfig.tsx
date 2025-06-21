'use client'

import React from 'react'
import { Player } from '../types'

interface PlayerConfigProps {
  player: Player
  onPlayerChange: (player: Player) => void
  title: string
  copyAction: () => void
  copyLabel: string
}

export default function PlayerConfig({ 
  player, 
  onPlayerChange, 
  title, 
  copyAction, 
  copyLabel 
}: PlayerConfigProps) {
  const updatePlayer = (updates: Partial<Player>) => {
    onPlayerChange({ ...player, ...updates })
  }

  const updateBattleStats = (stat: keyof Player['battleStats'], value: number) => {
    updatePlayer({
      battleStats: {
        ...player.battleStats,
        [stat]: value
      }
    })
  }

  const updatePassives = (stat: keyof Player['passives'], value: number) => {
    updatePlayer({
      passives: {
        ...player.passives,
        [stat]: value
      }
    })
  }

  const multiplyStats = (multiplier: number) => {
    updatePlayer({
      battleStats: {
        strength: Math.round(player.battleStats.strength * multiplier),
        speed: Math.round(player.battleStats.speed * multiplier),
        defense: Math.round(player.battleStats.defense * multiplier),
        dexterity: Math.round(player.battleStats.dexterity * multiplier),
      }
    })
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <button onClick={copyAction} className="btn-secondary text-sm">
          {copyLabel}
        </button>
      </div>

      <div className="space-y-6">
        {/* 基础属性 */}
        <div className="fieldset">
          <div className="legend">基础属性</div>
          <div className="flex gap-2 mb-4">
            <button 
              onClick={() => multiplyStats(10)} 
              className="btn-secondary text-sm"
            >
              10x 属性
            </button>
            <button 
              onClick={() => multiplyStats(0.1)} 
              className="btn-secondary text-sm"
            >
              1/10 属性
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                力量
              </label>
              <input
                type="number"
                value={player.battleStats.strength}
                onChange={(e) => updateBattleStats('strength', Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                防御
              </label>
              <input
                type="number"
                value={player.battleStats.defense}
                onChange={(e) => updateBattleStats('defense', Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                速度
              </label>
              <input
                type="number"
                value={player.battleStats.speed}
                onChange={(e) => updateBattleStats('speed', Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                敏捷
              </label>
              <input
                type="number"
                value={player.battleStats.dexterity}
                onChange={(e) => updateBattleStats('dexterity', Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              生命值
            </label>
            <input
              type="number"
              value={player.life}
              onChange={(e) => updatePlayer({ life: Number(e.target.value) })}
              className="input-field w-32"
            />
          </div>
        </div>

        {/* 被动加成 */}
        <div className="fieldset">
          <div className="legend">被动加成 (%)</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                力量
              </label>
              <input
                type="number"
                value={player.passives.strength}
                onChange={(e) => updatePassives('strength', Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                防御
              </label>
              <input
                type="number"
                value={player.passives.defense}
                onChange={(e) => updatePassives('defense', Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                速度
              </label>
              <input
                type="number"
                value={player.passives.speed}
                onChange={(e) => updatePassives('speed', Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                敏捷
              </label>
              <input
                type="number"
                value={player.passives.dexterity}
                onChange={(e) => updatePassives('dexterity', Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* 武器设置 */}
        <div className="fieldset">
          <div className="legend">武器</div>
          <div className="space-y-4">
            {['primary', 'secondary', 'melee', 'temporary'].map((weaponType) => (
              <div key={weaponType} className="border rounded p-3">
                <h4 className="font-semibold mb-2 capitalize">
                  {weaponType === 'primary' ? '主武器' : 
                   weaponType === 'secondary' ? '副武器' : 
                   weaponType === 'melee' ? '近战武器' : '临时武器'}
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      伤害
                    </label>
                    <input
                      type="number"
                      value={player.weapons[weaponType as keyof Player['weapons']].damage}
                      onChange={(e) => {
                        const weapon = { ...player.weapons[weaponType as keyof Player['weapons']] }
                        weapon.damage = Number(e.target.value)
                        updatePlayer({
                          weapons: {
                            ...player.weapons,
                            [weaponType]: weapon
                          }
                        })
                      }}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      精准度
                    </label>
                    <input
                      type="number"
                      value={player.weapons[weaponType as keyof Player['weapons']].accuracy}
                      onChange={(e) => {
                        const weapon = { ...player.weapons[weaponType as keyof Player['weapons']] }
                        weapon.accuracy = Number(e.target.value)
                        updatePlayer({
                          weapons: {
                            ...player.weapons,
                            [weaponType]: weapon
                          }
                        })
                      }}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      经验
                    </label>
                    <input
                      type="number"
                      value={player.weapons[weaponType as keyof Player['weapons']].experience}
                      onChange={(e) => {
                        const weapon = { ...player.weapons[weaponType as keyof Player['weapons']] }
                        weapon.experience = Number(e.target.value)
                        updatePlayer({
                          weapons: {
                            ...player.weapons,
                            [weaponType]: weapon
                          }
                        })
                      }}
                      className="input-field text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 护甲设置 */}
        <div className="fieldset">
          <div className="legend">护甲</div>
          <div className="grid grid-cols-2 gap-4">
            {['head', 'body', 'hands', 'legs', 'feet'].map((armourType) => (
              <div key={armourType}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {armourType === 'head' ? '头部' : 
                   armourType === 'body' ? '身体' : 
                   armourType === 'hands' ? '手部' : 
                   armourType === 'legs' ? '腿部' : '脚部'}
                </label>
                <input
                  type="number"
                  value={player.armour[armourType as keyof Player['armour']].armour}
                  onChange={(e) => {
                    const armour = { ...player.armour[armourType as keyof Player['armour']] }
                    armour.armour = Number(e.target.value)
                    updatePlayer({
                      armour: {
                        ...player.armour,
                        [armourType]: armour
                      }
                    })
                  }}
                  className="input-field"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 