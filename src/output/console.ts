const chalk = require('chalk');
import { AnalysisResult } from '../types';

export class ConsoleOutput {
  display(result: AnalysisResult): void {
    console.log('\n' + chalk.blue.bold('📊 COMPLEXITY ANALYSIS REPORT'));
    console.log(chalk.gray('═'.repeat(50)));
    
    this.displayFileInfo(result);
    this.displayOverallComplexity(result);
    this.displayFunctions(result);
    this.displayClasses(result);
    this.displaySummary(result);
    this.displayRecommendations(result);
  }

  private displayFileInfo(result: AnalysisResult): void {
    console.log(chalk.yellow.bold('\n📄 FILE INFORMATION'));
    console.log(`${chalk.gray('File:')} ${result.filePath}`);
    console.log(`${chalk.gray('Language:')} ${result.language.toUpperCase()}`);
    console.log(`${chalk.gray('Size:')} ${result.metadata.fileSize} bytes`);
    console.log(`${chalk.gray('Lines:')} ${result.complexity.linesOfCode}`);
    console.log(`${chalk.gray('Analyzed:')} ${new Date(result.metadata.analyzedAt).toLocaleString()}`);
  }

  private displayOverallComplexity(result: AnalysisResult): void {
    console.log(chalk.yellow.bold('\n🔍 OVERALL COMPLEXITY'));
    
    const { complexity } = result;
    
    console.log(`${chalk.gray('Cyclomatic Complexity:')} ${this.getComplexityColor(complexity.cyclomatic, 10)}${complexity.cyclomatic}`);
    console.log(`${chalk.gray('Cognitive Complexity:')} ${this.getComplexityColor(complexity.cognitive, 15)}${complexity.cognitive}`);
    console.log(`${chalk.gray('Time Complexity:')} ${chalk.cyan(complexity.timeComplexity)}`);
    console.log(`${chalk.gray('Space Complexity:')} ${chalk.cyan(complexity.spaceComplexity)}`);
    console.log(`${chalk.gray('Maintainability Index:')} ${this.getMaintainabilityColor(complexity.maintainabilityIndex)}${complexity.maintainabilityIndex}/100`);
  }

  private displayFunctions(result: AnalysisResult): void {
    if (result.functions.length === 0) return;

    console.log(chalk.yellow.bold('\n🔧 FUNCTIONS ANALYSIS'));
    
    result.functions.forEach(fn => {
      console.log(`\n${chalk.cyan.bold(fn.name)}`);
      console.log(`  ${chalk.gray('Lines:')} ${fn.startLine}-${fn.endLine}`);
      console.log(`  ${chalk.gray('Parameters:')} ${fn.parameters}`);
      console.log(`  ${chalk.gray('Return Type:')} ${fn.returnType}`);
      console.log(`  ${chalk.gray('Cyclomatic:')} ${this.getComplexityColor(fn.complexity.cyclomatic, 10)}${fn.complexity.cyclomatic}`);
      console.log(`  ${chalk.gray('Cognitive:')} ${this.getComplexityColor(fn.complexity.cognitive, 15)}${fn.complexity.cognitive}`);
    });
  }

  private displayClasses(result: AnalysisResult): void {
    if (result.classes.length === 0) return;

    console.log(chalk.yellow.bold('\n🏗️  CLASSES ANALYSIS'));
    
    result.classes.forEach(cls => {
      console.log(`\n${chalk.magenta.bold(cls.name)}`);
      console.log(`  ${chalk.gray('Lines:')} ${cls.startLine}-${cls.endLine}`);
      console.log(`  ${chalk.gray('Methods:')} ${cls.methods.length}`);
      console.log(`  ${chalk.gray('Fields:')} ${cls.fields}`);
      console.log(`  ${chalk.gray('Complexity:')} ${this.getComplexityColor(cls.complexity.cyclomatic, 20)}${cls.complexity.cyclomatic}`);
    });
  }

  private displaySummary(result: AnalysisResult): void {
    console.log(chalk.yellow.bold('\n📋 SUMMARY'));
    
    const { summary } = result;
    
    console.log(`${chalk.gray('Total Functions:')} ${summary.totalFunctions}`);
    console.log(`${chalk.gray('Total Classes:')} ${summary.totalClasses}`);
    console.log(`${chalk.gray('Average Complexity:')} ${this.getComplexityColor(summary.averageComplexity, 10)}${summary.averageComplexity}`);
    
    if (summary.highComplexityFunctions.length > 0) {
      console.log(`${chalk.gray('High Complexity Functions:')} ${chalk.red(summary.highComplexityFunctions.join(', '))}`);
    }
  }

  private displayRecommendations(result: AnalysisResult): void {
    if (result.summary.recommendations.length === 0) {
      console.log(chalk.green.bold('\n✅ NO RECOMMENDATIONS - CODE LOOKS GOOD!'));
      return;
    }

    console.log(chalk.yellow.bold('\n💡 RECOMMENDATIONS'));
    
    result.summary.recommendations.forEach((rec, index) => {
      console.log(`${chalk.yellow(`${index + 1}.`)} ${rec}`);
    });
  }

  private getComplexityColor(value: number, threshold: number): string {
    if (value <= threshold * 0.5) return chalk.green('');
    if (value <= threshold) return chalk.yellow('');
    return chalk.red('');
  }

  private getMaintainabilityColor(value: number): string {
    if (value >= 80) return chalk.green('');
    if (value >= 60) return chalk.yellow('');
    return chalk.red('');
  }
}