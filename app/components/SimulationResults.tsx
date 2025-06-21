'use client'

import React from 'react'

interface SimulationResult {
  totalSimulations: number
  heroWins: number
  villainWins: number
  stalemates: number
  heroWinRate: number
  villainWinRate: number
  stalemateRate: number
  averageTurns: number
  averageHeroLifeRemaining: number
  averageVillainLifeRemaining: number
  lastFightLog: string[]
  heroLifeDistribution: number[]
  villainLifeDistribution: number[]
}

interface SimulationResultsProps {
  results: SimulationResult
  player1Name?: string  // Attacker名称
  player2Name?: string  // Defender名称
}

export default function SimulationResults({ results, player1Name = 'Attacker', player2Name = 'Defender' }: SimulationResultsProps) {
  const {
    totalSimulations,
    heroWins,
    villainWins,
    stalemates,
    heroWinRate,
    villainWinRate,
    stalemateRate,
    averageTurns,
    averageHeroLifeRemaining,
    averageVillainLifeRemaining,
    lastFightLog
  } = results

  // 确定战斗结果
  const getBattleResult = (): 'player1' | 'player2' | 'stalemate' => {
    if (heroWinRate > villainWinRate) {
      return 'player1'
    } else if (villainWinRate > heroWinRate) {
      return 'player2'
    } else {
      return 'stalemate'
    }
  }

  // 解析日志信息并返回颜色样式
  const getLogLineStyle = (message: string) => {
    const battleResult = getBattleResult()
    
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

  return (
    <div className="space-y-6">
      {/* 总体统计 */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4">模拟结果</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {heroWins.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">玩家1胜利</div>
            <div className="text-lg font-semibold text-green-600">
              {heroWinRate.toFixed(1)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {villainWins.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">玩家2胜利</div>
            <div className="text-lg font-semibold text-red-600">
              {villainWinRate.toFixed(1)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {stalemates.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">平局</div>
            <div className="text-lg font-semibold text-gray-600">
              {stalemateRate.toFixed(1)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {averageTurns.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">平均回合数</div>
          </div>
        </div>
      </div>

      {/* 胜率图表 */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4">胜率分布</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="w-20 text-sm font-medium">玩家1</div>
            <div className="flex-1 bg-gray-200 rounded-full h-6 mx-3">
              <div
                className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2"
                style={{ width: `${heroWinRate}%` }}
              >
                <span className="text-white text-xs font-medium">
                  {heroWinRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-16 text-sm text-right">
              {heroWins.toLocaleString()}
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="w-20 text-sm font-medium">玩家2</div>
            <div className="flex-1 bg-gray-200 rounded-full h-6 mx-3">
              <div
                className="bg-red-500 h-6 rounded-full flex items-center justify-end pr-2"
                style={{ width: `${villainWinRate}%` }}
              >
                <span className="text-white text-xs font-medium">
                  {villainWinRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-16 text-sm text-right">
              {villainWins.toLocaleString()}
            </div>
          </div>
          
          {stalemates > 0 && (
            <div className="flex items-center">
              <div className="w-20 text-sm font-medium">平局</div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 mx-3">
                <div
                  className="bg-gray-500 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${stalemateRate}%` }}
                >
                  <span className="text-white text-xs font-medium">
                    {stalemateRate.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-16 text-sm text-right">
                {stalemates.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 详细统计 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">战斗统计</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>总模拟次数：</span>
              <span className="font-medium">{totalSimulations.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>平均回合数：</span>
              <span className="font-medium">{averageTurns.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>玩家1平均剩余生命：</span>
              <span className="font-medium">{averageHeroLifeRemaining.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>玩家2平均剩余生命：</span>
              <span className="font-medium">{averageVillainLifeRemaining.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-3">胜率分析</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>玩家1胜率：</span>
              <span className="font-medium text-green-600">{heroWinRate.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span>玩家2胜率：</span>
              <span className="font-medium text-red-600">{villainWinRate.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span>平局率：</span>
              <span className="font-medium text-gray-600">{stalemateRate.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span>胜率差：</span>
              <span className={`font-medium ${heroWinRate > villainWinRate ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(heroWinRate - villainWinRate).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 最后一场战斗日志 */}
      {lastFightLog && lastFightLog.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">最后一场战斗日志</h3>
          
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
                {getBattleResult() === 'stalemate' && (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-100 border-l-4 border-yellow-400 rounded"></div>
                    <span className="text-gray-600">平局</span>
                  </div>
                )}
              </div>
              <div className="text-sm font-medium">
                {getBattleResult() === 'player1' && (
                  <span className="text-green-600">🏆 {player1Name} 胜率更高</span>
                )}
                {getBattleResult() === 'player2' && (
                  <span className="text-red-600">🏆 {player2Name} 胜率更高</span>
                )}
                {getBattleResult() === 'stalemate' && (
                  <span className="text-yellow-600">🤝 胜率相等</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
            <div className="space-y-1 text-sm font-mono">
              {lastFightLog.map((message, index) => (
                <div 
                  key={index} 
                  className={`p-2 rounded-md transition-colors duration-200 ${getLogLineStyle(message)}`}
                >
                  {message}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 