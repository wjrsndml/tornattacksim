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
      <body className="min-h-screen bg-white font-sans antialiased">
        <header className="border-b border-slate-200 bg-white shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-slate-900">Torn 战斗模拟器</h1>
          </div>
        </header>
        
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        
        <footer className="border-t border-slate-200 bg-slate-50 py-8 mt-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          </div>
        </footer>
      </body>
    </html>
  )
} 