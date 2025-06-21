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
}

export default function SimulationResults({ results }: SimulationResultsProps) {
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
          <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
            <div className="space-y-1 text-sm font-mono">
              {lastFightLog.map((message, index) => (
                <div key={index} className="text-gray-700">
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