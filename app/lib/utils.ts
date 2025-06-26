import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// 数字格式化：添加千分位逗号
export function formatNumber(num: number): string {
	return num.toLocaleString();
}

// 计算数字的量级字母
export function getNumberScale(num: number): string {
	if (num >= 1e15) return "Q"; // Quintillion
	if (num >= 1e12) return "T"; // Trillion
	if (num >= 1e9) return "B"; // Billion
	if (num >= 1e6) return "M"; // Million
	if (num >= 1e3) return "K"; // Thousand
	return "";
}

// 解析带逗号的数字字符串
export function parseFormattedNumber(str: string): number {
	const cleanStr = str.replace(/,/g, "");
	const parsed = Number.parseInt(cleanStr, 10);
	return Number.isNaN(parsed) ? 0 : parsed;
}
