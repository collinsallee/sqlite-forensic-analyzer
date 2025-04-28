# Hex Editor for SQLite Forensic Artifact Analyzer

The Hex Editor is a powerful feature of the SQLite Forensic Artifact Analyzer that allows digital forensic investigators to examine and modify the binary content of SQLite database files at the byte level.

## Features

- **Binary Viewing**: Examine the raw hexadecimal and ASCII representation of any SQLite database file
- **Precise Navigation**: Jump to specific byte offsets within the file
- **Byte Editing**: Modify individual bytes directly through the hex view
- **Pagination**: Navigate through large files using page controls
- **Forensic Focus**: Designed specifically for examining SQLite file structures

## Usage Guide

### Accessing the Hex Editor

1. Upload a SQLite database file in the main interface
2. After analysis is complete, click on the "Hex Editor" tab

### Navigation Controls

- **Starting Offset**: Enter a decimal byte offset to jump to a specific location in the file
- **Bytes to View**: Adjust how many bytes to display at once (16-1024)
- **Page Navigation**: Use the arrow buttons to move forward and backward through the file
- **Refresh**: Click the refresh button to update the hex view (useful after making changes)

### Viewing Data

The hex editor displays data in three columns:
- **Offset**: Shows the hexadecimal file offset of each row
- **Hex Values**: Displays the hexadecimal representation of each byte
- **ASCII**: Shows the ASCII character representation of the bytes (printable characters only)

### Editing Data

1. Click the "Edit Mode" button to enable editing
2. Click on any hex value you wish to modify
3. Enter a new two-character hex value (0-9, A-F)
4. Click the checkmark to save the change, or the X to cancel
5. The changes are written directly to the file

## Forensic Use Cases

The hex editor is particularly useful for:

- **Header Examination**: Checking SQLite database headers for tampering
- **Deleted Record Recovery**: Examining freelist pages for deleted content
- **File Structure Analysis**: Understanding the low-level organization of the database
- **Data Verification**: Confirming that parsed data matches raw binary content
- **Manual Repair**: Fixing corrupted database files at the byte level

## Important Notes

- Modifying binary data directly can corrupt the database if not done carefully
- Always work with a copy of the original evidence file when using the editor
- Maintain proper documentation of any changes made during a forensic examination
- The editor is intended for advanced users who understand the SQLite file format 