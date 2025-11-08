  const chalk = require('chalk');
import * as path from 'path';
import * as fs from 'fs-extra';
import { ComplexityAnalyzer } from './analyzer';
import { ConsoleOutput } from './output/console';
// import { FileOutput } from './output/file';
import { OutputConfig, AnalyzerConfig } from './types';

interface FileInputConfig {
  inputType: 'local';
  path: string;
}

export class InteractiveCLI {
  private analyzer: ComplexityAnalyzer;
  private consoleOutput: ConsoleOutput;
  // private fileOutput: FileOutput;
  private config: AnalyzerConfig;
  private inquirer: any;

  constructor() {
    this.config = {
      verbose: false,
      maxComplexity: 10,
      includeBigO: true,
      includeCyclomatic: true,
      includeCognitive: true,
      thresholds: {
        low: 5,
        medium: 10,
        high: 20
      }
    };

    this.analyzer = new ComplexityAnalyzer(this.config);
    this.consoleOutput = new ConsoleOutput();
    // this.fileOutput = new FileOutput();
  }

  private async loadInquirer() {
    if (!this.inquirer) {
      this.inquirer = await import('inquirer');
    }
    return this.inquirer.default;
  }

  async runInteractiveCLI(mode: string = 'init'): Promise<void> {
    console.log(chalk.blue.bold('🔍 Welcome to Code Complexity Analyzer'));
    console.log(chalk.gray('Supported Languages: Java\n'));
    
    try {
      switch (mode) {
        case 'init':
          await this.showMainMenu();
          break;
        case 'file':
          await this.analyzeFile();
          break;
        default:
          await this.showMainMenu();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red('❌ Error:', errorMessage));
      
      if (this.config.verbose && error instanceof Error) {
        console.error(chalk.red('Stack trace:', error.stack));
      }
      process.exit(1);
    }
  }

