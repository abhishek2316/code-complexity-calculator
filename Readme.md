code-complexity-analyzer/
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE
├── .gitignore
├── .npmignore
├── bin/
│   └── complexity-analyzer.ts          # CLI entry point
├── src/
│   ├── index.ts                        # Main API entry point
│   ├── cli.ts                          # CLI logic and commands
│   ├── types/
│   │   ├── index.ts                    # Common type definitions
│   │   ├── analyzer.ts                 # Analyzer-specific types
│   │   └── config.ts                   # Configuration types
│   ├── analyzer/
│   │   ├── index.ts                    # Main analyzer orchestrator
│   │   ├── languages/
│   │   │   ├── base.ts                 # Base analyzer class
│   │   │   ├── java.ts                 # Java complexity analyzer
│   │   │   └── registry.ts             # Language registry
│   │   ├── complexity/
│   │   │   ├── cyclomatic.ts           # Cyclomatic complexity
│   │   │   ├── cognitive.ts            # Cognitive complexity
│   │   │   ├── time.ts                 # Time complexity (Big-O)
│   │   │   ├── space.ts                # Space complexity
│   │   │   └── metrics.ts              # Combined metrics
│   │   └── detectors/
│   │       ├── languageDetector.ts     # Auto language detection
│   │       └── fileTypeDetector.ts     # File type detection
│   ├── utils/
│   │   ├── fileUtils.ts                # File operations
│   │   ├── configLoader.ts             # Configuration management
│   │   └── logger.ts                   # Logging utilities
│   └── output/
│       ├── console.ts                  # Console output formatter
│       ├── file.ts                     # File output handler
│       └── formatter.ts                # Output formatting
├── config/
│   ├── default.json                    # Default configuration
│   └── languages.json                  # Language definitions
├── dist/                               # Compiled JS files
├── test/
│   ├── unit/                          # Unit tests
│   ├── integration/                   # Integration tests
│   └── fixtures/                      # Test files
│       └── java/
└── examples/
    └── single-file-analysis.ts