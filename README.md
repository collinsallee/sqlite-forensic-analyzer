# SQLite Forensic Artifact Analyzer

A comprehensive digital forensics toolkit designed for in-depth analysis of SQLite database artifacts commonly encountered during digital investigations. This application combines advanced forensic techniques with an intuitive user interface to provide investigators with powerful analytical capabilities for SQLite databases found in browsers, mobile applications, messaging platforms, and system logs.

## 🔍 Core Forensic Capabilities

### File Analysis & Validation

- **Cryptographic Validation**
  - MD5, SHA1, and SHA256 hash calculation for chain of custody documentation
  - Header signature verification against SQLite standards
  - Page size and structure validation
  - File integrity assessment

- **Binary-Level Analysis**
  - Advanced hex editor with offset navigation
  - Pattern search and matching across binary content
  - Byte frequency analysis for anomaly detection
  - Entropy visualization to identify encrypted or compressed segments
  - Block-based analysis of database structure

- **Corruption Detection & Recovery**
  - Identification of corrupted database sections
  - Partial data recovery from damaged files
  - Automatic backup creation for forensic preservation
  - Detailed corruption analysis and reporting
  - Recovery suggestions based on corruption patterns

### Metadata Extraction

- **Database Properties**
  - SQLite version identification and compatibility analysis
  - Page size and encoding detection
  - Database configuration parameters extraction
  - Schema validation against expected patterns
  - Foreign key relationship mapping

- **Temporal Analysis**
  - Creation timestamp extraction
  - Last modification time identification
  - Record timestamp patterns analysis
  - Temporal inconsistency detection
  - Chronological event reconstruction

- **File System Integration**
  - File system metadata correlation
  - Physical storage allocation analysis
  - Journal and WAL file detection
  - Temporary files identification
  - Database attachment analysis

### Advanced Artifact Analysis

- **Artifact Type Detection**
  - Automatic identification of common SQLite artifacts:
    - Web browser history databases (Chrome, Firefox, Safari)
    - Mobile messaging databases (WhatsApp, Signal, Telegram)
    - Email and contact stores (Thunderbird, Apple Mail)
    - System logs and configuration databases
    - Application-specific databases with tailored analysis

- **Schema Analysis**
  - Detailed table structure examination
  - Index usage analysis for performance assessment
  - Trigger and view identification and validation
  - Foreign key relationship mapping
  - Database structure visualization

- **Content Analysis**
  - Record sampling and validation
  - Pattern matching within content
  - Deleted record detection and recovery
  - Binary blob analysis and extraction
  - Statistical analysis of data distributions

- **Investigative Insights**
  - Targeted recommendations based on artifact type
  - Key data points identification
  - Potential areas of interest highlighting
  - Common investigation patterns support
  - Case-specific content extraction guidance

## 🛠️ Technical Implementation

### Frontend Architecture

- **React + TypeScript Framework**
  - Written in TypeScript for robust type safety
  - Component-based architecture for modularity
  - State management using React hooks and context
  - Responsive design for various screen sizes
  - Accessibility compliance for broad usability

- **Mantine UI Components**
  - Cohesive design system with consistent UI elements
  - Light/dark mode support
  - Custom theme with forensic-focused color schemes
  - Responsive grid layouts
  - Interactive data visualization components

- **Advanced Interactive Components**
  - **HexEditor**: Full-featured binary viewer and editor
    - Multi-mode selection (byte, ASCII, range)
    - Inline editing with validation
    - Offset navigation and bookmarking
    - Copy/export selected regions
    - Pattern highlighting

  - **SearchTools**: Pattern matching and navigation
    - Hex pattern searching with regular expression support
    - ASCII string searching across binary content
    - Bookmark management for important offsets
    - Search history with result previews
    - Jump-to-offset functionality

  - **Visualization Engine**
    - Byte frequency histograms
    - Entropy heat mapping
    - Structure visualization
    - Timeline charts for temporal data
    - Relationship graphs for database entities

### Backend Implementation

- **FastAPI Server**
  - High-performance asynchronous API
  - OpenAPI documentation
  - Type-validated request/response models
  - Error handling with forensic context
  - CORS support for secure client-server communication

- **SQLite Forensic Parser**
  - Low-level binary parsing for database files
  - Page-by-page analysis of database content
  - Header and structure validation
  - Schema extraction and validation
  - Custom parsers for common artifact types

- **Data Recovery Engine**
  - B-tree structure analysis for deleted record recovery
  - Journal and WAL file analysis
  - Automatic corruption detection and recovery
  - Partial file analysis capabilities
  - Freelist and unallocated space scanning

- **Backup Management System**
  - Automatic backup creation before analysis
  - Version tracking for forensic timeline
  - Backup restoration capabilities
  - Comparison between versions
  - Chain of custody documentation

## 📊 Forensic Analysis Workflow

### 1. Evidence Acquisition

- **File Upload & Initial Validation**
  - Upload SQLite database artifact securely
  - Automatic hash calculation (MD5, SHA1, SHA256)
  - Initial file signature verification
  - Size and basic structure validation
  - Immediate backup creation for forensic preservation

- **Integrity Assessment**
  - Header structure examination
  - Page size verification
  - Journal mode detection
  - Corruption level assessment
  - Recovery determination

### 2. Preliminary Analysis

- **Artifact Identification**
  - Schema matching against known patterns
  - Table name and structure recognition
  - Application-specific identifiers detection
  - Custom artifact rule matching
  - Confidence scoring for identification

- **Metadata Extraction**
  - File creation and modification times
  - SQLite version information
  - Application-specific metadata
  - User version and application ID parsing
  - Configuration parameter extraction

