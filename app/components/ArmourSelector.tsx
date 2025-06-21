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

  const getArmourTypeLabel = (type: string) => {
    switch (type) {
      case 'head': return '头部'
      case 'body': return '身体'
      case 'hands': return '手部'
      case 'legs': return '腿部'
      case 'feet': return '脚部'
      default: return type
    }
  }

  const getArmourRating = (armour: number) => {
    if (armour >= 50) return { text: '极佳', color: 'text-purple-600' }
    if (armour >= 30) return { text: '优秀', color: 'text-blue-600' }
    if (armour >= 20) return { text: '良好', color: 'text-green-600' }
    if (armour >= 10) return { text: '一般', color: 'text-yellow-600' }
    return { text: '较差', color: 'text-red-600' }
  }

  const getDisplayName = (armour: ArmourData) => {
    if (armour.set === "n/a" || !armour.set) {
      return armour.type || "无护甲"
    }
    return armour.set
  }

  const getDisplayInfo = (armour: ArmourData) => {
    if (armour.set === "n/a" || !armour.set) {
      return armour.type || "无护甲"
    }
    return `${armour.set}${armour.type ? ` (${armour.type})` : ''}`
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
      </div>
    )
  }

  const rating = getArmourRating(selectedArmour.armour)

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
              <div className="font-medium">{getDisplayName(selectedArmour)}</div>
              <div className="text-xs text-gray-500">
                护甲值: {selectedArmour.armour} • 
                <span className={`ml-1 ${rating.color}`}>{rating.text}</span>
              </div>
            </div>
            <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {armours.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-sm">无可用护甲</div>
            ) : (
              armours.map((armourData) => {
                const itemRating = getArmourRating(armourData.armour.armour)
                return (
                  <button
                    key={armourData.id}
                    type="button"
                    onClick={() => handleArmourSelect(armourData)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                      getDisplayName(selectedArmour) === getDisplayName(armourData.armour) ? 'bg-torn-primary bg-opacity-10' : ''
                    }`}
                  >
                    <div className="font-medium">{getDisplayName(armourData.armour)}</div>
                    <div className="text-xs text-gray-500">
                      护甲值: {armourData.armour.armour} • 
                      <span className={`ml-1 ${itemRating.color}`}>{itemRating.text}</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
} 