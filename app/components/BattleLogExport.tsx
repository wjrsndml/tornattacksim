'use client'

import React, { useState } from 'react'

interface BattleLogData {
  battleNumber: number
  winner: string
  turns: number
  heroDamageDealt: number
  villainDamageDealt: number
  heroFinalLife: number
  villainFinalLife: number
  battleLog: string[]
}

interface BattleLogExportProps {
  allBattleLogs: BattleLogData[]
  player1Name: string
  player2Name: string
}

export default function BattleLogExport({ allBattleLogs, player1Name, player2Name }: BattleLogExportProps) {
  const [viewBattleNumber, setViewBattleNumber] = useState<string>('')
  const [selectedBattle, setSelectedBattle] = useState<BattleLogData | null>(null)

  const exportToCSV = () => {
    if (!allBattleLogs || allBattleLogs.length === 0) {
      alert('没有战斗日志可导出')
      return
    }

    // CSV 头部
    const headers = [
      '战斗编号',
      '胜利者',
      '回合数',
      `${player1Name}造成伤害`,
      `${player2Name}造成伤害`,
      `${player1Name}剩余生命`,
      `${player2Name}剩余生命`,
      '详细战斗日志'
    ]

    // 转换数据为CSV格式
    const csvData = allBattleLogs.map(battle => [
      battle.battleNumber,
      battle.winner,
      battle.turns,
      battle.heroDamageDealt,
      battle.villainDamageDealt,
      battle.heroFinalLife,
      battle.villainFinalLife,
      `"${battle.battleLog.join('; ')}"` // 用分号分隔日志条目，用引号包围以处理逗号
    ])

    // 创建CSV内容
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')

    // 创建并下载文件
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }) // 添加BOM以支持中文
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `battle_logs_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const viewBattleLog = () => {
    const battleNum = parseInt(viewBattleNumber)
    if (isNaN(battleNum) || battleNum < 1 || battleNum > allBattleLogs.length) {
      alert(`请输入有效的战斗编号 (1-${allBattleLogs.length})`)
      return
    }

    const battle = allBattleLogs.find(b => b.battleNumber === battleNum)
    if (battle) {
      setSelectedBattle(battle)
    } else {
      alert('找不到指定的战斗记录')
    }
  }

  // 解析日志信息并返回颜色样式（与SimulationResults中的逻辑相同）
  const getLogLineStyle = (message: string, battleResult: 'player1' | 'player2' | 'stalemate') => {
    // 检查是否是胜利/平局消息
    if (message.includes('won') || message.includes('Stalemate')) {
      if (message.includes(player1Name + ' won')) {
        return 'bg-green-200 border-l-4 border-green-500 text-green-800 font-semibold'
      } else if (message.includes(player2Name + ' won')) {
        return 'bg-red-200 border-l-4 border-red-500 text-red-800 font-semibold'
      } else if (message.includes('Stalemate')) {
        return 'bg-yellow-200 border-l-4 border-yellow-500 text-yellow-800 font-semibold'
      }
    }
    
    // 更精确地判断是谁的行动：检查消息开头
    const isPlayer1Action = message.startsWith(player1Name + ' ')
    const isPlayer2Action = message.startsWith(player2Name + ' ')
    
    // 基础背景色：攻击方=绿色，防守方=红色
    let baseStyle = ''
    if (isPlayer1Action) {
      baseStyle = 'bg-green-50 border-l-4 border-green-200'
    } else if (isPlayer2Action) {
      baseStyle = 'bg-red-50 border-l-4 border-red-200'
    }
    
    // 根据战斗结果调整颜色强度
    if (battleResult === 'player1') {
      // Player1赢了
      if (isPlayer1Action) {
        baseStyle = 'bg-green-100 border-l-4 border-green-400'
      } else if (isPlayer2Action) {
        baseStyle = 'bg-red-100 border-l-4 border-red-400'
      }
    } else if (battleResult === 'player2') {
      // Player2赢了  
      if (isPlayer1Action) {
        baseStyle = 'bg-red-100 border-l-4 border-red-400'
      } else if (isPlayer2Action) {
        baseStyle = 'bg-green-100 border-l-4 border-green-400'
      }
    } else if (battleResult === 'stalemate') {
      // 平局
      if (isPlayer1Action || isPlayer2Action) {
        baseStyle = 'bg-yellow-50 border-l-4 border-yellow-200'
      }
    }
    
    return baseStyle
  }

  if (!allBattleLogs || allBattleLogs.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* 导出功能 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-blue-800">战斗日志导出</h4>
            <p className="text-sm text-blue-600">
              共 {allBattleLogs.length.toLocaleString()} 场战斗日志可导出
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="btn-primary bg-blue-600 hover:bg-blue-700"
          >
            📊 导出CSV文件
          </button>
        </div>
        
        <div className="mt-3 text-xs text-blue-600">
          <p>导出的CSV文件包含以下列：</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>战斗编号、胜利者、回合数</li>
            <li>双方造成的伤害和剩余生命值</li>
            <li>完整的战斗日志详情</li>
          </ul>
        </div>
      </div>

      {/* 查看特定战斗日志 */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="text-lg font-semibold text-green-800 mb-4">查看战斗日志</h4>
        
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="battleNumber" className="text-sm font-medium text-green-700">
              战斗编号:
            </label>
            <input
              id="battleNumber"
              type="number"
              min="1"
              max={allBattleLogs.length}
              value={viewBattleNumber}
              onChange={(e) => setViewBattleNumber(e.target.value)}
              placeholder={`1-${allBattleLogs.length}`}
              className="w-24 px-2 py-1 border border-green-300 rounded text-sm"
            />
          </div>
          <button
            onClick={viewBattleLog}
            className="btn-primary bg-green-600 hover:bg-green-700 text-sm"
          >
            查看日志
          </button>
          {selectedBattle && (
            <button
              onClick={() => setSelectedBattle(null)}
              className="btn-secondary text-sm"
            >
              清除显示
            </button>
          )}
        </div>

        <p className="text-xs text-green-600 mb-4">
          输入战斗编号 (1-{allBattleLogs.length}) 来查看该场战斗的详细日志
        </p>

        {/* 显示选中的战斗日志 */}
        {selectedBattle && (
          <div className="card bg-white border border-green-300">
            <h5 className="text-lg font-semibold mb-3">
              第 {selectedBattle.battleNumber} 场战斗详情
            </h5>
            
            {/* 战斗统计信息 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-gray-50 rounded">
              <div className="text-center">
                <div className="text-sm text-gray-600">胜利者</div>
                <div className={`font-semibold ${
                  selectedBattle.winner === player1Name ? 'text-green-600' :
                  selectedBattle.winner === player2Name ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {selectedBattle.winner}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">回合数</div>
                <div className="font-semibold">{selectedBattle.turns}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">{player1Name}剩余生命</div>
                <div className="font-semibold text-green-600">{selectedBattle.heroFinalLife}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">{player2Name}剩余生命</div>
                <div className="font-semibold text-red-600">{selectedBattle.villainFinalLife}</div>
              </div>
            </div>

            {/* 颜色说明 */}
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
                  {selectedBattle.winner === 'Stalemate' && (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-yellow-100 border-l-4 border-yellow-400 rounded"></div>
                      <span className="text-gray-600">平局</span>
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium">
                  {selectedBattle.winner === player1Name && (
                    <span className="text-green-600">🏆 {player1Name} 获胜</span>
                  )}
                  {selectedBattle.winner === player2Name && (
                    <span className="text-red-600">🏆 {player2Name} 获胜</span>
                  )}
                  {selectedBattle.winner === 'Stalemate' && (
                    <span className="text-yellow-600">🤝 平局</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* 战斗日志 */}
            <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
              <div className="space-y-1 text-sm font-mono">
                {selectedBattle.battleLog.map((message, index) => {
                  const battleResult = selectedBattle.winner === player1Name ? 'player1' : 
                                     selectedBattle.winner === player2Name ? 'player2' : 'stalemate'
                  return (
                    <div 
                      key={index} 
                      className={`p-2 rounded-md transition-colors duration-200 ${getLogLineStyle(message, battleResult)}`}
                    >
                      {message}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 