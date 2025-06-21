'use client'

import React, { useState, useEffect } from 'react'
import { getArmourList, loadGameData } from '../lib/dataLoader'
import { ArmourData } from '../lib/fightSimulatorTypes'

interface ArmourSelectorProps {
  armourType: 'head' | 'body' | 'hands' | 'legs' | 'feet'
  selectedArmour: ArmourData
  onArmourChange: (armour: ArmourData) => void
  label: string
}

export default function ArmourSelector({ armourType, selectedArmour, onArmourChange, label }: ArmourSelectorProps) {
  const [armours, setArmours] = useState<Array<{id: string, armour: ArmourData}>>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function loadArmours() {
      try {
        await loadGameData()
        const armourList = getArmourList(armourType)
        setArmours(armourList)
      } catch (error) {
        console.error('Failed to load armours:', error)
      } finally {
        setLoading(false)
      }
    }

    loadArmours()
  }, [armourType])

  const handleArmourSelect = (armourData: {id: string, armour: ArmourData}) => {
    onArmourChange(armourData.armour)
    setIsOpen(false)
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
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-torn-primary focus:border-transparent"
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">{selectedArmour.set}</div>
              <div className="text-xs text-gray-500">
                护甲值: {selectedArmour.armour}
                {selectedArmour.type && <span> • 类型: {selectedArmour.type}</span>}
              </div>
            </div>
            <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {armours.map((armourData) => (
              <button
                key={armourData.id}
                type="button"
                onClick={() => handleArmourSelect(armourData)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
              >
                <div className="font-medium">{armourData.armour.set}</div>
                <div className="text-xs text-gray-500">
                  护甲值: {armourData.armour.armour}
                  {armourData.armour.type && <span> • 类型: {armourData.armour.type}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 