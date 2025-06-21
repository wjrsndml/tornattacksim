'use client'

import React, { useState, useEffect } from 'react'
import { getModList, getModData, loadGameData } from '../lib/dataLoader'
import { ModData } from '../lib/fightSimulatorTypes'

interface ModSelectorProps {
  selectedMods: string[]
  onModsChange: (mods: string[]) => void
  maxMods?: number
  label: string
}

export default function ModSelector({ selectedMods, onModsChange, maxMods = 3, label }: ModSelectorProps) {
  const [availableMods, setAvailableMods] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  // 确保selectedMods始终是数组
  const safeSelectedMods = Array.isArray(selectedMods) ? selectedMods : []

  useEffect(() => {
    async function loadMods() {
      try {
        await loadGameData()
        const modList = getModList()
        setAvailableMods(modList)
      } catch (error) {
        console.error('Failed to load mods:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMods()
  }, [])

  const handleModToggle = (modName: string) => {
    const currentMods = [...safeSelectedMods]
    const modIndex = currentMods.indexOf(modName)
    
    if (modIndex >= 0) {
      // 移除改装
      currentMods.splice(modIndex, 1)
    } else if (currentMods.length < maxMods) {
      // 添加改装
      currentMods.push(modName)
    }
    
    onModsChange(currentMods)
  }

  const getModDescription = (modName: string): string => {
    const modData = getModData(modName)
    if (!modData) return ''
    
    const effects: string[] = []
    if (modData.acc_bonus !== 0) effects.push(`精准${modData.acc_bonus > 0 ? '+' : ''}${modData.acc_bonus}`)
    if (modData.dmg_bonus !== 0) effects.push(`伤害${modData.dmg_bonus > 0 ? '+' : ''}${modData.dmg_bonus}`)
    if (modData.crit_chance !== 0) effects.push(`暴击${modData.crit_chance > 0 ? '+' : ''}${modData.crit_chance}%`)
    if (modData.clip_size_multi !== 0) effects.push(`弹夹${modData.clip_size_multi > 0 ? '+' : ''}${(modData.clip_size_multi * 100).toFixed(0)}%`)
    if (modData.extra_clips !== 0) effects.push(`额外弹夹${modData.extra_clips > 0 ? '+' : ''}${modData.extra_clips}`)
    if (modData.rate_of_fire_multi !== 0) effects.push(`射速${modData.rate_of_fire_multi > 0 ? '+' : ''}${(modData.rate_of_fire_multi * 100).toFixed(0)}%`)
    if (modData.dex_passive !== 0) effects.push(`敏捷${modData.dex_passive > 0 ? '+' : ''}${modData.dex_passive}`)
    
    return effects.join(' • ')
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} ({safeSelectedMods.length}/{maxMods})
      </label>
      
      {/* 已选择的改装 */}
      {safeSelectedMods.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {safeSelectedMods.map((modName) => (
            <span
              key={modName}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-torn-primary text-white"
            >
              {modName}
              <button
                type="button"
                onClick={() => handleModToggle(modName)}
                className="ml-1 hover:text-gray-300"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-torn-primary focus:border-transparent"
          disabled={safeSelectedMods.length >= maxMods}
        >
          <div className="flex justify-between items-center">
            <span className="text-gray-500">
              {safeSelectedMods.length >= maxMods ? '已达到最大改装数' : '选择改装...'}
            </span>
            <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {availableMods.map((modName) => {
              const isSelected = safeSelectedMods.includes(modName)
              const canSelect = !isSelected && safeSelectedMods.length < maxMods
              
              return (
                <button
                  key={modName}
                  type="button"
                  onClick={() => handleModToggle(modName)}
                  disabled={!isSelected && !canSelect}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                    isSelected ? 'bg-torn-primary/10 text-torn-primary' : 
                    !canSelect ? 'text-gray-400 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="font-medium">{modName}</div>
                  <div className="text-xs text-gray-500">
                    {getModDescription(modName)}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 