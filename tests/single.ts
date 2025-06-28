#!/usr/bin/env tsx
import { BONUS_TEST_DATA } from "./mockData";
import {
	formatTestResult,
	testBonusEffect,
	testProbabilityBonus,
} from "./testUtils";

// 特效名称到类型的映射
const BONUS_TYPE_MAP: Record<string, string> = {
	// 基础特效 (Basic Bonuses)
	Powerful: "basic",
	Empower: "basic",
	Quicken: "basic",
	Deadeye: "basic",
	Expose: "basic",
	Conserve: "basic",
	Specialist: "basic",
	Penetrate: "basic",
	Bloodlust: "basic",

	// 概率特效 (Probability Bonuses)
	Puncture: "probability",
	"Sure Shot": "probability",
	Deadly: "probability",
	"Double Tap": "probability",
	Fury: "probability",
	"Double-edged": "probability",
	Stun: "probability",
	"Home Run": "probability",
	Parry: "probability",

	// 条件特效 (Conditional Bonuses)
	Crusher: "conditional",
	Cupid: "conditional",
	Achilles: "conditional",
	Throttle: "conditional",
	Roshambo: "conditional",
	Blindside: "conditional",
	Comeback: "conditional",
	Assassinate: "conditional",
	Backstab: "conditional",

	// 状态特效 (Status Effects)
	Disarm: "status",
	Slow: "status",
	Cripple: "status",
	Weaken: "status",
	Wither: "status",
	Eviscerate: "status",
	Motivation: "status",
	Bleed: "status",
	Paralyzed: "status",
	Suppress: "status",
	Irradiate: "status",

	// 复杂特效 (Complex Bonuses)
	Execute: "complex",
	Berserk: "complex",
	Grace: "complex",
	Frenzy: "complex",
	Focus: "complex",
	Finale: "complex",
	"Wind-up": "complex",
	Rage: "complex",
	Smurf: "complex",
};

// 测试单个特效
function runSingleBonusTest(bonusName: string): void {
	console.log(`🎯 开始测试单个特效: ${bonusName}\n`);

	// 检查特效是否存在
	const bonusType = BONUS_TYPE_MAP[bonusName];
	if (!bonusType) {
		console.error(`❌ 未知的特效名称: ${bonusName}`);
		console.log("可用的特效包括:");
		Object.keys(BONUS_TYPE_MAP).forEach((bonus) => {
			console.log(`   - ${bonus} (${BONUS_TYPE_MAP[bonus]})`);
		});
		return;
	}

	// 查找特效的测试数据
	const typeData = BONUS_TEST_DATA[bonusType as keyof typeof BONUS_TEST_DATA];
	const bonusData = typeData?.find((b) => b.name === bonusName);

	if (!bonusData) {
		console.error(`❌ 未找到特效 ${bonusName} 的测试数据`);
		return;
	}

	console.log(`📋 特效类型: ${bonusType}`);
	console.log(`🔢 测试数值: [${bonusData.values.join(", ")}]`);
	console.log(`-`.repeat(50));

	let passedTests = 0;
	let totalTests = 0;

	// 根据特效类型选择测试策略
	const isProbabilityBonus = bonusType === "probability";

	// 测试每个数值
	for (const value of bonusData.values) {
		totalTests++;
		console.log(`\n🧪 测试 ${bonusName} = ${value}%`);

		try {
			if (isProbabilityBonus) {
				// 概率特效使用专门的概率测试
				const result = testProbabilityBonus(bonusName, value, 500, 0.1);
				console.log(formatTestResult(result));

				if (result.withinTolerance) {
					passedTests++;
					console.log(
						`✅ 概率测试通过 (${result.triggerCount}/${result.iterations} = ${(result.actualRate * 100).toFixed(1)}%)`,
					);
				} else {
					console.log(
						`❌ 概率测试失败 (期望: ${(result.expectedRate * 100).toFixed(1)}%, 实际: ${(result.actualRate * 100).toFixed(1)}%)`,
					);
				}
			} else {
				// 其他特效使用常规测试
				const testConfig: any = {};

				// 为条件特效添加特殊配置
				if (bonusType === "conditional" && "bodyPart" in bonusData) {
					testConfig.bodyPart = (bonusData as any).bodyPart;
				}
				if (bonusType === "conditional" && "condition" in bonusData) {
					const condition = (bonusData as any).condition;
					if (condition === "first_turn") {
						testConfig.turn = 1;
					} else if (condition === "low_health") {
						testConfig.attacker = { life: 200, maxLife: 1000 };
					} else if (condition === "full_health") {
						testConfig.target = { life: 1000, maxLife: 1000 };
					}
				}

				const result = testBonusEffect(bonusName, value, testConfig);
				console.log(formatTestResult(result));

				if (result.success) {
					passedTests++;
					console.log(`✅ 测试通过`);
				} else {
					console.log(`❌ 测试失败: ${result.error || "未知错误"}`);
				}
			}
		} catch (error) {
			console.error(`❌ 测试执行出错: ${error}`);
		}
	}

	// 输出总结
	console.log(`\n${"=".repeat(50)}`);
	console.log(`📊 ${bonusName} 测试总结:`);
	console.log(`   总测试数: ${totalTests}`);
	console.log(`   通过测试: ${passedTests}`);
	console.log(`   失败测试: ${totalTests - passedTests}`);
	console.log(`   成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

	if (passedTests === totalTests) {
		console.log(`🎉 ${bonusName} 特效测试全部通过！`);
	} else {
		console.log(
			`⚠️  ${bonusName} 特效测试有 ${totalTests - passedTests} 个失败`,
		);
	}
	console.log(`${"=".repeat(50)}`);
}

// 列出所有可用的特效
function listAvailableBonuses(): void {
	console.log("📋 可用的武器特效列表:\n");

	const categories = {
		"基础特效 (Basic Bonuses)": Object.keys(BONUS_TYPE_MAP).filter(
			(name) => BONUS_TYPE_MAP[name] === "basic",
		),
		"概率特效 (Probability Bonuses)": Object.keys(BONUS_TYPE_MAP).filter(
			(name) => BONUS_TYPE_MAP[name] === "probability",
		),
		"条件特效 (Conditional Bonuses)": Object.keys(BONUS_TYPE_MAP).filter(
			(name) => BONUS_TYPE_MAP[name] === "conditional",
		),
		"状态特效 (Status Effects)": Object.keys(BONUS_TYPE_MAP).filter(
			(name) => BONUS_TYPE_MAP[name] === "status",
		),
		"复杂特效 (Complex Bonuses)": Object.keys(BONUS_TYPE_MAP).filter(
			(name) => BONUS_TYPE_MAP[name] === "complex",
		),
	};

	for (const [category, bonuses] of Object.entries(categories)) {
		console.log(`📦 ${category}:`);
		bonuses.forEach((bonus) => {
			console.log(`   - ${bonus}`);
		});
		console.log();
	}

	console.log(`📊 总计: ${Object.keys(BONUS_TYPE_MAP).length} 个特效`);
}

const bonusName = process.argv[2];

if (!bonusName) {
	console.log("❌ 请提供特效名称");
	console.log("使用方法: npm run single <特效名称>");
	console.log("\n📋 可用特效列表:");
	listAvailableBonuses();
	process.exit(1);
}

runSingleBonusTest(bonusName);
