# SQLite Forensic Artifact Analyzer

<div align="center">
  
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Electron](https://img.shields.io/badge/electron-36.0.0-teal.svg)
![React](https://img.shields.io/badge/react-19.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/next.js-15.3.0-black.svg)

</div>

<div align="center">
  <i>A desktop-based digital forensics toolkit for SQLite database analysis</i>
</div>

## 📋 Overview

The SQLite Forensic Artifact Analyzer is a cross-platform desktop application for analyzing SQLite database artifacts commonly encountered in digital forensic investigations. Built with Electron and Next.js, it provides a comprehensive toolset for:

- **Validating** SQLite database files with cryptographic hashing
- **Analyzing** database structure, content, and metadata
- **Recovering** deleted records and damaged databases
- **Visualizing** data patterns and byte-level information
- **Examining** binary content with an advanced hex editor

## 🔍 Key Features

- **Cryptographic validation** with MD5, SHA1, and SHA256 hash verification
- **Forensic metadata extraction** including creation time, file properties, and SQLite version
- **Database structure analysis** with table schema display and content previews
- **Binary-level inspection** through an integrated hex editor
- **Data visualization** with byte histograms and entropy analysis
- **Optimization recommendations** for database performance
- **Deleted record recovery** capabilities
- **Timeline visualization** for temporal data
- **Entirely local processing** with no external API dependencies
- **Cross-platform support** for Windows, macOS, and Linux

## 🔧 Installation

### Download Release Builds

Pre-built versions for all major platforms are available on the [Releases](https://github.com/username/sqliteparser/releases) page.

#### Windows
- Download the `.exe` installer
- Run the installer and follow the prompts
- Launch from the Start menu

#### macOS
- Download the `.dmg` file
- Open and drag to Applications folder
- Launch from Applications

#### Linux
- Download the `.AppImage` file
- Make executable: `chmod +x SQLiteForensicAnalyzer.AppImage`
- Run: `./SQLiteForensicAnalyzer.AppImage`

### Building from Source

1. Clone the repository
```bash
git clone https://github.com/username/sqliteparser.git
cd sqliteparser
```

2. Install dependencies
```bash
npm install
```

3. Development mode
```bash
npm run dev
```

4. Build application packages
```bash
# For Windows
npm run package:win

# For macOS
npm run package:mac

# For Linux
npm run package:linux
```

## 📊 Usage Guide

1. **Launch** the SQLite Forensic Analyzer application
2. **Upload** a SQLite database file using drag-and-drop or the file selector
3. **Explore** the analysis through different tabs:
   - **Validation**: View file integrity information and hashes
   - **Forensic Analysis**: Examine detailed metadata and artifact properties
   - **Database Structure**: Browse tables, columns, and sample data
   - **Optimization**: View suggestions for database improvements
   - **Hex Editor**: Inspect and edit binary content
   - **Visualization**: View byte patterns and entropy analysis

## 💻 Technology Stack

- **Electron**: Cross-platform desktop application framework
- **Next.js**: React framework for the user interface
- **React**: UI component library
- **TypeScript**: Type-safe JavaScript for reliable code
- **Mantine UI**: Component library for modern interface
- **Recharts**: Data visualization library

## 🔐 Security & Privacy

- **All processing happens locally** on your computer
- **No data is sent to external servers** for analysis
- **File integrity** is maintained throughout the analysis process
- **Read-only analysis** by default to preserve evidence

## 🛠️ Development

### Project Structure

```
sqliteparser/
├── app/               # Next.js application
│   ├── api/           # API routes for internal communication
│   ├── components/    # React components 
│   └── page.tsx       # Main application page
├── electron/          # Electron-specific code
│   ├── main.js        # Main process
│   └── preload.js     # Preload script for IPC
├── public/            # Static assets
└── types/             # TypeScript type definitions
```

### Available Scripts

- `npm run dev` - Start the application in development mode
- `npm run build` - Build the application
- `npm run package:win` - Package for Windows
- `npm run package:mac` - Package for macOS
- `npm run package:linux` - Package for Linux

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- SQLite team for their incredible database engine
- Digital forensics community for research and methodologies
- Open source contributors who built the frameworks we rely on

---

<div align="center">
  <p><strong>SQLite Forensic Analyzer</strong><br>Advancing digital investigations through precision database analysis</p>
</div>
