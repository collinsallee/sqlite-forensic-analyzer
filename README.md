# SQLite Forensic Artifact Analyzer

<div align="center">
  
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Python](https://img.shields.io/badge/python-3.9+-red.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.103.1-teal.svg)
![React](https://img.shields.io/badge/react-18.0.0-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0.0-yellow.svg)

</div>

<div align="center">
  <i>A comprehensive digital forensics toolkit designed for expert analysis of SQLite database artifacts</i>
</div>

<br>

> **Note:** This tool is designed for professional forensic investigators, digital evidence examiners, and security researchers to analyze SQLite database artifacts with precision and forensic integrity.

## 📋 Table of Contents

- [Introduction](#-introduction)
- [Core Forensic Capabilities](#-core-forensic-capabilities)
- [Technical Implementation](#-technical-implementation)
- [Forensic Analysis Workflow](#-forensic-analysis-workflow)
- [Technology Stack](#-technology-stack)
- [Installation & Setup](#-installation--setup)
- [Usage Guide](#-usage-guide)
- [Common Forensic Use Cases](#-common-forensic-use-cases)
- [Security & Forensic Integrity](#-security--forensic-integrity)
- [Advanced Usage](#-advanced-usage)
- [API Reference](#-api-reference)
- [Error Recovery System](#-error-recovery-system)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

## 🔍 Introduction

The SQLite Forensic Artifact Analyzer is a state-of-the-art digital forensics tool developed for comprehensive analysis of SQLite database artifacts encountered in digital investigations. Built with a focus on forensic integrity and evidence validation, this tool provides investigators with powerful capabilities to examine, analyze, and interpret SQLite databases commonly found across various digital platforms.

### Why SQLite Forensics Matters

SQLite databases form the backbone of data storage in numerous applications across different platforms:

- **Mobile Devices**: Most Android and iOS apps store data in SQLite format (Messages, Contacts, Call Logs)
- **Web Browsers**: Chrome, Firefox, Safari store browsing history, bookmarks, cookies as SQLite files
- **Desktop Applications**: Many applications use SQLite for local data storage
- **IoT Devices**: Smart devices often log events and configurations in SQLite format
- **Operating Systems**: Many system logs and configuration settings use SQLite

These databases often contain critical evidence in digital investigations, including communication records, user activities, authentication events, and application usage patterns.

## 🔍 Core Forensic Capabilities

### File Analysis & Validation

#### Cryptographic Validation
The analyzer implements thorough cryptographic validation to ensure evidence integrity throughout the investigation process:

- **Multi-Hash Verification**: Automatic calculation of MD5, SHA1, and SHA256 hashes for all artifacts
- **Chain of Custody Documentation**: Cryptographic validation at each processing stage with timestamp recording
- **Header Signature Analysis**: Deep inspection of SQLite header signatures against standard specifications
- **Page Structure Verification**: Validation of individual database pages for structural integrity
- **Corruption Identification**: Precise detection of corruption patterns with offset recording

#### Binary-Level Analysis
Sophisticated binary analysis capabilities allow examiners to inspect and interpret raw database content:

- **Advanced Hex Editor**:
  - Byte-level viewing and navigation with multiple selection modes
  - Color-coded data representation for pattern recognition
  - Multi-format interpretation (hex, decimal, binary, ASCII)
  - Specialized visualization of SQLite page structures
  - Integrated bookmarking system for important offsets

- **Pattern Matching Engine**:
  - Regular expression searching across binary content
  - Preset patterns for known artifacts (email addresses, URLs, timestamps)
  - Custom pattern creation and saving
  - Context-aware search results with surrounding data
  - Batch pattern analysis with exportable results

- **Statistical Analysis**:
  - Byte frequency distribution with anomaly detection
  - Entropy calculation with visualized heat mapping
  - Binary similarity comparison between artifacts
  - Encrypted section identification
  - Compression algorithm detection

#### Corruption Detection & Recovery
Advanced recovery techniques for extracting data from damaged or partially corrupted database files:

- **Multi-Level Recovery**:
  - Page-level recovery for partially damaged databases
  - B-tree reconstruction for recoverable indices
  - Freelist analysis for deleted content recovery
  - WAL/Journal integration for transaction recovery
  - Carving techniques for fragmented data

- **Automated Backup System**:
  - Incremental backups during analysis
  - Version control for forensic timeline
  - Validation hashing for each backup
  - Recovery point creation before risky operations
  - Cross-reference system between backups

- **Error Analysis**:
  - Detailed error categorization by severity and type
  - Corruption pattern recognition for common issues
  - Root cause analysis for database integrity problems
  - Recovery recommendation engine based on error types
  - Success probability estimation for recovery operations

### Metadata Extraction

#### Database Properties
Comprehensive extraction of SQLite database properties with forensic interpretation:

- **Version Analysis**:
  - SQLite engine version identification
  - Schema version tracking
  - Compatibility assessment
  - Feature support determination
  - Security vulnerability identification based on version

- **Configuration Parameters**:
  - Page size detection and optimization analysis
  - Encoding scheme identification with language assessment
  - Cache size configuration review
  - Vacuum settings and history
  - Auto-vacuum configuration

- **Schema Intelligence**:
  - Full schema extraction with relationship mapping
  - Foreign key consistency validation
  - Index optimization assessment
  - Constraint validation and enforcement checking
  - Schema evolution tracking where possible

#### Temporal Analysis
Advanced timestamp analysis for event reconstruction and timeline development:

- **Timestamp Extraction**:
  - Creation time recovery from file system metadata
  - Last modification time validation
  - Last access time preservation
  - Database internal timestamps extraction
  - Record-level timestamp analysis

- **Chronology Reconstruction**:
  - Timeline visualization of database events
  - Transaction sequence reconstruction
  - User activity pattern analysis
  - Temporal clustering of related events
  - Time zone normalization and interpretation

- **Inconsistency Detection**:
  - Timestamp anomaly identification
  - Clock skew detection
  - Anti-forensic timestamp manipulation detection
  - Cross-validation with system events
  - Timeline gap analysis

### Advanced Artifact Analysis

#### Artifact Type Detection
Intelligent identification of database origins and purpose using signature-based and heuristic approaches:

- **Signature Database**:
  - Extensive catalog of known SQLite artifact signatures
  - Regular updates to signature definitions
  - Confidence scoring for artifact matches
  - Multiple identification methods for cross-validation
  - Custom signature creation capabilities

- **Browser Artifact Analysis**:
  - Browser type identification (Chrome, Firefox, Safari, Edge)
  - Artifact categorization (History, Bookmarks, Cache, Cookies)
  - Cross-browser correlation
  - Browser version determination
  - Private browsing artifact detection

- **Mobile Application Detection**:
  - OS determination (iOS, Android)
  - Application identification by schema patterns
  - Version-specific analysis adaptations
  - Common app database recognition (WhatsApp, Signal, Telegram)
  - Third-party application identification

#### Content Analysis
Deep inspection of database content with investigative focus:

- **Record Analysis**:
  - Intelligent sampling of significant records
  - BLOB data extraction and interpretation
  - Statistical analysis of content patterns
  - Outlier detection for unusual entries
  - Correlation of related records across tables

- **Deleted Content Recovery**:
  - Freelist scanning for recently deleted records
  - Page analysis for remnant data
  - Transaction log integration for uncommitted deletions
  - Pattern-based carving for overwritten data
  - SQLite internal structures leveraging for recovery

- **Data Interpretation**:
  - Content type recognition (text, images, audio, etc.)
  - Format-specific analysis for common data types
  - Embedded metadata extraction
  - Encoded/encrypted content detection
  - Multilingual text analysis and character set detection

## 🛠️ Technical Implementation

### Frontend Architecture

#### React + TypeScript Framework
Modern frontend implementation focusing on performance and type safety:

- **Component Architecture**:
  - Atomic design pattern implementation
  - Strict component isolation for testing
  - Performance-optimized rendering
  - Server-side rendering support
  - Progressive loading of large datasets

- **State Management**:
  - Context-based state architecture
  - Optimized reducer patterns
  - Middleware for complex operations
  - Persistent state with encryption
  - Memory-efficient handling of large binary data

- **Performance Optimizations**:
  - Virtualized rendering for large datasets
  - Worker-based processing for intensive operations
  - Progressive loading of binary content
  - Efficient DOM updates with key optimization
  - Code splitting and lazy loading

#### Interactive Components

- **HexEditor**:
  - Multi-view modes (hex, decimal, binary, ASCII)
  - Binary structure templates for SQLite-specific elements
  - In-place editing with validation
  - Undo/redo functionality with change tracking
  - Integration with analysis tools

- **SearchTools**:
  - Pattern highlighting in real-time
  - Regular expression builder with testing
  - Search result navigation
  - Context-aware result display
  - Search history with tagging

- **Visualization Engine**:
  - Interactive byte frequency histograms
  - Zoomable entropy maps
  - Timeline visualizations for temporal data
  - Structure relationship graphs
  - Customizable visualization parameters

### Backend Implementation

#### FastAPI Server
High-performance asynchronous backend designed for reliability and security:

- **API Design**:
  - RESTful endpoint architecture
  - OpenAPI documentation with interactive testing
  - Rate limiting and request validation
  - Authentication framework for secure access
  - Comprehensive error handling

- **Performance**:
  - Asynchronous request processing
  - Streaming response for large data sets
  - Optimized database connections
  - In-memory caching for frequent operations
  - Background task processing for long-running operations

#### SQLite Forensic Parser
Custom-built parser for forensic-grade SQLite analysis:

- **Binary Parsing**:
  - Low-level file format parsing
  - Page-by-page analysis with integrity verification
  - Header structure validation
  - B-tree traversal and analysis
  - Custom handling for various SQLite versions

- **Recovery Techniques**:
  - Transaction log integration
  - Freelist analysis
  - Orphaned page detection
  - Partial page recovery
  - Schema-based data interpretation

- **Performance Optimizations**:
  - Memory-mapped file access
  - Incremental parsing for large files
  - Parallel processing where applicable
  - Caching of intermediate results
  - Selective parsing based on investigation focus

## 📊 Forensic Analysis Workflow

### 1. Evidence Acquisition

- **Secure Upload Process**:
  - Tamper-evident upload mechanism
  - Real-time hash calculation
  - Progress tracking for large files
  - Automatic file type validation
  - Metadata preservation

- **Initial Validation**:
  - Header signature verification
  - Page structure assessment
  - Quick corruption check
  - Schema validation
  - File system metadata capture

### 2. Preliminary Analysis

- **Automated Triage**:
  - Artifact type classification
  - Significance assessment
  - Content preview generation
  - Quick search for common evidence markers
  - Priority determination for further analysis

- **Structure Mapping**:
  - Schema reconstruction
  - Table relationship mapping
  - Index analysis
  - Trigger identification
  - View reconstruction

### 3. In-Depth Investigation

- **Content Examination**:
  - Intelligent record sampling
  - Pattern matching across content
  - Timeline reconstruction
  - User activity profiling
  - Relationship mapping

- **Binary Analysis**:
  - Hex viewer navigation to key structures
  - Pattern searching for specific content
  - Byte-level inspection of critical data
  - Structure boundary identification
  - Free space analysis

### 4. Findings & Reporting

- **Evidence Documentation**:
  - Detailed findings compilation
  - Chain of custody maintenance
  - Hash verification at each stage
  - Analyst activity logging
  - Evidence cross-referencing

- **Report Generation**:
  - Customizable report templates
  - Multiple export formats (PDF, HTML, JSON)
  - Evidence inclusion with validation hashes
  - Timeline visualizations
  - Technical and executive summary options

## 💻 Technology Stack

### Frontend
- **Core Framework**: React 18 with Next.js 13
- **Language**: TypeScript 5.0 (strict mode)
- **UI Components**: Mantine UI 7.0
- **State Management**: React Context API + useReducer
- **Data Fetching**: SWR with custom caching
- **Visualization**: Recharts + D3.js
- **Binary Handling**: Custom ArrayBuffer utilities
- **Performance**: React.memo, useMemo, virtualization
- **Testing**: Jest + React Testing Library
- **Build Tools**: Webpack 5 with optimization plugins

### Backend
- **API Framework**: FastAPI 0.103.1
- **Language**: Python 3.9+
- **Database Parsing**: Custom SQLite binary parser
- **Authentication**: JWT with role-based permissions
- **Validation**: Pydantic v2 with custom validators
- **Error Handling**: Structured exception system with codes
- **Logging**: Structured logging with correlation IDs
- **Performance**: Async processing, memory-mapped files
- **Testing**: Pytest with property-based testing
- **Documentation**: OpenAPI with ReDoc integration

## 🚀 Installation & Setup

### System Requirements
- **Operating System**: Windows 10/11, macOS 12+, Linux (Ubuntu 20.04+, CentOS 8+)
- **Memory**: 8GB RAM minimum, 16GB+ recommended for large database analysis
- **Storage**: 2GB for application, additional space for database analysis
- **Processor**: Modern multi-core CPU (4+ cores recommended)
- **Browser**: Chrome 90+, Firefox 90+, Edge 90+ (for web interface)

### Prerequisites
- Node.js 16+ and npm 8+/yarn 1.22+
- Python 3.9+ with pip and venv
- Git 2.30+

### Detailed Setup Instructions

1. **Clone the Repository**
```bash
git clone https://github.com/yourusername/sqlite-forensic-analyzer.git
cd sqlite-forensic-analyzer
```

2. **Backend Setup**
```bash
# Create and activate virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies with version pinning
pip install -r requirements.txt

# Initialize database (if applicable)
python init_db.py

# Run database migrations
python migrate.py

# Configure environment (optional)
cp .env.example .env
# Edit .env file with your configuration
```

3. **Frontend Setup**
```bash
cd ../app

# Install dependencies
npm install

# Build optimized assets (optional for development)
npm run build
```

4. **Launch Application**

Start the backend server:
```bash
cd ../backend
python run.py
# Server will start at http://localhost:8000
```

Start the frontend development server:
```bash
cd ../app
npm run dev
# Development server will start at http://localhost:3000
```

5. **Verify Installation**
   - Navigate to http://localhost:3000 in your browser
   - Confirm API connectivity at http://localhost:8000/docs
   - Test a sample SQLite database upload

## 🧰 Common Forensic Use Cases

### Browser History Investigation
The analyzer excels at extracting and interpreting browser history databases, enabling investigators to:

- **Timeline Reconstruction**:
  - Chronological visualization of browsing activity
  - Session identification and separation
  - Time spent on specific sites
  - Navigation patterns and sequences
  - Correlation with other system activities

- **Content Analysis**:
  - URL categorization and analysis
  - Search term extraction and analysis
  - Downloaded content identification
  - Form submission reconstruction
  - Login activity detection

- **User Behavior Profiling**:
  - Frequently visited domains analysis
  - Time-of-day browsing patterns
  - Content interest categorization
  - Search intent analysis
  - Cross-device browsing correlation

### Mobile Application Analysis
For mobile device investigations, the analyzer provides specialized capabilities for:

- **Messaging Applications**:
  - Contact extraction with metadata
  - Message timeline reconstruction
  - Media file recovery and analysis
  - Deleted message recovery
  - Cross-platform message correlation

- **Location History**:
  - Movement timeline visualization
  - Frequently visited location analysis
  - Dwell time calculation
  - Route reconstruction
  - Location metadata extraction

- **Application Usage**:
  - App usage patterns and frequency
  - First/last usage timestamps
  - Configuration settings extraction
  - User credentials recovery (where legally permitted)
  - Cross-application data correlation

### Custom Artifact Analysis
The flexible architecture allows for examination of custom or unknown SQLite artifacts:

- **Schema Fingerprinting**:
  - Automatic comparison against known application schemas
  - Structural similarity matching
  - Table purpose determination
  - Data type pattern analysis
  - Application function inference

- **Content Interpretation**:
  - Intelligent data type detection
  - Format-specific parsing and visualization
  - Custom parser development framework
  - Pattern extraction for unknown formats
  - Cross-reference with known artifacts

## 🔐 Security & Forensic Integrity

### Evidence Preservation
The analyzer implements multiple mechanisms to ensure evidence integrity:

- **Non-Destructive Analysis**:
  - Read-only processing by default
  - Working copy creation for analysis
  - Original hash verification at all stages
  - Write protection enforcement
  - Background hash verification

- **Audit Logging**:
  - Comprehensive activity logging
  - Timestamped operation recording
  - Analyst identification in logs
  - Action type categorization
  - Before/after state recording for critical operations

### Chain of Custody
Advanced features to maintain proper evidence handling:

- **Provenance Tracking**:
  - Source documentation with metadata
  - Acquisition method recording
  - Processing history preservation
  - Transfer logging with validation
  - Access control enforcement

- **Evidence Packaging**:
  - Cryptographically sealed evidence containers
  - Metadata enrichment for context
  - Multiple hash algorithm support
  - Digital signature capabilities
  - Tamper-evident sealing

## 📘 Advanced Usage

### Command Line Interface
The analyzer provides a powerful CLI for automation and scripting:

```bash
# Basic usage
python -m forensic_analyzer --file /path/to/database.sqlite --output-format json

# Advanced usage with analysis profile
python -m forensic_analyzer --file /path/to/database.sqlite --profile browser_history --depth full --include-deleted --timeline-focus

# Batch processing
python -m forensic_analyzer --batch /path/to/databases/ --recursive --output-dir /path/to/results/ --threads 4
```

### Custom Plugins
The analyzer supports a plugin architecture for extending functionality:

```python
# Example custom parser plugin
from forensic_analyzer.plugins import ArtifactParser

class MyCustomParser(ArtifactParser):
    """Parser for MyApp database artifacts."""
    
    artifact_name = "myapp_database"
    signature_tables = ["users", "activities", "settings"]
    
    def extract_timeline(self, database):
        """Extract timeline events from the artifact."""
        timeline = []
        cursor = database.cursor()
        cursor.execute("SELECT timestamp, action, user_id FROM activities ORDER BY timestamp")
        for timestamp, action, user_id in cursor.fetchall():
            timeline.append({
                "timestamp": self.normalize_timestamp(timestamp),
                "action": action,
                "user_id": user_id,
                "source": "MyApp Activity"
            })
        return timeline
```

### API Reference
The analyzer exposes a comprehensive REST API for integration:

#### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload a database file |
| `/api/validate` | POST | Validate database integrity |
| `/api/analyze` | POST | Perform comprehensive analysis |
| `/api/hex_dump` | POST | Get hex representation of file |
| `/api/search` | POST | Search for patterns in database |
| `/api/backups` | GET | List available backups |
| `/api/visualization/histogram` | POST | Generate byte frequency histogram |
| `/api/visualization/entropy` | POST | Calculate entropy analysis |

#### Example API Usage

```python
import requests

# Upload a database file
with open('evidence.sqlite', 'rb') as f:
    response = requests.post(
        "http://localhost:8000/api/upload",
        files={"file": f}
    )
file_id = response.json()['file_id']

# Analyze the database
analysis_response = requests.post(
    "http://localhost:8000/api/analyze",
    data={"file_id": file_id}
)

# Get results
analysis_results = analysis_response.json()
```

## 🔄 Error Recovery System

The analyzer includes a sophisticated error recovery system for handling corrupted or damaged database files:

### Recovery Levels

- **Level 1: Header Reconstruction**
  - SQLite header repair for minor corruption
  - Page size recalculation
  - Signature verification and correction

- **Level 2: Page Recovery**
  - Individual page integrity checks
  - B-tree structure rebuilding
  - Orphaned page reconnection

- **Level 3: Schema Recovery**
  - Master table extraction attempts
  - Schema inference from content
  - Table structure reconstruction

- **Level 4: Content Salvage**
  - Record-by-record extraction
  - Partial data recovery
  - Content carving from raw binary

### Backup Management

The analyzer maintains a comprehensive backup system:

- **Automatic Backups**
  - Pre-analysis state preservation
  - Incremental backups during processing
  - Recovery point creation before risky operations

- **Backup Browser**
  - Visual exploration of backup history
  - Comparison between backup versions
  - Selective restoration of specific elements

## 🤝 Contributing

Contributions to the SQLite Forensic Artifact Analyzer are welcome! We value input from the digital forensics community to enhance the tool's capabilities.

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/sqlite-forensic-analyzer.git`
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Follow the installation instructions above
5. Make your changes
6. Run tests: `cd backend && pytest` and `cd ../app && npm test`
7. Commit your changes: `git commit -m 'Add amazing feature'`
8. Push to the branch: `git push origin feature/amazing-feature`
9. Open a Pull Request

### Contribution Guidelines

- Follow code style guidelines
- Add tests for new features
- Update documentation
- Keep pull requests focused on a single topic
- Reference issues in pull requests

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- SQLite development team for their incredible database engine
- Digital forensics community for research methodologies and standards
- Open source contributors who have built the foundations for this work
- Academic researchers advancing the field of digital artifact analysis
- The many investigators who provided valuable feedback during development

---

<div align="center">
  <p><strong>SQLite Forensic Artifact Analyzer</strong><br>Advancing digital investigations through precision database analysis</p>
</div>
