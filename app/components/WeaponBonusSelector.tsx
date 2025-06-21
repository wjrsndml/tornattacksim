'use client'

import React, { useState, useEffect } from 'react'
import { WeaponData, SelectedWeaponBonus, WeaponBonus } from '../lib/fightSimulatorTypes'
import { getAvailableBonusesForWeapon, getWeaponBonus } from '../lib/weaponBonuses'

interface WeaponBonusSelectorProps {
  weapon: WeaponData
  onBonusesChange: (bonuses: SelectedWeaponBonus[]) => void
  playerId: string
  weaponType: string
}

export default function WeaponBonusSelector({ weapon, onBonusesChange, playerId, weaponType }: WeaponBonusSelectorProps) {
  const [selectedBonuses, setSelectedBonuses] = useState<SelectedWeaponBonus[]>(weapon.weaponBonuses || [])
  const [availableBonuses, setAvailableBonuses] = useState<WeaponBonus[]>([])

  // 当武器变化时，更新可用特效列表
  useEffect(() => {
    const bonuses = getAvailableBonusesForWeapon(weapon.category)
    setAvailableBonuses(bonuses)
    
    // 如果当前选择的特效不适用于新武器，清空选择
    const validBonuses = selectedBonuses.filter(selected => 
      bonuses.some(bonus => bonus.name === selected.name)
    )
    
    if (validBonuses.length !== selectedBonuses.length) {
      setSelectedBonuses(validBonuses)
      onBonusesChange(validBonuses)
    }
  }, [weapon.category])

  // 更新选中的特效
  useEffect(() => {
    setSelectedBonuses(weapon.weaponBonuses || [])
  }, [weapon.weaponBonuses])

  const handleAddBonus = () => {
    if (selectedBonuses.length >= 2) return // 最多两个特效
    
    setSelectedBonuses([...selectedBonuses, { name: '', value: 0 }])
  }

  const handleRemoveBonus = (index: number) => {
    const newBonuses = selectedBonuses.filter((_, i) => i !== index)
    setSelectedBonuses(newBonuses)
    onBonusesChange(newBonuses)
  }

  const handleBonusNameChange = (index: number, bonusName: string) => {
    const newBonuses = [...selectedBonuses]
    const bonusInfo = getWeaponBonus(bonusName)
    
    newBonuses[index] = {
      name: bonusName,
      value: bonusInfo ? bonusInfo.minValue : 0 // 默认为最小值
    }
    
    setSelectedBonuses(newBonuses)
    onBonusesChange(newBonuses)
  }

  const handleBonusValueChange = (index: number, value: number) => {
    const newBonuses = [...selectedBonuses]
    newBonuses[index].value = value
    setSelectedBonuses(newBonuses)
    onBonusesChange(newBonuses)
  }

  const getUsedBonusNames = () => {
    return selectedBonuses.map(bonus => bonus.name).filter(name => name !== '')
  }

  const getAvailableOptions = (currentIndex: number) => {
    const usedNames = getUsedBonusNames()
    const currentName = selectedBonuses[currentIndex]?.name
    
    return availableBonuses.filter(bonus => 
      !usedNames.includes(bonus.name) || bonus.name === currentName
    )
  }

  const getBonusTypeColor = (type: string) => {
    switch (type) {
      case 'Buff': return 'text-green-600'
      case 'Enemy Debuff': return 'text-red-600'
      case 'DOT': return 'text-orange-600'
      case 'De-Buff': return 'text-yellow-600'
      case 'Buff / De-Buff': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  if (availableBonuses.length === 0) {
    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">武器特效</h4>
        <p className="text-sm text-gray-500">此武器类别暂无可用特效</p>
      </div>
    )
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">武器特效</h4>
        {selectedBonuses.length < 2 && (
          <button
            type="button"
            onClick={handleAddBonus}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            添加特效
          </button>
        )}
      </div>

      {selectedBonuses.map((selectedBonus, index) => {
        const bonusInfo = getWeaponBonus(selectedBonus.name)
        const availableOptions = getAvailableOptions(index)

        return (
          <div key={index} className="mb-3 p-3 border border-gray-200 rounded">
            <div className="flex items-center gap-2 mb-2">
              <select
                value={selectedBonus.name}
                onChange={(e) => handleBonusNameChange(index, e.target.value)}
                className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                title={`选择第${index + 1}个武器特效`}
                aria-label={`选择第${index + 1}个武器特效`}
              >
                <option value="">选择特效...</option>
                {availableOptions.map(bonus => (
                  <option key={bonus.name} value={bonus.name}>
                    {bonus.name} ({bonus.type})
                  </option>
                ))}
              </select>
              
              <button
                type="button"
                onClick={() => handleRemoveBonus(index)}
                className="text-red-500 hover:text-red-700 text-xs px-2 py-1"
                title={`删除第${index + 1}个武器特效`}
              >
                删除
              </button>
            </div>

            {bonusInfo && (
              <>
                <div className="mb-2">
                  <p className="text-xs text-gray-600 mb-1">
                    <span className={getBonusTypeColor(bonusInfo.type)}>
                      [{bonusInfo.type}]
                    </span>
                    {' '}{bonusInfo.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor={`bonus-value-${playerId}-${weaponType}-${index}`} className="text-xs text-gray-600">数值:</label>
                  <input
                    id={`bonus-value-${playerId}-${weaponType}-${index}`}
                    type="number"
                    min={bonusInfo.minValue}
                    max={bonusInfo.maxValue}
                    value={selectedBonus.value}
                    onChange={(e) => handleBonusValueChange(index, parseInt(e.target.value) || bonusInfo.minValue)}
                    className="w-16 text-xs border border-gray-300 rounded px-2 py-1"
                    title={`设置${bonusInfo.name}特效数值`}
                  />
                  <span className="text-xs text-gray-500">
                    ({bonusInfo.minValue} - {bonusInfo.maxValue}{bonusInfo.unit})
                  </span>
                </div>
              </>
            )}
          </div>
        )
      })}

      {selectedBonuses.length === 0 && (
        <p className="text-xs text-gray-500 italic">暂无选择的武器特效</p>
      )}
    </div>
  )
} 