- **Structure Analysis**
  - Database schema mapping
  - Table relationships identification
  - Index and view examination
  - Trigger functionality assessment
  - Database size and optimization analysis

### 3. In-Depth Investigation

- **Content Examination**
  - Record sampling from key tables
  - Statistical analysis of data patterns
  - Timeline reconstruction from timestamps
  - User activity pattern identification
  - Relationship mapping between entities

- **Deleted Data Recovery**
  - Freelist analysis for recently deleted records
  - B-tree page scanning for orphaned data
  - Journal file analysis for transaction recovery
  - WAL file examination for uncommitted changes
  - Pattern-based recovery for fragmented data

- **Binary Analysis**
  - Hex-level examination of database pages
  - Pattern searching across binary content
  - Entropy analysis for encrypted content
  - Byte frequency analysis for data type identification
  - Structure boundary identification

### 4. Findings & Reporting

- **Investigation Insights**
  - Artifact-specific interpretations
  - Key evidence highlighting
  - Timeline construction guidance
  - Related artifact suggestions
  - Follow-up investigation recommendations

- **Technical Documentation**
  - Database structure details
  - Corruption analysis findings
  - Recovery attempts and results
  - Hash verification for evidence integrity
  - Binary-level anomalies

- **Visualization & Presentation**
  - Data pattern visualizations
  - Timeline charts for temporal data
  - Structure relationship diagrams
  - Statistical distribution graphs
  - Binary content heat maps

## 💻 Technology Stack

### Frontend
- **Framework**: React with Next.js
- **Language**: TypeScript
- **UI Components**: Mantine UI library
- **Data Visualization**: Recharts
- **Binary Analysis**: Custom hex editor implementation
- **State Management**: React Context API and hooks

### Backend
- **API Framework**: Python FastAPI
- **Database Parsing**: Custom SQLite binary parser
- **Forensic Analysis**: Specialized Python modules
- **File Handling**: Multipart file upload with streaming processing
- **Validation**: Pydantic models for request/response validation
- **Error Handling**: Comprehensive forensic-focused error system

## 🚀 Installation

### Prerequisites
- Node.js 16+ and npm/yarn
- Python 3.9+
- Git

### Setup Instructions

1. **Clone the Repository**
```bash
git clone https://github.com/yourusername/sqlite-forensic-analyzer.git
cd sqlite-forensic-analyzer
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd ../app
npm install
```

4. **Launch Application**

Start the backend server:
```bash
cd ../backend
python run.py
```

Start the frontend development server:
```bash
cd ../app
npm run dev
```

Navigate to http://localhost:3000 in your browser

## 🧰 Common Forensic Use Cases

### Browser History Investigation
The analyzer excels at extracting and interpreting browser history databases, enabling investigators to:
- Reconstruct browsing timelines with precise timestamps
- Identify frequently visited domains and search patterns
- Recover deleted browsing history entries
- Correlate visits across multiple browser profiles
- Extract and analyze download history and cache references

### Mobile Application Analysis
For mobile device investigations, the analyzer provides specialized capabilities for:
- Messaging application databases (WhatsApp, Signal, Telegram)
- Contact databases with communication metadata
- Social media application caches and local storage
- Location history and tracking databases
- Application-specific user activity logs

### System Log Examination
When investigating system logs stored in SQLite format, the analyzer offers:
- Chronological reconstruction of system events
- User activity correlation across multiple logs
- Authentication and access attempt analysis
- Configuration change tracking and validation
- System state reconstruction for specific timeframes

### Custom Artifact Analysis
The flexible architecture allows for examination of custom or unknown SQLite artifacts:
- Generic structure analysis for unknown databases
- Pattern matching for specific content types
- Timestamp extraction and normalization
- Binary blob extraction and analysis
- Schema comparison against known application patterns

## 🔐 Security & Forensic Integrity

### Evidence Preservation
- Automatic backup creation before any analysis
- Read-only analysis by default to preserve original files
- Hash validation at multiple processing stages
- Audit logging of all operations performed on evidence
- Detailed documentation of analysis steps

### Chain of Custody
- Cryptographic validation of file integrity
- Timestamped backup versions
- Comprehensive metadata tracking
- Modification logging for any edited content
- Exportable analysis reports with verification hashes

## 📘 Advanced Usage

### Command Line Interface
In addition to the web interface, power users can access the analyzer's functionality through a command-line interface:
```bash
python -m forensic_analyzer --file /path/to/database.sqlite --report-format json
```

### Analysis Profiles
Create custom analysis profiles for specific investigation types:
```json
{
  "profile_name": "browser_history",
  "target_tables": ["urls", "visits"],
  "extract_fields": ["url", "title", "visit_count", "last_visit_time"],
  "timeline_field": "last_visit_time",
  "deleted_record_recovery": true
}
```

### API Integration
Integrate the analyzer into your own forensic workflow using the REST API:
```python
import requests

response = requests.post(
    "http://localhost:8000/api/analyze",
    files={"file": open("evidence.sqlite", "rb")},
    data={"profile": "browser_history"}
)

analysis_results = response.json()
```

## 🤝 Contributing

Contributions to the SQLite Forensic Artifact Analyzer are welcome! Whether you're adding support for new artifact types, improving the analysis algorithms, or enhancing the user interface, please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

For major changes, please open an issue first to discuss what you would like to change.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- SQLite development team for their incredible database engine
- Digital forensics community for research and methodologies
- Open source contributors to forensic tools and libraries
- Academic researchers in digital forensics and artifact analysis
