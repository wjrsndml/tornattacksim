import { Swords } from "lucide-react";
import type React from "react";
import "./globals.css";

export const metadata = {
	title: "Torn Battle Simulator",
	description: "一个用于Torn游戏的战斗模拟器",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="zh-CN">
			<body className="min-h-screen bg-white font-sans antialiased">
				<header className="border-b border-slate-200 bg-white shadow-sm">
					<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
						<div className="text-center">
							<h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center justify-center gap-2">
								<Swords className="w-6 h-6 text-slate-700" />
								Torn 战斗模拟器
							</h1>
						</div>
					</div>
				</header>

				<main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
					{children}
				</main>

				<footer className="border-t border-slate-200 bg-slate-50 py-8 mt-16">
					<div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center"></div>
				</footer>
			</body>
		</html>
	);
}
