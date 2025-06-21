'use client'

import React, { useState, useEffect } from 'react'
import { getWeaponList, loadGameData } from '../lib/dataLoader'
import { WeaponData } from '../lib/fightSimulatorTypes'
import ModSelector from './ModSelector'

interface WeaponSelectorProps {
  weaponType: 'primary' | 'secondary' | 'melee' | 'temporary'
  selectedWeapon: WeaponData
  onWeaponChange: (weapon: WeaponData) => void
  label: string
}

export default function WeaponSelector({ weaponType, selectedWeapon, onWeaponChange, label }: WeaponSelectorProps) {
  const [weapons, setWeapons] = useState<Array<{id: string, weapon: WeaponData}>>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function loadWeapons() {
      try {
        await loadGameData()
        const weaponList = getWeaponList(weaponType)
        setWeapons(weaponList)
      } catch (error) {
        console.error('Failed to load weapons:', error)
      } finally {
        setLoading(false)
      }
    }

    loadWeapons()
  }, [weaponType])

  const handleWeaponSelect = (weaponData: {id: string, weapon: WeaponData}) => {
    // 保留现有的改装（如果有的话）
    const updatedWeapon = {
      ...weaponData.weapon,
      mods: selectedWeapon.mods || []
    }
    onWeaponChange(updatedWeapon)
    setIsOpen(false)
  }

  const handleModsChange = (mods: string[]) => {
    const updatedWeapon = {
      ...selectedWeapon,
      mods
    }
    onWeaponChange(updatedWeapon)
  }

  // 判断武器是否支持改装（主武器和副武器支持改装）
  const supportsModifications = weaponType === 'primary' || weaponType === 'secondary'

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
        {supportsModifications && (
          <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 武器选择 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-torn-primary focus:border-transparent"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{selectedWeapon.name}</div>
                <div className="text-xs text-gray-500">
                  {selectedWeapon.category} • 伤害: {selectedWeapon.damage} • 精准: {selectedWeapon.accuracy}%
                  {selectedWeapon.bonus && (
                    <span className="ml-2 text-torn-secondary">• {selectedWeapon.bonus.name}</span>
                  )}
                </div>
              </div>
              <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {weapons.map((weaponData) => (
                <button
                  key={weaponData.id}
                  type="button"
                  onClick={() => handleWeaponSelect(weaponData)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                >
                  <div className="font-medium">{weaponData.weapon.name}</div>
                  <div className="text-xs text-gray-500">
                    {weaponData.weapon.category} • 伤害: {weaponData.weapon.damage} • 精准: {weaponData.weapon.accuracy}%
                    {weaponData.weapon.clipsize > 0 && <span> • 弹夹: {weaponData.weapon.clipsize}</span>}
                    {weaponData.weapon.bonus && (
                      <span className="ml-2 text-torn-secondary">• {weaponData.weapon.bonus.name}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 改装选择（仅主武器和副武器支持） */}
      {supportsModifications && (
        <ModSelector
          selectedMods={selectedWeapon.mods || []}
          onModsChange={handleModsChange}
          maxMods={2}
          label="武器改装"
        />
      )}

      {/* 武器经验值 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">武器经验值</label>
        <input
          type="number"
          value={selectedWeapon.experience || 0}
          onChange={(e) => {
            const experience = parseInt(e.target.value) || 0
            const updatedWeapon = { ...selectedWeapon, experience }
            onWeaponChange(updatedWeapon)
          }}
          className="input w-full"
          min="0"
          max="100"
          placeholder="0-100"
          aria-label={`${label}经验值`}
        />
        <div className="text-xs text-gray-500">
          经验值影响精准度和伤害加成
        </div>
      </div>

      {/* 武器属性调整（临时武器除外） */}
      {weaponType !== 'temporary' && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">武器伤害</label>
            <input
              type="number"
              value={selectedWeapon.damage || 0}
              onChange={(e) => {
                const damage = parseFloat(e.target.value) || 0
                const updatedWeapon = { ...selectedWeapon, damage }
                onWeaponChange(updatedWeapon)
              }}
              className="input w-full"
              min="0"
              max="1000"
              step="0.1"
              placeholder="伤害值"
              aria-label={`${label}伤害`}
            />
            <div className="text-xs text-gray-500">
              武器的基础伤害值
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">武器精准</label>
            <input
              type="number"
              value={selectedWeapon.accuracy || 0}
              onChange={(e) => {
                const accuracy = parseFloat(e.target.value) || 0
                const updatedWeapon = { ...selectedWeapon, accuracy }
                onWeaponChange(updatedWeapon)
              }}
              className="input w-full"
              min="0"
              max="200"
              step="0.1"
              placeholder="精准值"
              aria-label={`${label}精准`}
            />
            <div className="text-xs text-gray-500">
              武器的基础精准值
            </div>
          </div>
        </>
      )}

      {/* 弹药类型（仅主武器和副武器支持） */}
      {supportsModifications && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">弹药类型</label>
          <select
            value={selectedWeapon.ammo || 'Standard'}
            onChange={(e) => {
              const ammo = e.target.value
              const updatedWeapon = { ...selectedWeapon, ammo }
              onWeaponChange(updatedWeapon)
            }}
            className="input w-full"
            aria-label={`${label}弹药类型`}
          >
            <option value="Standard">标准弹药</option>
            <option value="TR">追踪弹 (TR) - 精准+10</option>
            <option value="PI">穿甲弹 (PI) - 穿甲x2</option>
            <option value="HP">空心弹 (HP) - 伤害+50%, 穿甲/1.5</option>
            <option value="IN">燃烧弹 (IN) - 伤害+40%</option>
          </select>
        </div>
      )}
    </div>
  )
} 