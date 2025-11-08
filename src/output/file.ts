// import * as fs from 'fs-extra';
// import * as path from 'path';
// import { AnalysisResult } from '../types';

// export class FileOutput {
//   async save(result: AnalysisResult, filename: string, format: string): Promise<void> {
//     const outputPath = path.resolve(filename);
    
//     let content: string;
    
//     switch (format) {
//       case 'json':
//         content = JSON.stringify(result, null, 2);
//         break;
//       case 'csv':
//         content = this.generateCSV(result);
//         break;
//       case 'txt':
//       default:
//         content = this.generateTextReport(result);
//         break;
//     }
    
//     await fs.writeFile(outputPath, content, 'utf-8');
//   }

//   private generateTextReport(result: AnalysisResult): string {
//     const lines: string[] = [];
    
//     lines.push('CODE COMPLEXITY ANALYSIS REPORT');
//     lines.push('=' .repeat(50));
//     lines.push('');
    
//     // File Information
//     lines.push('FILE INFORMATION');
//     lines.push('-'.repeat(20));
//     lines.push(`File: ${result.filePath}`);
//     lines.push(`Language: ${result.language.toUpperCase()}`);
//     lines.push(`Size: ${result.metadata.fileSize} bytes`);
//     lines.push(`Lines: ${result.complexity.linesOfCode}`);
//     lines.push(`Analyzed: ${new Date(result.metadata.analyzedAt).toLocaleString()}`);
//     lines.push('');
    
//     // Overall Complexity
//     lines.push('OVERALL COMPLEXITY');
//     lines.push('-'.repeat(20));
//     lines.push(`Cyclomatic Complexity: ${result.complexity.cyclomatic}`);
//     lines.push(`Cognitive Complexity: ${result.complexity.cognitive}`);
//     lines.push(`Time Complexity: ${result.complexity.timeComplexity}`);
//     lines.push(`Space Complexity: ${result.complexity.spaceComplexity}`);
//     lines.push(`Maintainability Index: ${result.complexity.maintainabilityIndex}/100`);
//     lines.push('');
    
//     // Functions
//     if (result.functions.length > 0) {
//       lines.push('FUNCTIONS ANALYSIS');
//       lines.push('-'.repeat(20));
//       result.functions.forEach(fn => {
//         lines.push(`${fn.name}:`);
//         lines.push(`  Lines: ${fn.startLine}-${fn.endLine}`);
//         lines.push(`  Parameters: ${fn.parameters}`);
//         lines.push(`  Return Type: ${fn.returnType}`);
//         lines.push(`  Cyclomatic: ${fn.complexity.cyclomatic}`);
//         lines.push(`  Cognitive: ${fn.complexity.cognitive}`);
//         lines.push('');
//       });
//     }
    
//     // Classes
//     if (result.classes.length > 0) {
//       lines.push('CLASSES ANALYSIS');
//       lines.push('-'.repeat(20));
//       result.classes.forEach(cls => {
//         lines.push(`${cls.name}:`);
//         lines.push(`  Lines: ${cls.startLine}-${cls.endLine}`);
//         lines.push(`  Methods: ${cls.methods.length}`);
//         lines.push(`  Fields: ${cls.fields}`);
//         lines.push(`  Complexity: ${cls.complexity.cyclomatic}`);
//         lines.push('');
//       });
//     }
    
//     // Summary
//     lines.push('SUMMARY');
//     lines.push('-'.repeat(20));
//     lines.push(`Total Functions: ${result.summary.totalFunctions}`);
//     lines.push(`Total Classes: ${result.summary.totalClasses}`);
//     lines.push(`Average Complexity: ${result.summary.averageComplexity}`);
    
//     if (result.summary.highComplexityFunctions.length > 0) {
//       lines.push(`High Complexity Functions: ${result.summary.highComplexityFunctions.join(', ')}`);
//     }
//     lines.push('');
    
//     // Recommendations
//     if (result.summary.recommendations.length > 0) {
//       lines.push('RECOMMENDATIONS');
//       lines.push('-'.repeat(20));
//       result.summary.recommendations.forEach((rec, index) => {
//         lines.push(`${index + 1}. ${rec}`);
//       });
//     } else {
//       lines.push('NO RECOMMENDATIONS - CODE LOOKS GOOD!');
//     }
    
//     return lines.join('\n');
//   }

//   private generateCSV(result: AnalysisResult): string {
//     const rows: string[] = [];
    
//     // Header
//     rows.push('Type,Name,StartLine,EndLine,CyclomaticComplexity,CognitiveComplexity,TimeComplexity,SpaceComplexity,Parameters,ReturnType');
    
//     // File level
//     rows.push(`File,${path.basename(result.filePath)},1,${result.complexity.linesOfCode},${result.complexity.cyclomatic},${result.complexity.cognitive},${result.complexity.timeComplexity},${result.complexity.spaceComplexity},N/A,N/A`);
    
//     // Functions
//     result.functions.forEach(fn => {
//       rows.push(`Function,${fn.name},${fn.startLine},${fn.endLine},${fn.complexity.cyclomatic},${fn.complexity.cognitive},${fn.complexity.timeComplexity},${fn.complexity.spaceComplexity},${fn.parameters},${fn.returnType}`);
//     });
    
//     // Classes
//     result.classes.forEach(cls => {
//       rows.push(`Class,${cls.name},${cls.startLine},${cls.endLine},${cls.complexity.cyclomatic},${cls.complexity.cognitive},${cls.complexity.timeComplexity},${cls.complexity.spaceComplexity},${cls.fields},N/A`);
//     });
    
//     return rows.join('\n');
//   }
// }