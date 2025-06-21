'use client'

import React, { useState, useEffect, useRef } from 'react'

interface BattleLogEntry {
  turn: number
  attacker: string
  action: string
  target: string
  damage: number
  weapon: string
  bodyPart: string
  effect?: string
  timestamp: number
}

interface BattleLogProps {
  logs: BattleLogEntry[]
  isActive: boolean
  onClear: () => void
  player1Name?: string  // Attacker名称
  player2Name?: string  // Defender名称
  battleResult?: 'player1' | 'player2' | 'stalemate' | null  // 战斗结果
}

export default function BattleLog({ logs, isActive, onClear, player1Name = 'Attacker', player2Name = 'Defender', battleResult }: BattleLogProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const formatAction = (entry: BattleLogEntry) => {
    const damageText = entry.damage > 0 ? `造成 ${entry.damage} 伤害` : '未命中'
    const bodyPartText = entry.bodyPart ? ` (${entry.bodyPart})` : ''
    const effectText = entry.effect ? ` [${entry.effect}]` : ''
    
    return `${entry.attacker} 使用 ${entry.weapon} 对 ${entry.target} 进行${entry.action}，${damageText}${bodyPartText}${effectText}`
  }

  const getLogColor = (entry: BattleLogEntry) => {
    if (entry.damage === 0) return 'text-gray-500'
    if (entry.damage > 100) return 'text-red-600 font-bold'
    if (entry.damage > 50) return 'text-orange-600'
    return 'text-blue-600'
  }

  const getLogBackgroundColor = (entry: BattleLogEntry) => {
    const isAttackerAction = entry.attacker === player1Name
    const isDefenderAction = entry.attacker === player2Name
    
    // 基础背景色：攻击方=绿色，防守方=红色
    let baseColor = ''
    if (isAttackerAction) {
      baseColor = 'bg-green-50 border-l-4 border-green-200'
    } else if (isDefenderAction) {
      baseColor = 'bg-red-50 border-l-4 border-red-200'
    }
    
    // 如果有战斗结果，根据结果调整颜色强度
    if (battleResult) {
      if (battleResult === 'player1') {
        // Attacker赢了
        if (isAttackerAction) {
          baseColor = 'bg-green-100 border-l-4 border-green-400'
        } else if (isDefenderAction) {
          baseColor = 'bg-red-100 border-l-4 border-red-400'
        }
      } else if (battleResult === 'player2') {
        // Defender赢了  
        if (isAttackerAction) {
          baseColor = 'bg-red-100 border-l-4 border-red-400'
        } else if (isDefenderAction) {
          baseColor = 'bg-green-100 border-l-4 border-green-400'
        }
      } else if (battleResult === 'stalemate') {
        // 平局
        baseColor = 'bg-yellow-50 border-l-4 border-yellow-200'
      }
    }
    
    return baseColor
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">战斗日志</h3>
        <div className="flex items-center space-x-2">
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="mr-1"
            />
            自动滚动
          </label>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-secondary text-sm"
          >
            {isExpanded ? '收起' : '展开'}
          </button>
          <button
            onClick={onClear}
            className="btn-secondary text-sm"
            disabled={logs.length === 0}
          >
            清空
          </button>
        </div>
      </div>

      {/* 战斗结果和颜色说明 */}
      {logs.length > 0 && (
        <div className="mb-4 p-3 bg-gray-100 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 border-l-4 border-green-400 rounded"></div>
                <span className="text-gray-600">{player1Name} 攻击</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 border-l-4 border-red-400 rounded"></div>
                <span className="text-gray-600">{player2Name} 反击</span>
              </div>
              {battleResult === 'stalemate' && (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-100 border-l-4 border-yellow-400 rounded"></div>
                  <span className="text-gray-600">平局</span>
                </div>
              )}
            </div>
            {battleResult && (
              <div className="text-sm font-medium">
                {battleResult === 'player1' && (
                  <span className="text-green-600">🏆 {player1Name} 获胜</span>
                )}
                {battleResult === 'player2' && (
                  <span className="text-red-600">🏆 {player2Name} 获胜</span>
                )}
                {battleResult === 'stalemate' && (
                  <span className="text-yellow-600">🤝 平局</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`bg-gray-50 rounded-lg p-4 ${isExpanded ? 'max-h-96' : 'max-h-48'} overflow-y-auto transition-all duration-300`}>
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {isActive ? '战斗进行中...' : '暂无战斗记录'}
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((entry, index) => (
              <div 
                key={index} 
                className={`text-sm font-mono p-2 rounded-md transition-colors duration-200 ${getLogBackgroundColor(entry)}`}
              >
                <span className="text-gray-400 mr-2">回合{entry.turn}:</span>
                <span className={getLogColor(entry)}>
                  {formatAction(entry)}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}
      </div>

      {logs.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          共 {logs.length} 条记录
        </div>
      )}
    </div>
  )
} 