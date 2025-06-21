'use client'

import React from 'react'
import { SimulationResult } from '../types'

interface SimulationResultsProps {
  results: SimulationResult
  heroName: string
  villainName: string
}

export default function SimulationResults({ 
  results, 
  heroName, 
  villainName 
}: SimulationResultsProps) {
  const heroWinRate = ((results.heroWins / results.trials) * 100).toFixed(2)
  const villainWinRate = ((results.villainWins / results.trials) * 100).toFixed(2)
  const stalemateRate = ((results.stalemates / results.trials) * 100).toFixed(2)
  const avgTurns = (results.totalTurns / results.trials).toFixed(2)

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-bold mb-6">模拟结果</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">
            {results.heroWins.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">{heroName} 获胜</div>
          <div className="text-lg font-semibold text-green-600">
            {heroWinRate}%
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-red-600">
            {results.villainWins.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">{villainName} 获胜</div>
          <div className="text-lg font-semibold text-red-600">
            {villainWinRate}%
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-600">
            {results.stalemates.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">平局</div>
          <div className="text-lg font-semibold text-yellow-600">
            {stalemateRate}%
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">
            {avgTurns}
          </div>
          <div className="text-sm text-gray-600">平均回合数</div>
          <div className="text-lg font-semibold text-blue-600">
            回合
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-4">胜率对比</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{heroName}</span>
                <span>{heroWinRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${heroWinRate}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{villainName}</span>
                <span>{villainWinRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full" 
                  style={{ width: `${villainWinRate}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>平局</span>
                <span>{stalemateRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full" 
                  style={{ width: `${stalemateRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-4">详细统计</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>总模拟次数:</span>
              <span className="font-semibold">{results.trials.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>总回合数:</span>
              <span className="font-semibold">{results.totalTurns.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>平均回合数:</span>
              <span className="font-semibold">{avgTurns}</span>
            </div>
            <div className="flex justify-between">
              <span>{heroName} 平均剩余生命:</span>
              <span className="font-semibold">
                {(results.heroLifeLeft / results.trials).toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{villainName} 平均剩余生命:</span>
              <span className="font-semibold">
                {(results.villainLifeLeft / results.trials).toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {results.fightLog && results.fightLog.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">战斗日志样例</h3>
          <div className="bg-gray-100 rounded-lg p-4 max-h-64 overflow-y-auto">
            <div className="text-sm font-mono space-y-1">
              {results.fightLog.slice(0, 20).map((log, index) => (
                <div key={index} className="text-gray-700">
                  {log}
                </div>
              ))}
              {results.fightLog.length > 20 && (
                <div className="text-gray-500 italic">
                  ... 还有 {results.fightLog.length - 20} 条日志
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 