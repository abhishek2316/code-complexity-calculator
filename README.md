code-complexity-analyzer/
├── package.json
├── README.md
├── LICENSE
├── .gitignore
├── .npmignore
├── bin/
│   └── complexity-analyzer.js          # CLI entry point
├── lib/
│   ├── index.js                        # Main API entry point
│   ├── cli.js                          # CLI logic and commands
│   ├── analyzer/
│   │   ├── index.js                    # Main analyzer orchestrator
│   │   ├── languages/ 
│   │   │   ├── base.js                 # Base analyzer class
│   │   │   ├── javascript.js           # JS/TS complexity analyzer
│   │   │   ├── python.js               # Python complexity analyzer
│   │   │   ├── java.js                 # Java complexity analyzer
│   │   │   ├── cpp.js                  # C++ complexity analyzer
│   │   │   └── registry.js             # Language registry
│   │   ├── complexity/
│   │   │   ├── cyclomatic.js           # Cyclomatic complexity
│   │   │   ├── cognitive.js            # Cognitive complexity
│   │   │   ├── time.js                 # Time complexity (Big-O)
│   │   │   ├── space.js                # Space complexity
│   │   │   └── metrics.js              # Combined metrics
│   │   └── detectors/
│   │       ├── languageDetector.js     # Auto language detection
│   │       └── fileTypeDetector.js     # File type detection
│   ├── utils/
│   │   ├── fileUtils.js                # File operations
│   │   ├── gitUtils.js                 # Git integration
│   │   ├── treeBuilder.js              # Directory tree builder
│   │   ├── configLoader.js             # Configuration management
│   │   └── logger.js                   # Logging utilities
│   └── output/
│       ├── console.js                  # Console output formatter
│       ├── file.js                     # File output handler
│       ├── formatter.js                # Output formatting
│       └── templates/
│           ├── report.txt              # Text report template
│           ├── report.json             # JSON report template
│           └── report.html             # HTML report template
├── config/
│   ├── default.json                    # Default configuration
│   └── languages.json                  # Language definitions
├── test/
│   ├── unit/                           # Unit tests
│   ├── integration/                    # Integration tests
│   ├── fixtures/                       # Test files
│   │   ├── javascript/
│   │   ├── python/
│   │   ├── java/
│   │   └── cpp/
│   └── sample-projects/                # Sample projects for testing
├── examples/
│   ├── single-file-analysis.js
│   ├── project-analysis.js
│   ├── github-repo-analysis.js
│   └── api-usage.js
└── docs/
    ├── API.md
    ├── CLI.md
    ├── LANGUAGES.md
    └── CONTRIBUTING.md