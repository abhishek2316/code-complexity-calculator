import { program } from 'commander';

// import { runInteractiveCLI } from '../src/cli';
import { runInteractiveCLI } from '../cli';

program
  .version('1.0.0')
  .description('Analyze time and space complexity of Java code')
  .option('-f, --file <path>', 'Analyze single Java file')
  .option('-o, --output <path>', 'Output file path')
  .option('--json', 'Output in JSON format')
  .option('--verbose', 'Verbose output')
  .option('--interactive', 'Run in interactive mode');

program
  .command('analyze')
  .description('Analyze a single Java file (interactive mode)')
  .action(() => runInteractiveCLI('file'));

program
  .command('init')
  .description('Initialize interactive complexity analyzer')
  .action(() => runInteractiveCLI('init'));

// If no command provided, run interactive mode
if (process.argv.length === 2) {
  runInteractiveCLI('init');
} else {
  program.parse();
  
  // Run non-interactive mode if file option is provided
  if (program.opts().file) {
    console.log('Non-interactive mode coming soon...');
    process.exit(0);
  }
}