'use client'

import React, { useState, useEffect } from 'react'
import { getArmourCoverage, getAllArmourSets, loadGameData } from '../lib/dataLoader'
import { ArmourCoverageData } from '../lib/fightSimulatorTypes'

interface ArmourCoverageProps {
  playerArmour: {
    head: { set: string }
    body: { set: string }
    hands: { set: string }
    legs: { set: string }
    feet: { set: string }
  }
}

export default function ArmourCoverage({ playerArmour }: ArmourCoverageProps) {
  const [coverageData, setCoverageData] = useState<ArmourCoverageData>({})
  const [allSets, setAllSets] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    async function loadCoverageData() {
      try {
        await loadGameData()
        const coverage = getArmourCoverage()
        const sets = getAllArmourSets()
        setCoverageData(coverage)
        setAllSets(sets)
      } catch (error) {
        console.error('Failed to load armour coverage data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCoverageData()
  }, [])

  // 获取护甲显示名称
  const getArmourDisplayName = (armour: { set: string }) => {
    if (armour.set === "n/a" || !armour.set) {
      return "无护甲"
    }
    return armour.set
  }

  // 获取玩家当前装备的所有护甲套装
  const playerSets = new Set([
    playerArmour.head.set,
    playerArmour.body.set,
    playerArmour.hands.set,
    playerArmour.legs.set,
    playerArmour.feet.set
  ])

  // 检查玩家是否能抵御特定临时武器
  const canPlayerBlock = (temporaryWeapon: string): boolean => {
    const blockedBy = coverageData[temporaryWeapon] || []
    if (!Array.isArray(blockedBy)) return false
    return blockedBy.some(armourSet => playerSets.has(armourSet))
  }

  // 获取能阻挡临时武器的护甲套装
  const getBlockingSets = (temporaryWeapon: string): string[] => {
    return coverageData[temporaryWeapon] || []
  }

  // 获取临时武器的显示名称
  const getWeaponDisplayName = (weapon: string): string => {
    const weaponNames: { [key: string]: string } = {
      'Tear Gas': '催泪瓦斯',
      'Smoke Grenade': '烟雾弹',
      'Flashbang': '闪光弹',
      'HE Grenade': '高爆手榴弹',
      'Concussion Grenade': '震撼弹',
      'Pepper Spray': '胡椒喷雾',
      'Brick': '砖块',
      'Sand': '沙子',
      'Claymore': '阔剑地雷'
    }
    return weaponNames[weapon] || weapon
  }

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  const temporaryWeapons = Object.keys(coverageData)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-semibold text-gray-800">护甲覆盖系统</h4>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn-secondary text-sm"
        >
          {isExpanded ? '收起' : '展开'}
        </button>
      </div>

      <div className="text-xs text-gray-600 mb-4">
        显示不同护甲套装对临时武器的防护效果
      </div>

      {/* 当前玩家防护状态概览 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h5 className="text-sm font-semibold text-gray-700 mb-2">当前防护状态</h5>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {temporaryWeapons.slice(0, isExpanded ? temporaryWeapons.length : 6).map(weapon => {
            const canBlock = canPlayerBlock(weapon)
            return (
              <div key={weapon} className="flex items-center justify-between">
                <span>{getWeaponDisplayName(weapon)}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  canBlock 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {canBlock ? '可防护' : '无防护'}
                </span>
              </div>
            )
          })}
          {!isExpanded && temporaryWeapons.length > 6 && (
            <div className="col-span-2 text-center text-gray-500">
              还有 {temporaryWeapons.length - 6} 种武器...
            </div>
          )}
        </div>
      </div>

      {/* 详细覆盖信息 */}
      {isExpanded && (
        <div className="space-y-4">
          <h5 className="text-sm font-semibold text-gray-700">详细防护信息</h5>
          
          {temporaryWeapons.map(weapon => {
            const blockingSets = getBlockingSets(weapon)
            const canBlock = canPlayerBlock(weapon)
            
            return (
              <div key={weapon} className="border-l-4 border-gray-200 pl-3">
                <div className="flex items-center justify-between mb-2">
                  <h6 className="font-medium text-gray-800">{getWeaponDisplayName(weapon)}</h6>
                  <span className={`px-2 py-1 rounded text-xs ${
                    canBlock 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {canBlock ? '可防护' : '无防护'}
                  </span>
                </div>
                
                {blockingSets.length > 0 ? (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">可防护护甲套装：</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {blockingSets.map(armourSet => {
                        const playerHas = playerSets.has(armourSet)
                        return (
                          <span
                            key={armourSet}
                            className={`px-2 py-1 rounded text-xs ${
                              playerHas 
                                ? 'bg-blue-100 text-blue-800 font-medium' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {armourSet}
                            {playerHas && ' ✓'}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-red-600">
                    无护甲可防护此武器
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 当前装备的护甲套装 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h5 className="text-sm font-semibold text-gray-700 mb-2">当前装备护甲</h5>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>头部: <span className="font-medium">{getArmourDisplayName(playerArmour.head)}</span></div>
          <div>身体: <span className="font-medium">{getArmourDisplayName(playerArmour.body)}</span></div>
          <div>手部: <span className="font-medium">{getArmourDisplayName(playerArmour.hands)}</span></div>
          <div>腿部: <span className="font-medium">{getArmourDisplayName(playerArmour.legs)}</span></div>
          <div>脚部: <span className="font-medium">{getArmourDisplayName(playerArmour.feet)}</span></div>
        </div>
      </div>
    </div>
  )
} 