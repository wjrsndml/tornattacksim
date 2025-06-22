'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'

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

  // 解析日志信息并返回颜色样式（使用更柔和的颜色）
  const getLogLineStyle = (message: string, battleResult: 'player1' | 'player2' | 'stalemate') => {
    // 检查是否是胜利/平局消息
    if (message.includes('won') || message.includes('Stalemate')) {
      if (message.includes(player1Name + ' won')) {
        return 'p-2 rounded-md text-sm transition-colors bg-green-50 border-l-4 border-green-200 text-green-800 font-medium'
      } else if (message.includes(player2Name + ' won')) {
        return 'p-2 rounded-md text-sm transition-colors bg-red-50 border-l-4 border-red-200 text-red-800 font-medium'
      } else if (message.includes('Stalemate')) {
        return 'p-2 rounded-md text-sm transition-colors bg-yellow-50 border-l-4 border-yellow-200 text-yellow-800 font-medium'
      }
    }
    
    // 更精确地判断是谁的行动：检查消息开头
    const isPlayer1Action = message.startsWith(player1Name + ' ')
    const isPlayer2Action = message.startsWith(player2Name + ' ')
    
    // 基础背景色：使用更柔和的颜色
    let baseStyle = 'p-2 rounded-md text-sm transition-colors'
    if (isPlayer1Action) {
      baseStyle += ' bg-green-50/50 border-l-4 border-green-100'
    } else if (isPlayer2Action) {
      baseStyle += ' bg-red-50/50 border-l-4 border-red-100'
    }
    
    // 根据战斗结果调整颜色强度
    if (battleResult === 'player1') {
      // Player1赢了
      if (isPlayer1Action) {
        baseStyle = baseStyle.replace('bg-green-50/50 border-green-100', 'bg-green-50 border-green-200')
      } else if (isPlayer2Action) {
        baseStyle = baseStyle.replace('bg-red-50/50 border-red-100', 'bg-red-50 border-red-200')
      }
    } else if (battleResult === 'player2') {
      // Player2赢了  
      if (isPlayer1Action) {
        baseStyle = baseStyle.replace('bg-green-50/50 border-green-100', 'bg-red-50 border-red-200')
      } else if (isPlayer2Action) {
        baseStyle = baseStyle.replace('bg-red-50/50 border-red-100', 'bg-green-50 border-green-200')
      }
    } else if (battleResult === 'stalemate') {
      // 平局
      if (isPlayer1Action || isPlayer2Action) {
        baseStyle = baseStyle.replace(/bg-(green|red)-50\/50 border-(green|red)-100/, 'bg-yellow-50/50 border-yellow-100')
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>战斗日志导出</span>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200">
              {allBattleLogs.length.toLocaleString()} 场战斗
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">
                共 {allBattleLogs.length.toLocaleString()} 场战斗日志可导出
              </p>
            </div>
            <Button onClick={exportToCSV} className="bg-blue-600 hover:bg-blue-700 text-white">
              📊 导出CSV文件
            </Button>
          </div>
          
          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200">
            <p className="font-medium mb-2">导出的CSV文件包含以下列：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>战斗编号、胜利者、回合数</li>
              <li>双方造成的伤害和剩余生命值</li>
              <li>完整的战斗日志详情</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 查看特定战斗日志 */}
      <Card>
        <CardHeader>
          <CardTitle>查看战斗日志</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="battleNumber" className="text-sm font-medium">
                战斗编号:
              </Label>
              <Input
                id="battleNumber"
                type="number"
                min="1"
                max={allBattleLogs.length}
                value={viewBattleNumber}
                onChange={(e) => setViewBattleNumber(e.target.value)}
                placeholder={`1-${allBattleLogs.length}`}
                className="w-32"
              />
            </div>
            <Button onClick={viewBattleLog} variant="outline">
              查看日志
            </Button>
            {selectedBattle && (
              <Button 
                onClick={() => setSelectedBattle(null)} 
                variant="ghost"
                size="sm"
              >
                清除
              </Button>
            )}
          </div>

          {/* 显示选中的战斗日志 */}
          {selectedBattle && (
            <div className="space-y-4">
              <Separator />
              
              {/* 战斗统计 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center space-y-1">
                  <div className="text-sm text-slate-600">战斗编号</div>
                  <div className="text-lg font-semibold">#{selectedBattle.battleNumber}</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-sm text-slate-600">胜利者</div>
                  <Badge className={selectedBattle.winner === player1Name ? 
                    "bg-green-50 text-green-700 border-green-200" : 
                    "bg-red-50 text-red-700 border-red-200"
                  }>
                    {selectedBattle.winner}
                  </Badge>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-sm text-slate-600">回合数</div>
                  <div className="text-lg font-semibold">{selectedBattle.turns}</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-sm text-slate-600">伤害对比</div>
                  <div className="text-sm">
                    <div className="text-green-600">{selectedBattle.heroDamageDealt}</div>
                    <div className="text-red-600">{selectedBattle.villainDamageDealt}</div>
                  </div>
                </div>
              </div>

              {/* 战斗日志 */}
              <div>
                <h4 className="font-medium mb-3">详细战斗日志</h4>
                <div className="space-y-2 max-h-80 overflow-y-auto bg-slate-50/50 p-4 rounded-md border border-slate-200">
                  {selectedBattle.battleLog.map((message, index) => {
                    const battleResult = selectedBattle.winner === player1Name ? 'player1' : 
                                       selectedBattle.winner === player2Name ? 'player2' : 'stalemate'
                    return (
                      <div
                        key={index}
                        className={getLogLineStyle(message, battleResult)}
                      >
                        {message}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 