import React from 'react'
import './globals.css'

export const metadata = {
  title: 'Torn Battle Simulator',
  description: '一个用于Torn游戏的战斗模拟器',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="bg-torn-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">Torn 战斗模拟器</h1>
            <p className="text-torn-100 mt-2">
              由 Proxima 开发，811 维护的战斗模拟器
            </p>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        
        <footer className="bg-gray-800 text-white py-8 mt-16">
          <div className="container mx-auto px-4 text-center">
            <p>&copy; 2024 Torn Battle Simulator. 所有权利保留.</p>
            <p className="text-gray-400 mt-2">
              如果遇到模拟错误，请联系 811
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
} 