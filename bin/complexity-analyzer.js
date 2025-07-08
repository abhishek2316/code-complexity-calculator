#!/usr/bin/env node


/**
 * This is the entry point for the complexity-analyzer CLI.
 * It requires the main CLI module and executes it.
 */
const { program } = require('commander');
const { runCLI, runInteractiveCLI } = require('../lib/cli');

program
  .version('1.0.0')
  .description('Analyze time and space complexity of your code')
  .option('-f, --file <path>', 'Analyze single file')
  .option('-p, --project <path>', 'Analyze entire project')
  .option('-g, --github <url>', 'Analyze GitHub repository')
  .option('-o, --output <path>', 'Output file path')
  .option('-l, --language <lang>', 'Force language detection')
  .option('--json', 'Output in JSON format')
  .option('--verbose', 'Verbose output')
  .option('--interactive', 'Run in interactive mode');

program
  .command('file')
  .description('Analyze a single file (interactive mode)')
  .action(() => runInteractiveCLI('file'));

program
  .command('project')
    .description('Analyze an entire project (interactive mode)')
    .action(() => runInteractiveCLI('project'));

program
  .command('github')
    .description('Analyze a GitHub repository (interactive mode)')
    .action(() => runInteractiveCLI('github'));

program
  .command('init')
  .description('Initialize interactive complexity analyzer')
  .action(() => runInteractiveCLI('init'));

// If no command provided, check for options or run interactive mode
if (process.argv.length === 2) {
  runInteractiveCLI('init');
} else {
  program.parse();
  
  // Run non-interactive mode if options are provided
  if (program.opts().file || program.opts().project || program.opts().github) {
    runCLI(program.opts());
  }
}

