import { startLogging, stopLogging } from "./reportLogger";
import { runBasicBonusTests } from "./testCases/basicBonuses.test";
import { runProbabilityBonusTests } from "./testCases/probabilityBonuses.test";

// 测试配置接口
interface TestConfig {
	runBasic?: boolean;
	runProbability?: boolean;
	runConditional?: boolean;
	runStatus?: boolean;
	runComplex?: boolean;
	verbose?: boolean;
	quick?: boolean;
}

// 默认测试配置
const DEFAULT_CONFIG: TestConfig = {
	runBasic: true,
	runProbability: true,
	runConditional: true,
	runStatus: true,
	runComplex: true,
	verbose: false,
	quick: false,
};

// 主测试运行器
export async function runAllWeaponBonusTests(
	config: TestConfig = DEFAULT_CONFIG,
): Promise<void> {
	// 启动日志记录
	const logger = startLogging({
		filePrefix: "weapon-test",
		enableConsole: true,
		enableFile: true,
		timestampFormat: "simple",
	});

	console.log("🎮 武器特效自动化测试套件");
	console.log("=".repeat(50));

	const startTime = new Date();
	let testCount = 0;

	try {
		// 基础特效测试
		if (config.runBasic) {
			console.log("\n📦 运行基础特效测试...");
			await runBasicBonusTests();
			testCount++;
		}

		// 概率特效测试
		if (config.runProbability) {
			console.log("\n🎲 运行概率特效测试...");
			await runProbabilityBonusTests();
			testCount++;
		}

		// 条件特效测试（暂未实现）
		if (config.runConditional) {
			console.log("\n🎯 条件特效测试（待实现）...");
			// await runConditionalBonusTests();
		}

		// 状态特效测试（暂未实现）
		if (config.runStatus) {
			console.log("\n💫 状态特效测试（待实现）...");
			// await runStatusBonusTests();
		}

		// 复杂特效测试（暂未实现）
		if (config.runComplex) {
			console.log("\n⚙️  复杂特效测试（待实现）...");
			// await runComplexBonusTests();
		}
	} catch (error) {
		console.error("\n❌ 测试运行过程中出现错误:");
		console.error(error);
		stopLogging();
		process.exit(1);
	}

	const endTime = new Date();

	// 生成性能报告
	logger.logPerformanceReport(startTime, endTime, testCount);

	console.log("\n" + "=".repeat(50));
	console.log("🏁 测试套件执行完成");
	console.log(`📊 执行了 ${testCount} 个测试模块`);
	console.log(
		`⏱️  总耗时: ${((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2)} 秒`,
	);
	console.log("=".repeat(50));

	// 生成报告文件（暂时使用空数组，后续版本将收集实际测试结果）
	logger.generateHtmlReport([]);
	logger.generateJsonReport([]);

	// 完成日志记录
	stopLogging();
}

// 快速测试模式
export async function runQuickTests(): Promise<void> {
	console.log("⚡ 快速测试模式");

	const quickConfig: TestConfig = {
		runBasic: true,
		runProbability: true,
		runConditional: false,
		runStatus: false,
		runComplex: false,
		quick: true,
	};

	await runAllWeaponBonusTests(quickConfig);
}

// 只运行基础测试
export async function runBasicTestsOnly(): Promise<void> {
	console.log("📦 仅运行基础特效测试");

	const basicConfig: TestConfig = {
		runBasic: true,
		runProbability: false,
		runConditional: false,
		runStatus: false,
		runComplex: false,
	};

	await runAllWeaponBonusTests(basicConfig);
}

// 只运行概率测试
export async function runProbabilityTestsOnly(): Promise<void> {
	console.log("🎲 仅运行概率特效测试");

	const probabilityConfig: TestConfig = {
		runBasic: false,
		runProbability: true,
		runConditional: false,
		runStatus: false,
		runComplex: false,
	};

	await runAllWeaponBonusTests(probabilityConfig);
}

// 测试特定特效
export async function testSpecificBonus(
	bonusName: string,
	value?: number,
): Promise<void> {
	console.log(`🔍 测试特定特效: ${bonusName}${value ? `(${value}%)` : ""}`);

	// 这里可以根据特效名称调用相应的测试函数
	// 暂时使用基础测试作为示例
	console.log("特定特效测试功能待完善...");
}

// 生成测试报告
export function generateTestReport(): void {
	console.log("📄 生成测试报告功能待实现...");

	// 未来可以实现：
	// 1. HTML格式的详细报告
	// 2. JSON格式的机器可读报告
	// 3. 覆盖率统计
	// 4. 性能基准测试结果
	// 5. 历史测试结果对比
}

// 命令行接口
export function parseCommandLineArgs(): TestConfig {
	const args = process.argv.slice(2);
	const config: TestConfig = { ...DEFAULT_CONFIG };

	for (const arg of args) {
		switch (arg.toLowerCase()) {
			case "--quick":
			case "-q":
				config.quick = true;
				break;
			case "--basic":
			case "-b":
				config.runBasic = true;
				config.runProbability = false;
				config.runConditional = false;
				config.runStatus = false;
				config.runComplex = false;
				break;
			case "--probability":
			case "-p":
				config.runBasic = false;
				config.runProbability = true;
				config.runConditional = false;
				config.runStatus = false;
				config.runComplex = false;
				break;
			case "--verbose":
			case "-v":
				config.verbose = true;
				break;
			case "--help":
			case "-h":
				printHelp();
				process.exit(0);
				break;
		}
	}

	return config;
}

// 打印帮助信息
function printHelp(): void {
	console.log(`
武器特效测试套件

用法:
  npm run test:weapons [选项]

选项:
  -q, --quick        快速测试模式（降低测试精度但提高速度）
  -b, --basic        仅运行基础特效测试
  -p, --probability  仅运行概率特效测试
  -v, --verbose      详细输出模式
  -h, --help         显示此帮助信息

示例:
  npm run test:weapons                # 运行所有测试
  npm run test:weapons --quick        # 快速测试
  npm run test:weapons --basic        # 仅基础测试
  npm run test:weapons --probability  # 仅概率测试
	`);
}

// 如果直接运行此文件
if (require.main === module) {
	const config = parseCommandLineArgs();

	if (config.quick) {
		runQuickTests().catch(console.error);
	} else {
		runAllWeaponBonusTests(config).catch(console.error);
	}
}

// 导出主要函数供其他模块使用
export { runAllWeaponBonusTests as default };
export type { TestConfig };
