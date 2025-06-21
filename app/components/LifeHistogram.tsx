'use client'

import React, { useState, useMemo } from 'react'

interface LifeHistogramProps {
  lifeData: number[] // 每次战斗结束时的生命值
  playerName: string
  totalFights: number
}

export default function LifeHistogram({ lifeData, playerName, totalFights }: LifeHistogramProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [binSize, setBinSize] = useState(50)

  const histogram = useMemo(() => {
    if (lifeData.length === 0) return []

    const maxLife = Math.max(...lifeData)
    const minLife = Math.min(...lifeData)
    const range = maxLife - minLife
    const numBins = Math.max(1, Math.ceil(range / binSize))
    
    const bins = Array(numBins).fill(0).map((_, i) => ({
      min: minLife + i * binSize,
      max: minLife + (i + 1) * binSize,
      count: 0,
      percentage: 0
    }))

    lifeData.forEach(life => {
      const binIndex = Math.min(Math.floor((life - minLife) / binSize), numBins - 1)
      bins[binIndex].count++
    })

    bins.forEach(bin => {
      bin.percentage = (bin.count / lifeData.length) * 100
    })

    return bins
  }, [lifeData, binSize])

  const maxCount = Math.max(...histogram.map(bin => bin.count))

  const downloadCSV = () => {
    const csvContent = [
      'Life Range,Count,Percentage',
      ...histogram.map(bin => 
        `"${bin.min}-${bin.max}",${bin.count},${bin.percentage.toFixed(2)}%`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${playerName}_life_distribution.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isVisible) {
    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">生命值分布</h3>
          <button
            onClick={() => setIsVisible(true)}
            className="btn-primary"
            disabled={lifeData.length === 0}
          >
            显示分布图
          </button>
        </div>
        <div className="text-sm text-gray-600 mt-2">
          数据点: {lifeData.length} / {totalFights}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{playerName} 生命值分布</h3>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">
            区间大小:
            <select
              value={binSize}
              onChange={(e) => setBinSize(parseInt(e.target.value))}
              className="ml-1 px-2 py-1 border rounded"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </label>
          <button
            onClick={downloadCSV}
            className="btn-secondary text-sm"
            disabled={histogram.length === 0}
          >
            下载 CSV
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="btn-secondary text-sm"
          >
            隐藏
          </button>
        </div>
      </div>

      {histogram.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          暂无数据
        </div>
      ) : (
        <div className="space-y-4">
          {/* 统计信息 */}
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <div className="font-semibold text-blue-800">总战斗数</div>
              <div className="text-blue-600">{lifeData.length}</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="font-semibold text-green-800">平均生命值</div>
              <div className="text-green-600">
                {(lifeData.reduce((a, b) => a + b, 0) / lifeData.length).toFixed(1)}
              </div>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <div className="font-semibold text-red-800">最低生命值</div>
              <div className="text-red-600">{Math.min(...lifeData)}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="font-semibold text-purple-800">最高生命值</div>
              <div className="text-purple-600">{Math.max(...lifeData)}</div>
            </div>
          </div>

          {/* 直方图 */}
          <div className="bg-white border rounded-lg p-4">
            <div className="space-y-2">
              {histogram.map((bin, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-20 text-xs text-gray-600 text-right">
                    {bin.min}-{bin.max}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(bin.count / maxCount) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      {bin.count > 0 && (
                        <span>{bin.count} ({bin.percentage.toFixed(1)}%)</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 