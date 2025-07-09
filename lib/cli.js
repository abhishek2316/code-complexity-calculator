const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const { ComplexityAnalyzer } = require('./analyzer');
const { GitHubUtils } = require('./utils/gitUtils');
const { FileUtils } = require('./utils/fileUtils');
const { ConsoleOutput } = require('./output/console');
const { FileOutput } = require('./output/file');

class InteractiveCLI {
  constructor() {
    this.analyzer = new ComplexityAnalyzer();
    this.consoleOutput = new ConsoleOutput();
    this.fileOutput = new FileOutput();
    this.config = {
      verbose: false,
      includeTests: false,
      supportedLanguages: ['javascript', 'java']
    };
  }

  async runInteractiveCLI(mode = 'init') {
    console.log(chalk.blue.bold('🔍 Welcome to Code Complexity Analyzer'));
    console.log(chalk.gray('Supported Languages: JavaScript, Java\n'));
    
    try {
      switch (mode) {
        case 'init':
          await this.showMainMenu();
          break;
        case 'file':
          await this.analyzeFile();
          break;
        case 'project':
          await this.analyzeProject();
          break;
        default:
          await this.showMainMenu();
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:', error.message));
      if (this.config.verbose) {
        console.error(chalk.red('Stack trace:', error.stack));
      }
      process.exit(1);
    }
  }

  async showMainMenu() {
    const { analysisType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'analysisType',
        message: 'What would you like to analyze?',
        choices: [
          {
            name: '📄 Single File (JavaScript/Java)',
            value: 'file',
            short: 'File'
          },
          {
            name: '📁 Entire Project',
            value: 'project',
            short: 'Project'
          },
          {
            name: '⚙️  Configuration',
            value: 'config',
            short: 'Config'
          },
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
      case 'project':
        await this.analyzeProject();
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

  async analyzeFile() {
    const fileConfig = await this.getFileInputConfig();
    const outputConfig = await this.getOutputConfig();
    
    let filePath;
    let isRemote = false;
    let originalPath = '';

    try {
      if (fileConfig.inputType === 'local') {
        filePath = path.resolve(fileConfig.path);
        originalPath = fileConfig.path;
        
        // Validate local file exists
        if (!await fs.pathExists(filePath)) {
          console.error(chalk.red(`❌ File not found: ${filePath}`));
          await this.askContinue();
          return;
        }

        // Check if file is supported
        if (!this.isSupportedFile(filePath)) {
          console.error(chalk.red(`❌ Unsupported file type. Supported: .js, .jsx, .ts, .tsx, .java`));
          await this.askContinue();
          return;
        }
      } else {
        // Handle GitHub URL
        console.log(chalk.blue('🔄 Fetching file from GitHub...'));
        const gitUtils = new GitHubUtils();
        const result = await gitUtils.downloadSingleFile(fileConfig.githubUrl);
        filePath = result.filePath;
        originalPath = fileConfig.githubUrl;
        isRemote = true;
      }

      // Show analysis progress
      const spinner = this.showSpinner(`Analyzing: ${path.basename(filePath)}`);
      
      // Analyze the file
      const results = await this.analyzer.analyzeFile(filePath);
      spinner.stop();

      // Add metadata
      results.metadata = {
        originalPath,
        isRemote,
        analyzedAt: new Date().toISOString(),
        analyzerVersion: '1.0.0'
      };

      // Output results
      await this.outputResults(results, outputConfig, 'file');
      
      // Cleanup if remote file
      if (isRemote) {
        await fs.remove(filePath);
      }

    } catch (error) {
      console.error(chalk.red(`❌ Analysis failed: ${error.message}`));
      if (this.config.verbose) {
        console.error(chalk.red('Details:', error.stack));
      }
    }

    // Ask if user wants to continue
    await this.askContinue();
  }

  async analyzeProject() {
    const projectConfig = await this.getProjectInputConfig();
    const outputConfig = await this.getOutputConfig();
    
    let projectPath;
    let isRemote = false;
    let originalPath = '';

    try {
      if (projectConfig.inputType === 'local') {
        projectPath = path.resolve(projectConfig.path);
        originalPath = projectConfig.path;
        
        // Validate local directory exists
        if (!await fs.pathExists(projectPath)) {
          console.error(chalk.red(`❌ Directory not found: ${projectPath}`));
          await this.askContinue();
          return;
        }
      } else {
        // Handle GitHub repository
        console.log(chalk.blue('🔄 Cloning repository...'));
        const gitUtils = new GitHubUtils();
        const result = await gitUtils.cloneRepository(projectConfig.githubUrl);
        projectPath = result.projectPath;
        originalPath = projectConfig.githubUrl;
        isRemote = true;
      }

      // Show analysis progress
      const spinner = this.showSpinner(`Analyzing project: ${path.basename(projectPath)}`);
      
      // Analyze the project
      const results = await this.analyzer.analyzeProject(projectPath);
      spinner.stop();

      // Add metadata
      results.metadata = {
        originalPath,
        isRemote,
        analyzedAt: new Date().toISOString(),
        analyzerVersion: '1.0.0'
      };

      // Output results
      await this.outputResults(results, outputConfig, 'project');
      
      // Cleanup if remote project
      if (isRemote) {
        await fs.remove(projectPath);
      }

    } catch (error) {
      console.error(chalk.red(`❌ Analysis failed: ${error.message}`));
      if (this.config.verbose) {
        console.error(chalk.red('Details:', error.stack));
      }
    }

    // Ask if user wants to continue
    await this.askContinue();
  }

  async getFileInputConfig() {
    const questions = [
      {
        type: 'list',
        name: 'inputType',
        message: 'How would you like to provide the file?',
        choices: [
          {
            name: '📁 Local file path',
            value: 'local',
            short: 'Local'
          },
          {
            name: '🌐 GitHub URL',
            value: 'github',
            short: 'GitHub'
          }
        ]
      },
      {
        type: 'input',
        name: 'path',
        message: 'Enter the file path:',
        when: (answers) => answers.inputType === 'local',
        validate: (input) => {
          if (!input.trim()) {
            return 'Please enter a valid file path';
          }
          const ext = path.extname(input.trim()).toLowerCase();
          if (!['.js', '.jsx', '.ts', '.tsx', '.java'].includes(ext)) {
            return 'Please enter a JavaScript (.js, .jsx, .ts, .tsx) or Java (.java) file';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'githubUrl',
        message: 'Enter the GitHub file URL:',
        when: (answers) => answers.inputType === 'github',
        validate: (input) => {
          if (!input.trim()) {
            return 'Please enter a valid GitHub URL';
          }
          if (!input.includes('github.com')) {
            return 'Please enter a valid GitHub URL';
          }
          return true;
        }
      }
    ];

    return await inquirer.prompt(questions);
  }

  async getProjectInputConfig() {
    const questions = [
      {
        type: 'list',
        name: 'inputType',
        message: 'How would you like to provide the project?',
        choices: [
          {
            name: '📁 Local directory path',
            value: 'local',
            short: 'Local'
          },
          {
            name: '🌐 GitHub repository URL',
            value: 'github',
            short: 'GitHub'
          }
        ]
      },
      {
        type: 'input',
        name: 'path',
        message: 'Enter the project directory path:',
        when: (answers) => answers.inputType === 'local',
        validate: (input) => {
          if (!input.trim()) {
            return 'Please enter a valid directory path';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'githubUrl',
        message: 'Enter the GitHub repository URL:',
        when: (answers) => answers.inputType === 'github',
        validate: (input) => {
          if (!input.trim()) {
            return 'Please enter a valid GitHub URL';
          }
          if (!input.includes('github.com')) {
            return 'Please enter a valid GitHub URL';
          }
          return true;
        }
      }
    ];

    return await inquirer.prompt(questions);
  }

  async getOutputConfig() {
    const questions = [
      {
        type: 'list',
        name: 'format',
        message: 'Output format:',
        choices: [
          {
            name: '🖥️  Console only',
            value: 'console',
            short: 'Console'
          },
          {
            name: '📄 Save to file',
            value: 'file',
            short: 'File'
          },
          {
            name: '🔄 Both console and file',
            value: 'both',
            short: 'Both'
          }
        ]
      },
      {
        type: 'input',
        name: 'filename',
        message: 'Enter output filename (or press Enter for auto-generated):',
        when: (answers) => answers.format === 'file' || answers.format === 'both',
        default: ''
      },
      {
        type: 'list',
        name: 'fileFormat',
        message: 'File format:',
        when: (answers) => answers.format === 'file' || answers.format === 'both',
        choices: [
          {
            name: '📝 Text (.txt)',
            value: 'txt',
            short: 'TXT'
          },
          {
            name: '📊 JSON (.json)',
            value: 'json',
            short: 'JSON'
          },
          {
            name: '📈 CSV (.csv)',
            value: 'csv',
            short: 'CSV'
          }
        ]
      }
    ];

    return await inquirer.prompt(questions);
  }

  async outputResults(results, outputConfig, analysisType) {
    // Console output
    if (outputConfig.format === 'console' || outputConfig.format === 'both') {
      this.consoleOutput.display(results, analysisType);
    }

    // File output
    if (outputConfig.format === 'file' || outputConfig.format === 'both') {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = outputConfig.filename || 
        `complexity_report_${timestamp}.${outputConfig.fileFormat}`;
      
      await this.fileOutput.save(results, filename, outputConfig.fileFormat);
      console.log(chalk.green(`✅ Report saved to: ${filename}`));
    }
  }

  async askContinue() {
    const { continueAnalysis } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continueAnalysis',
        message: 'Would you like to analyze another file/project?',
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

  async configureSettings() {
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
            name: 'Include test files',
            value: 'includeTests',
            checked: this.config.includeTests
          }
        ]
      }
    ]);

    this.config.verbose = settings.includes('verbose');
    this.config.includeTests = settings.includes('includeTests');
    
    console.log(chalk.blue('⚙️  Settings updated:'));
    console.log(chalk.gray(`  Verbose: ${this.config.verbose}`));
    console.log(chalk.gray(`  Include Tests: ${this.config.includeTests}`));
    
    await this.askContinue();
  }

  async showHelp() {
    console.log(chalk.blue.bold('\n📚 Help - Code Complexity Analyzer\n'));
    console.log(chalk.white('This tool analyzes the time and space complexity of your code.'));
    console.log(chalk.white('Currently supports: JavaScript (.js, .jsx, .ts, .tsx) and Java (.java)\n'));
    
    console.log(chalk.yellow('Available Analysis Types:'));
    console.log(chalk.white('  📄 Single File - Analyze one file'));
    console.log(chalk.white('  📁 Project - Analyze entire project directory\n'));
    
    console.log(chalk.yellow('Input Methods:'));
    console.log(chalk.white('  📁 Local Path - File/directory on your computer'));
    console.log(chalk.white('  🌐 GitHub URL - Direct link to GitHub file/repository\n'));
    
    console.log(chalk.yellow('Output Formats:'));
    console.log(chalk.white('  🖥️  Console - Display results in terminal'));
    console.log(chalk.white('  📄 File - Save to TXT, JSON, or CSV file'));
    console.log(chalk.white('  🔄 Both - Show in console and save to file\n'));
    
    await this.askContinue();
  }

  isSupportedFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ['.js', '.jsx', '.ts', '.tsx', '.java'].includes(ext);
  }

  showSpinner(message) {
    // Simple spinner implementation
    const spinner = {
      interval: null,
      chars: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
      index: 0,
      start() {
        this.interval = setInterval(() => {
          process.stdout.write(`\r${chalk.blue(this.chars[this.index])} ${message}`);
          this.index = (this.index + 1) % this.chars.length;
        }, 100);
      },
      stop() {
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
async function runInteractiveCLI(mode) {
  const cli = new InteractiveCLI();
  await cli.runInteractiveCLI(mode);
}

function runCLI(options) {
  // Non-interactive CLI mode
  const analyzer = new ComplexityAnalyzer();
  const consoleOutput = new ConsoleOutput();
  
  console.log(chalk.blue('🔍 Code Complexity Analyzer - Non-Interactive Mode\n'));
  
  if (options.file) {
    analyzer.analyzeFile(options.file)
      .then(results => {
        consoleOutput.display(results, 'file');
      })
      .catch(error => {
        console.error(chalk.red('❌ Analysis failed:', error.message));
      });
  } else if (options.project) {
    analyzer.analyzeProject(options.project)
      .then(results => {
        consoleOutput.display(results, 'project');
      })
      .catch(error => {
        console.error(chalk.red('❌ Analysis failed:', error.message));
      });
  } else {
    console.log(chalk.yellow('Please provide --file or --project option, or run without options for interactive mode.'));
  }
}

module.exports = { runCLI, runInteractiveCLI };