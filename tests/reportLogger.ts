import * as fs from "node:fs";
import * as path from "node:path";
import type { ProbabilityTestResult, TestResult, TestSuite } from "./testUtils";

// 日志配置接口
interface LoggerConfig {
	outputDir: string;
	filePrefix: string;
	enableConsole: boolean;
	enableFile: boolean;
	timestampFormat: "iso" | "simple" | "none";
}

// 默认配置
const DEFAULT_CONFIG: LoggerConfig = {
	outputDir: "./tests/reports",
	filePrefix: "weapon-test",
	enableConsole: true,
	enableFile: true,
	timestampFormat: "iso",
};

// 测试报告日志器类
export class TestReportLogger {
	private config: LoggerConfig;
	private logFilePath: string;
	private startTime: Date;
	private originalConsole: {
		log: typeof console.log;
		error: typeof console.error;
		warn: typeof console.warn;
		info: typeof console.info;
	};

	constructor(config: Partial<LoggerConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.startTime = new Date();

		// 确保输出目录存在
		this.ensureOutputDir();

		// 生成日志文件路径
		this.logFilePath = this.generateLogFilePath();

		// 保存原始console方法
		this.originalConsole = {
			log: console.log,
			error: console.error,
			warn: console.warn,
			info: console.info,
		};

		// 初始化日志文件
		this.initLogFile();
	}

	// 确保输出目录存在
	private ensureOutputDir(): void {
		if (!fs.existsSync(this.config.outputDir)) {
			fs.mkdirSync(this.config.outputDir, { recursive: true });
		}
	}

	// 生成日志文件路径
	private generateLogFilePath(): string {
		const timestamp = this.formatTimestamp(this.startTime, "simple").replace(
			/[^0-9A-Za-z-]/g,
			"-",
		);
		const filename = `${this.config.filePrefix}-${timestamp}.log`;
		return path.join(this.config.outputDir, filename);
	}