  private async showMainMenu(): Promise<void> {
    const inquirer = await this.loadInquirer();
    const { analysisType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'analysisType',
        message: 'What would you like to analyze?',
        choices: [
          {
            name: '📄 Single Java File',
            value: 'file',
            short: 'File'
          },
          // {
          //   name: '⚙️  Configuration',
          //   value: 'config',
          //   short: 'Config'
          // },
          {
            name: '❓ Help',
            value: 'help',
            short: 'Help'
          },
          {
            name: '❌ Exit',
            value: 'exit',
            short: 'Exit'
          }
        ]
      }
    ]);

    switch (analysisType) {
      case 'file':
        await this.analyzeFile();
        break;
      case 'config':
        await this.configureSettings();
        break;
      case 'help':
        await this.showHelp();
        break;
      case 'exit':
        console.log(chalk.green('👋 Goodbye!'));
        process.exit(0);
    }
  }

  private async analyzeFile(): Promise<void> {
    const fileConfig = await this.getFileInputConfig();
    const outputConfig = await this.getOutputConfig();
    
    try {
      const filePath = path.resolve(fileConfig.path);
      
      // Validate local file exists
      if (!await fs.pathExists(filePath)) {
        console.error(chalk.red(`❌ File not found: ${filePath}`));
        await this.askContinue();
        return;
      }

      // Check if file is Java
      if (!this.isJavaFile(filePath)) {
        console.error(chalk.red(`❌ Unsupported file type. Only Java files (.java) are supported.`));
        await this.askContinue();
        return;
      }

      // Show analysis progress
      const spinner = this.showSpinner(`Analyzing: ${path.basename(filePath)}`);
      
      // Analyze the file
      const results = await this.analyzer.analyzeFile(filePath);
      spinner.stop();

      // Output results
      await this.outputResults(results, outputConfig);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red(`❌ Analysis failed: ${errorMessage}`));
      
      if (this.config.verbose && error instanceof Error) {
        console.error(chalk.red('Details:', error.stack));
      }
    }

    // Ask if user wants to continue
    await this.askContinue();
  }

  private async getFileInputConfig(): Promise<FileInputConfig> {
    const inquirer = await this.loadInquirer();
    const questions = [
      {
        type: 'input',
        name: 'path',
        message: 'Enter the Java file path:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Please enter a valid file path';
          }
          const ext = path.extname(input.trim()).toLowerCase();
          if (ext !== '.java') {
            return 'Please enter a Java file (.java)';
          }
          return true;
        }
      }
    ];

    const answers = await inquirer.prompt(questions);
    return {
      inputType: 'local',
      path: answers.path
    };
  }

  // private async getOutputConfig(): Promise<OutputConfig> {
  //   const inquirer = await this.loadInquirer();
  //   const questions = [
  //     {
  //       type: 'list',
  //       name: 'format',
  //       message: 'Output format:',
  //       choices: [
  //         {
  //           name: '🖥️  Console only',
  //           value: 'console',
  //           short: 'Console'
  //         },
  //         {
  //           name: '📄 Save to file',
  //           value: 'file',
  //           short: 'File'
  //         },
  //         {
  //           name: '🔄 Both console and file',
  //           value: 'both',
  //           short: 'Both'
  //         }
  //       ]
  //     },
  //     {
  //       type: 'input',
  //       name: 'filename',
  //       message: 'Enter output filename (or press Enter for auto-generated):',
  //       when: (answers: any) => answers.format === 'file' || answers.format === 'both',
  //       default: ''
  //     },
  //     {
  //       type: 'list',
  //       name: 'fileFormat',
  //       message: 'File format:',
  //       when: (answers: any) => answers.format === 'file' || answers.format === 'both',
  //       choices: [
  //         {
  //           name: '📝 Text (.txt)',
  //           value: 'txt',
  //           short: 'TXT'
  //         },
  //         {
  //           name: '📊 JSON (.json)',
  //           value: 'json',
  //           short: 'JSON'
  //         },
  //         {
  //           name: '📈 CSV (.csv)',
  //           value: 'csv',
  //           short: 'CSV'
  //         }
  //       ]
  //     }
  //   ];

  //   return await inquirer.prompt(questions) as OutputConfig;
  // }

  private async getOutputConfig(): Promise<OutputConfig> {
    return {
      format: 'console'
    };
  }

  private async outputResults(results: any, outputConfig: OutputConfig): Promise<void> {
    // Console output
    if (outputConfig.format === 'console' || outputConfig.format === 'both') {
      this.consoleOutput.display(results);
    }

    // File output
    // if (outputConfig.format === 'file' || outputConfig.format === 'both') {
    //   const timestamp = new Date().toISOString().split('T')[0];
    //   const filename = outputConfig.filename || 
    //     `complexity_report_${timestamp}.${outputConfig.fileFormat}`;
      
    //   await this.fileOutput.save(results, filename, outputConfig.fileFormat!);
    //   console.log(chalk.green(`✅ Report saved to: ${filename}`));
    // }
  }

  private async askContinue(): Promise<void> {
    const inquirer = await this.loadInquirer();
    const { continueAnalysis } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continueAnalysis',
        message: 'Would you like to analyze another file?',
        default: true
      }
    ]);

    if (continueAnalysis) {
      await this.showMainMenu();
    } else {
      console.log(chalk.green('👋 Thank you for using Code Complexity Analyzer!'));
      process.exit(0);
    }
  }

  private async configureSettings(): Promise<void> {
    const inquirer = await this.loadInquirer();
    const { settings } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'settings',
        message: 'Configure analyzer settings:',
        choices: [
          {
            name: 'Enable verbose output',
            value: 'verbose',
            checked: this.config.verbose
          },
          {
            name: 'Include Big-O analysis',
            value: 'includeBigO',
            checked: this.config.includeBigO
          },
          {
            name: 'Include Cyclomatic complexity',
            value: 'includeCyclomatic',
            checked: this.config.includeCyclomatic
          },
          {
            name: 'Include Cognitive complexity',
            value: 'includeCognitive',
            checked: this.config.includeCognitive
          }
        ]
      }
    ]);

    this.config.verbose = settings.includes('verbose');
    this.config.includeBigO = settings.includes('includeBigO');
    this.config.includeCyclomatic = settings.includes('includeCyclomatic');
    this.config.includeCognitive = settings.includes('includeCognitive');
    
    // Update analyzer with new config
    this.analyzer = new ComplexityAnalyzer(this.config);
    
    console.log(chalk.blue('⚙️  Settings updated:'));
    console.log(chalk.gray(`  Verbose: ${this.config.verbose}`));
    console.log(chalk.gray(`  Include Big-O: ${this.config.includeBigO}`));
    console.log(chalk.gray(`  Include Cyclomatic: ${this.config.includeCyclomatic}`));
    console.log(chalk.gray(`  Include Cognitive: ${this.config.includeCognitive}`));
    
    await this.askContinue();
  }

  private async showHelp(): Promise<void> {
    console.log(chalk.blue.bold('\n📚 Help - Code Complexity Analyzer\n'));
    console.log(chalk.white('This tool analyzes the time and space complexity of Java code.'));
    console.log(chalk.white('Provides detailed metrics for functions, classes, and overall file complexity.\n'));
    
    console.log(chalk.yellow('Available Analysis Types:'));
    console.log(chalk.white('  📄 Single File - Analyze one Java file\n'));
    
    console.log(chalk.yellow('Complexity Metrics:'));
    console.log(chalk.white('  🔄 Cyclomatic Complexity - Measures decision points'));
    console.log(chalk.white('  🧠 Cognitive Complexity - Measures readability'));
    console.log(chalk.white('  ⏱️  Time Complexity - Big-O notation for runtime'));
    console.log(chalk.white('  💾 Space Complexity - Big-O notation for memory usage'));
    console.log(chalk.white('  🔧 Maintainability Index - Code maintainability score (0-100)\n'));
    
    console.log(chalk.yellow('Output Formats:'));
    console.log(chalk.white('  🖥️  Console - Display results in terminal'));
    console.log(chalk.white('  📄 File - Save to TXT, JSON, or CSV file'));
    console.log(chalk.white('  🔄 Both - Show in console and save to file\n'));
    
    console.log(chalk.yellow('Complexity Thresholds:'));
    console.log(chalk.white('  🟢 Low: 1-5 (Good)'));
    console.log(chalk.white('  🟡 Medium: 6-10 (Acceptable)'));
    console.log(chalk.white('  🔴 High: 11+ (Needs attention)\n'));
    
    await this.askContinue();
  }

  private isJavaFile(filePath: string): boolean {
    return path.extname(filePath).toLowerCase() === '.java';
  }

  private showSpinner(message: string) {
    const spinner = {
      interval: null as NodeJS.Timeout | null,
      chars: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
      index: 0,
      start: function() {
        this.interval = setInterval(() => {
          process.stdout.write(`\r${chalk.blue(this.chars[this.index])} ${message}`);
          this.index = (this.index + 1) % this.chars.length;
        }, 100);
      },
      stop: function() {
        if (this.interval) {
          clearInterval(this.interval);
          process.stdout.write(`\r${chalk.green('✅')} ${message}\n`);
        }
      }
    };
    spinner.start();
    return spinner;
  }
}

// Export functions for CLI usage
export async function runInteractiveCLI(mode: string): Promise<void> {
  const cli = new InteractiveCLI();
  await cli.runInteractiveCLI(mode);
}