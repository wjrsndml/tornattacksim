import { startLogging, stopLogging, TestReportLogger } from "./reportLogger";
import type { TestResult, TestSuite } from "./testUtils";

// 创建模拟测试数据
function createMockTestSuite(
	name: string,
	passCount: number,
	failCount: number,
): TestSuite {
	const results: TestResult[] = [];

	// 添加通过的测试
	for (let i = 0; i < passCount; i++) {
		results.push({
			bonusName: `Pass_Test_${i + 1}`,
			success: true,
			details: {
				expected: 100,
				actual: 100,
				message: "测试通过",
			},
		});
	}

	// 添加失败的测试
	for (let i = 0; i < failCount; i++) {
		results.push({
			bonusName: `Fail_Test_${i + 1}`,
			success: false,
			error: "模拟测试失败",
			details: {
				expected: 100,
				actual: 50,
				message: "实际值与期望值不符",
			},
		});
	}

	const total = passCount + failCount;

	return {
		name,
		results,
		summary: {
			total,
			passed: passCount,
			failed: failCount,
			successRate: total > 0 ? passCount / total : 0,
		},
	};
}

// 演示基本日志功能
function demonstrateBasicLogging(): void {
	console.log("\n=== 基本日志功能演示 ===");

	const logger = new TestReportLogger({
		filePrefix: "demo-basic",
		timestampFormat: "simple",
	});

	logger.log("这是一条普通日志信息");
	logger.info("这是一条信息日志");
	logger.warn("这是一条警告日志");
	logger.error("这是一条错误日志");

	logger.finalize();
	console.log(`日志文件路径: ${logger.getLogFilePath()}`);
}

// 演示控制台劫持功能
function demonstrateConsoleCapture(): void {
	console.log("\n=== 控制台劫持功能演示 ===");

	// 直接启动日志捕获，无需保存返回值
	startLogging({
		filePrefix: "demo-capture",
		timestampFormat: "simple",
	});

	console.log("这条消息会同时显示在控制台和日志文件中");
	console.info("信息消息");
	console.warn("警告消息");
	console.error("错误消息");

	// 模拟一些测试输出
	console.log("🎮 开始武器特效测试...");
	console.log("✅ Powerful 特效测试通过");
	console.log("❌ Puncture 特效测试失败");
	console.log("📊 测试完成，成功率: 50%");

	stopLogging();
}

// 演示测试套件报告
function demonstrateTestSuiteReporting(): void {
	console.log("\n=== 测试套件报告演示 ===");

	const logger = new TestReportLogger({
		filePrefix: "demo-suite",
		timestampFormat: "simple",
	});

	// 创建多个模拟测试套件
	const basicSuite = createMockTestSuite("基础特效测试", 8, 2);
	const probabilitySuite = createMockTestSuite("概率特效测试", 6, 4);
	const conditionalSuite = createMockTestSuite("条件特效测试", 5, 1);

	// 记录测试套件
	logger.logTestSuite(basicSuite);
	logger.logTestSuite(probabilitySuite);
	logger.logTestSuite(conditionalSuite);

	// 生成性能报告
	const startTime = new Date(Date.now() - 30000); // 30秒前
	const endTime = new Date();
	logger.logPerformanceReport(startTime, endTime, 30);

	logger.finalize();
	console.log(`日志文件路径: ${logger.getLogFilePath()}`);
}

// 演示HTML和JSON报告生成
function demonstrateReportGeneration(): void {
	console.log("\n=== 报告生成演示 ===");

	const logger = new TestReportLogger({
		filePrefix: "demo-reports",
		timestampFormat: "simple",
	});

	// 创建测试套件数据
	const suites = [
		createMockTestSuite("基础特效测试", 10, 2),
		createMockTestSuite("概率特效测试", 8, 4),
		createMockTestSuite("状态特效测试", 6, 1),
		createMockTestSuite("复杂特效测试", 4, 3),
	];

	// 生成报告
	const htmlPath = logger.generateHtmlReport(suites);
	const jsonPath = logger.generateJsonReport(suites);

	console.log(`HTML报告: ${htmlPath}`);
	console.log(`JSON报告: ${jsonPath}`);

	logger.finalize();
}

// 演示不同配置选项
function demonstrateConfigurations(): void {
	console.log("\n=== 配置选项演示 ===");

	// 仅控制台输出
	console.log("\n--- 仅控制台输出 ---");
	const consoleOnlyLogger = new TestReportLogger({
		filePrefix: "demo-console-only",
		enableFile: false,
		enableConsole: true,
	});
	consoleOnlyLogger.log("这条消息只会显示在控制台");
	consoleOnlyLogger.finalize();

	// 仅文件输出
	console.log("\n--- 仅文件输出 ---");
	const fileOnlyLogger = new TestReportLogger({
		filePrefix: "demo-file-only",
		enableFile: true,
		enableConsole: false,
	});
	fileOnlyLogger.log("这条消息只会保存到文件");
	fileOnlyLogger.finalize();
	console.log(`仅文件日志路径: ${fileOnlyLogger.getLogFilePath()}`);

	// 无时间戳
	console.log("\n--- 无时间戳格式 ---");
	const noTimestampLogger = new TestReportLogger({
		filePrefix: "demo-no-timestamp",
		timestampFormat: "none",
	});
	noTimestampLogger.log("这条消息没有时间戳");
	noTimestampLogger.finalize();

	// ISO时间戳
	console.log("\n--- ISO时间戳格式 ---");
	const isoLogger = new TestReportLogger({
		filePrefix: "demo-iso",
		timestampFormat: "iso",
	});
	isoLogger.log("这条消息使用ISO时间戳");
	isoLogger.finalize();
}

// 主演示函数
async function main(): Promise<void> {
	console.log("🎮 武器特效测试日志系统演示");
	console.log("=".repeat(50));

	try {
		demonstrateBasicLogging();

		await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待1秒

		demonstrateConsoleCapture();

		await new Promise((resolve) => setTimeout(resolve, 1000));

		demonstrateTestSuiteReporting();

		await new Promise((resolve) => setTimeout(resolve, 1000));

		demonstrateReportGeneration();

		await new Promise((resolve) => setTimeout(resolve, 1000));

		demonstrateConfigurations();

		console.log(`\n${"=".repeat(50)}`);
		console.log("🏁 日志系统演示完成");
		console.log("📁 请查看 tests/reports/ 目录下的生成文件");
		console.log("=".repeat(50));
	} catch (error) {
		console.error("演示过程中出现错误:", error);
		process.exit(1);
	}
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
	main().catch(console.error);
}

export { main as runLoggerDemo };