	// 格式化时间戳
	private formatTimestamp(
		date: Date,
		format: "iso" | "simple" | "none" = "iso",
	): string {
		switch (format) {
			case "iso":
				return date.toISOString();
			case "simple":
				return date.toLocaleString("zh-CN", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
				});
			case "none":
				return "";
			default:
				return date.toISOString();
		}
	}

	// 初始化日志文件
	private initLogFile(): void {
		if (!this.config.enableFile) return;

		const header = [
			"=".repeat(80),
			"武器特效测试报告日志",
			`开始时间: ${this.formatTimestamp(this.startTime)}`,
			`日志文件: ${this.logFilePath}`,
			"=".repeat(80),
			"",
		].join("\n");

		fs.writeFileSync(this.logFilePath, header, "utf8");
	}

	// 核心日志方法
	private writeLog(
		level: "LOG" | "ERROR" | "WARN" | "INFO",
		message: string,
	): void {
		const timestamp =
			this.config.timestampFormat !== "none"
				? `[${this.formatTimestamp(new Date(), this.config.timestampFormat)}] `
				: "";

		const logLine = `${timestamp}${level}: ${message}`;

		// 输出到控制台
		if (this.config.enableConsole) {
			switch (level) {
				case "LOG":
					this.originalConsole.log(message);
					break;
				case "ERROR":
					this.originalConsole.error(message);
					break;
				case "WARN":
					this.originalConsole.warn(message);
					break;
				case "INFO":
					this.originalConsole.info(message);
					break;
			}
		}

		// 写入文件
		if (this.config.enableFile) {
			fs.appendFileSync(this.logFilePath, `${logLine}\n`, "utf8");
		}
	}

	// 公共日志方法
	public log(message: string): void {
		this.writeLog("LOG", message);
	}

	public error(message: string): void {
		this.writeLog("ERROR", message);
	}

	public warn(message: string): void {
		this.writeLog("WARN", message);
	}

	public info(message: string): void {
		this.writeLog("INFO", message);
	}

	// 劫持console方法
	public startCapture(): void {
		console.log = (...args: unknown[]) => this.log(args.map(String).join(" "));
		console.error = (...args: unknown[]) =>
			this.error(args.map(String).join(" "));
		console.warn = (...args: unknown[]) =>
			this.warn(args.map(String).join(" "));
		console.info = (...args: unknown[]) =>
			this.info(args.map(String).join(" "));
	}

	// 恢复console方法
	public stopCapture(): void {
		console.log = this.originalConsole.log;
		console.error = this.originalConsole.error;
		console.warn = this.originalConsole.warn;
		console.info = this.originalConsole.info;
	}

	// 生成测试套件报告
	public logTestSuite(suite: TestSuite): void {
		this.log(`\n${"=".repeat(50)}`);
		this.log(`测试套件: ${suite.name}`);
		this.log("=".repeat(50));
		this.log(`总计: ${suite.summary.total}`);
		this.log(`通过: ${suite.summary.passed}`);
		this.log(`失败: ${suite.summary.failed}`);
		this.log(`成功率: ${(suite.summary.successRate * 100).toFixed(1)}%`);
		this.log("=".repeat(50));

		// 详细结果
		for (const result of suite.results) {
			const status = result.success ? "✅ PASS" : "❌ FAIL";
			this.log(`${status} ${result.bonusName}`);

			if (!result.success && result.error) {
				this.log(`  错误: ${result.error}`);
			}

			if (result.details) {
				this.log(`  详情: ${JSON.stringify(result.details, null, 2)}`);
			}
		}
		this.log("");
	}

	// 生成概率测试统计报告
	public logProbabilityStats(
		results: (TestResult & ProbabilityTestResult)[],
	): void {
		this.log("\n📈 概率特效统计详情:");
		this.log("-".repeat(60));

		results.forEach((result) => {
			const status = result.success ? "✅" : "❌";
			const expectedPercent = (result.expectedRate * 100).toFixed(1);
			const actualPercent = (result.actualRate * 100).toFixed(1);
			const diff = Math.abs(result.actualRate - result.expectedRate) * 100;

			this.log(
				`${status} ${result.bonusName}: 期望 ${expectedPercent}%, 实际 ${actualPercent}%, 差异 ${diff.toFixed(1)}%`,
			);
		});
		this.log("");
	}

	// 生成性能报告
	public logPerformanceReport(
		startTime: Date,
		endTime: Date,
		testCount: number,
	): void {
		const duration = (endTime.getTime() - startTime.getTime()) / 1000;
		const avgTime = testCount > 0 ? (duration / testCount).toFixed(3) : "0";

		this.log("\n⏱️ 性能统计:");
		this.log("-".repeat(30));
		this.log(`总耗时: ${duration.toFixed(2)} 秒`);
		this.log(`测试数量: ${testCount}`);
		this.log(`平均耗时: ${avgTime} 秒/测试`);
		this.log("");
	}

	// 生成HTML报告
	public generateHtmlReport(suites: TestSuite[]): string {
		const htmlPath = path.join(
			this.config.outputDir,
			`${this.config.filePrefix}-${this.formatTimestamp(this.startTime, "simple").replace(/[^0-9A-Za-z-]/g, "-")}.html`,
		);

		const html = this.createHtmlContent(suites);
		fs.writeFileSync(htmlPath, html, "utf8");

		this.log(`📄 HTML报告已生成: ${htmlPath}`);
		return htmlPath;
	}

	// 创建HTML内容
	private createHtmlContent(suites: TestSuite[]): string {
		const totalTests = suites.reduce(
			(sum, suite) => sum + suite.summary.total,
			0,
		);
		const totalPassed = suites.reduce(
			(sum, suite) => sum + suite.summary.passed,
			0,
		);
		const totalFailed = suites.reduce(
			(sum, suite) => sum + suite.summary.failed,
			0,
		);
		const overallSuccessRate =
			totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : "0";

		return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>武器特效测试报告</title>
	<style>
		body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
		.container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
		.header { text-align: center; margin-bottom: 30px; }
		.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
		.summary-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
		.summary-card h3 { margin: 0 0 10px 0; font-size: 14px; opacity: 0.9; }
		.summary-card .value { font-size: 24px; font-weight: bold; }
		.suite { margin-bottom: 30px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
		.suite-header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; }
		.suite-header h2 { margin: 0; color: #333; }
		.suite-stats { display: flex; gap: 20px; margin-top: 10px; font-size: 14px; }
		.test-result { padding: 10px 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
		.test-result:last-child { border-bottom: none; }
		.test-result.pass { background-color: #f8fff8; border-left: 4px solid #28a745; }
		.test-result.fail { background-color: #fff8f8; border-left: 4px solid #dc3545; }
		.test-name { font-weight: 500; }
		.test-status { font-size: 18px; }
		.error-details { font-size: 12px; color: #666; margin-top: 5px; }
		.timestamp { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>🎮 武器特效测试报告</h1>
			<p>生成时间: ${this.formatTimestamp(new Date())}</p>
		</div>
		
		<div class="summary">
			<div class="summary-card">
				<h3>总测试数</h3>
				<div class="value">${totalTests}</div>
			</div>
			<div class="summary-card">
				<h3>通过数</h3>
				<div class="value">${totalPassed}</div>
			</div>
			<div class="summary-card">
				<h3>失败数</h3>
				<div class="value">${totalFailed}</div>
			</div>
			<div class="summary-card">
				<h3>成功率</h3>
				<div class="value">${overallSuccessRate}%</div>
			</div>
		</div>

		${suites
			.map(
				(suite) => `
		<div class="suite">
			<div class="suite-header">
				<h2>${suite.name}</h2>
				<div class="suite-stats">
					<span>总计: ${suite.summary.total}</span>
					<span>通过: ${suite.summary.passed}</span>
					<span>失败: ${suite.summary.failed}</span>
					<span>成功率: ${(suite.summary.successRate * 100).toFixed(1)}%</span>
				</div>
			</div>
			${suite.results
				.map(
					(result) => `
			<div class="test-result ${result.success ? "pass" : "fail"}">
				<div>
					<div class="test-name">${result.bonusName}</div>
					${!result.success && result.error ? `<div class="error-details">错误: ${result.error}</div>` : ""}
				</div>
				<div class="test-status">${result.success ? "✅" : "❌"}</div>
			</div>
			`,
				)
				.join("")}
		</div>
		`,
			)
			.join("")}

		<div class="timestamp">
			报告生成于: ${this.formatTimestamp(new Date())}
		</div>
	</div>
</body>
</html>`;
	}

	// 生成JSON报告
	public generateJsonReport(suites: TestSuite[]): string {
		const jsonPath = path.join(
			this.config.outputDir,
			`${this.config.filePrefix}-${this.formatTimestamp(this.startTime, "simple").replace(/[^0-9A-Za-z-]/g, "-")}.json`,
		);

		const report = {
			timestamp: this.formatTimestamp(new Date()),
			startTime: this.formatTimestamp(this.startTime),
			endTime: this.formatTimestamp(new Date()),
			summary: {
				totalSuites: suites.length,
				totalTests: suites.reduce((sum, suite) => sum + suite.summary.total, 0),
				totalPassed: suites.reduce(
					(sum, suite) => sum + suite.summary.passed,
					0,
				),
				totalFailed: suites.reduce(
					(sum, suite) => sum + suite.summary.failed,
					0,
				),
			},
			suites: suites,
		};

		fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");

		this.log(`📄 JSON报告已生成: ${jsonPath}`);
		return jsonPath;
	}

	// 完成日志记录
	public finalize(): void {
		if (!this.config.enableFile) return;

		const endTime = new Date();
		const duration = (endTime.getTime() - this.startTime.getTime()) / 1000;

		const footer = [
			"",
			"=".repeat(80),
			`测试完成时间: ${this.formatTimestamp(endTime)}`,
			`总耗时: ${duration.toFixed(2)} 秒`,
			`日志文件: ${this.logFilePath}`,
			"=".repeat(80),
		].join("\n");

		fs.appendFileSync(this.logFilePath, footer, "utf8");

		this.log(`📝 完整日志已保存到: ${this.logFilePath}`);
	}

	// 获取日志文件路径
	public getLogFilePath(): string {
		return this.logFilePath;
	}
}

// 默认日志器实例
let defaultLogger: TestReportLogger | null = null;

// 初始化默认日志器
export function initializeLogger(
	config?: Partial<LoggerConfig>,
): TestReportLogger {
	defaultLogger = new TestReportLogger(config);
	return defaultLogger;
}

// 获取默认日志器
export function getLogger(): TestReportLogger {
	if (!defaultLogger) {
		defaultLogger = new TestReportLogger();
	}
	return defaultLogger;
}

// 便捷函数
export function startLogging(config?: Partial<LoggerConfig>): TestReportLogger {
	const logger = initializeLogger(config);
	logger.startCapture();
	return logger;
}

export function stopLogging(): void {
	if (defaultLogger) {
		defaultLogger.stopCapture();
		defaultLogger.finalize();
	}
}
