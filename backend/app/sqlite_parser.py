import os
import sqlite3
import hashlib
import struct
import binascii
import json
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any, Union

class SqliteForensicParser:
    """
    A forensic parser for SQLite database files that can extract metadata,
    analyze structures, and identify forensic artifacts.
    """
    # SQLite file signature (first 16 bytes of a valid SQLite database)
    SQLITE_SIGNATURE = b'SQLite format 3\x00'
    
    # Common forensic artifact patterns
    ARTIFACT_SIGNATURES = {
        'chrome_history': {'tables': ['urls', 'visits'], 'file_patterns': ['History']},
        'chrome_cookies': {'tables': ['cookies'], 'file_patterns': ['Cookies']},
        'firefox_history': {'tables': ['moz_places', 'moz_historyvisits'], 'file_patterns': ['places.sqlite']},
        'firefox_cookies': {'tables': ['moz_cookies'], 'file_patterns': ['cookies.sqlite']},
        'whatsapp_messages': {'tables': ['messages', 'chat_list'], 'file_patterns': ['msgstore.db']},
        'android_contacts': {'tables': ['contacts', 'raw_contacts'], 'file_patterns': ['contacts2.db']},
        'sms_messages': {'tables': ['sms', 'messages'], 'file_patterns': ['mmssms.db']},
        'ios_sms': {'tables': ['message'], 'file_patterns': ['sms.db']},
        'skype_messages': {'tables': ['Messages'], 'file_patterns': ['main.db']},
        'telegram_messages': {'tables': ['messages'], 'file_patterns': ['telegram.db']}
    }
    
    def __init__(self, db_path: str):
        """Initialize the parser with the path to the SQLite database file."""
        self.db_path = db_path
        self.file_size = os.path.getsize(db_path) if os.path.exists(db_path) else 0
        self.md5_hash = None
        self.sha1_hash = None
        self.sha256_hash = None
        self.header_data = None
        self.page_size = 0
        self.encoding = None
        self.user_version = 0
        self.application_id = 0
        self.schema_version = 0
        self.schema = {}
        self.deleted_records = []
        self.artifact_type = None
        self.connection = None
        
    def calculate_hashes(self) -> Dict[str, str]:
        """Calculate MD5, SHA1, and SHA256 hashes of the file."""
        md5 = hashlib.md5()
        sha1 = hashlib.sha1()
        sha256 = hashlib.sha256()
        
        with open(self.db_path, 'rb') as f:
            # Read the file in chunks to handle large files efficiently
            for chunk in iter(lambda: f.read(4096), b''):
                md5.update(chunk)
                sha1.update(chunk)
                sha256.update(chunk)
        
        self.md5_hash = md5.hexdigest()
        self.sha1_hash = sha1.hexdigest()
        self.sha256_hash = sha256.hexdigest()
        
        return {
            'md5': self.md5_hash,
            'sha1': self.sha1_hash,
            'sha256': self.sha256_hash
        }
        
    def parse_header(self) -> Dict[str, Any]:
        """Parse the SQLite database header (first 100 bytes)."""
        with open(self.db_path, 'rb') as f:
            header = f.read(100)  # SQLite header is 100 bytes
            
        if len(header) < 100:
            raise ValueError("File too small to be a valid SQLite database")
            
        # Check for SQLite signature
        if not header.startswith(self.SQLITE_SIGNATURE):
            raise ValueError("Not a valid SQLite database (incorrect signature)")
            
        # Parse header fields based on SQLite format spec
        self.page_size = struct.unpack('>H', header[16:18])[0]
        if self.page_size == 1:
            # Page size of 1 means 65536 bytes
            self.page_size = 65536
            
        self.encoding = {1: 'UTF-8', 2: 'UTF-16le', 3: 'UTF-16be'}.get(
            header[56], 'Unknown'
        )
        
        self.user_version = struct.unpack('>I', header[60:64])[0]
        self.application_id = struct.unpack('>I', header[68:72])[0]
        self.schema_version = struct.unpack('>I', header[96:100])[0]
        
        self.header_data = {
            'signature': binascii.hexlify(header[0:16]).decode('ascii'),
            'page_size': self.page_size,
            'file_format_write_version': header[18],
            'file_format_read_version': header[19],
            'reserved_space': header[20],
            'max_payload_fraction': header[21],
            'min_payload_fraction': header[22],
            'leaf_payload_fraction': header[23],
            'file_change_counter': struct.unpack('>I', header[24:28])[0],
            'database_size_pages': struct.unpack('>I', header[28:32])[0],
            'first_freelist_trunk_page': struct.unpack('>I', header[32:36])[0],
            'total_freelist_pages': struct.unpack('>I', header[36:40])[0],
            'schema_cookie': struct.unpack('>I', header[40:44])[0],
            'schema_format': header[44],
            'default_page_cache_size': struct.unpack('>I', header[48:52])[0],
            'largest_root_btree_page': struct.unpack('>I', header[52:56])[0],
            'text_encoding': self.encoding,
            'user_version': self.user_version,
            'vacuum_mode': struct.unpack('>I', header[64:68])[0],
            'application_id': hex(self.application_id),
            'version_valid_for': struct.unpack('>I', header[92:96])[0],
            'sqlite_version_number': self.schema_version
        }
        
        return self.header_data
        
    def connect_to_db(self) -> bool:
        """Attempt to connect to the SQLite database and return success status."""
        try:
            self.connection = sqlite3.connect(f'file:{self.db_path}?mode=ro', uri=True)
            self.connection.row_factory = sqlite3.Row
            return True
        except sqlite3.Error:
            self.connection = None
            return False
            
    def extract_schema(self) -> Dict[str, Dict]:
        """Extract the database schema including tables, indices, and triggers."""
        if not self.connection:
            if not self.connect_to_db():
                return {}
                
        cursor = self.connection.cursor()
        
        # Get list of all tables
        cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='table'")
        tables = {}
        
        for row in cursor.fetchall():
            table_name = row['name']
            table_sql = row['sql']
            
            # Skip SQLite internal tables
            if table_name.startswith('sqlite_'):
                continue
                
            # Get table columns
            try:
                column_info = cursor.execute(f"PRAGMA table_info({table_name})").fetchall()
                columns = []
                
                for col in column_info:
                    columns.append({
                        'name': col['name'],
                        'type': col['type'],
                        'not_null': bool(col['notnull']),
                        'default_value': col['dflt_value'],
                        'primary_key': bool(col['pk'])
                    })
                    
                # Get row count and storage info
                row_count = cursor.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
                
                # Calculate average row size and sample rows
                sample_rows = []
                if row_count > 0:
                    try:
                        sample_query = f"SELECT * FROM {table_name} LIMIT 5"
                        sample_data = cursor.execute(sample_query).fetchall()
                        
                        for row_data in sample_data:
                            row_dict = {key: row_data[key] for key in row_data.keys()}
                            sample_rows.append(row_dict)
                    except sqlite3.Error:
                        # Handle any errors during sample extraction
                        pass
                        
                tables[table_name] = {
                    'sql': table_sql,
                    'columns': columns,
                    'row_count': row_count,
                    'sample_rows': sample_rows
                }
            except sqlite3.Error:
                # Skip tables that cause errors
                continue
                
        # Get indices
        cursor.execute("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index'")
        indices = {}
        
        for row in cursor.fetchall():
            index_name = row['name']
            table_name = row['tbl_name'] 
            index_sql = row['sql']
            
            if index_name.startswith('sqlite_'):
                continue
                
            if table_name in tables:
                if 'indices' not in tables[table_name]:
                    tables[table_name]['indices'] = []
                    
                tables[table_name]['indices'].append({
                    'name': index_name,
                    'sql': index_sql
                })
                
            indices[index_name] = {
                'table': table_name,
                'sql': index_sql
            }
            
        # Get triggers
        cursor.execute("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='trigger'")
        triggers = {}
        
        for row in cursor.fetchall():
            trigger_name = row['name']
            table_name = row['tbl_name']
            trigger_sql = row['sql']
            
            if table_name in tables:
                if 'triggers' not in tables[table_name]:
                    tables[table_name]['triggers'] = []
                    
                tables[table_name]['triggers'].append({
                    'name': trigger_name,
                    'sql': trigger_sql
                })
                
            triggers[trigger_name] = {
                'table': table_name,
                'sql': trigger_sql
            }
            
        self.schema = {
            'tables': tables,
            'indices': indices,
            'triggers': triggers
        }
        
        return self.schema
        
    def detect_artifact_type(self) -> str:
        """Detect the type of forensic artifact based on schema and file name."""
        if not self.schema:
            self.extract_schema()
            
        if not self.schema.get('tables'):
            return 'unknown'
            
        # Check for known artifact types based on table names
        tables = set(self.schema['tables'].keys())
        filename = os.path.basename(self.db_path).lower()
        
        for artifact, signature in self.ARTIFACT_SIGNATURES.items():
            # Check if required tables exist
            if any(table in tables for table in signature['tables']):
                # Check file name patterns
                if any(pattern.lower() in filename for pattern in signature['file_patterns']):
                    self.artifact_type = artifact
                    return artifact
                    
        # If we have Chromium/WebKit browser tables
        if 'urls' in tables and 'visits' in tables:
            self.artifact_type = 'web_browser_history'
            return 'web_browser_history'
            
        if 'cookies' in tables:
            self.artifact_type = 'web_browser_cookies'
            return 'web_browser_cookies'
            
        if 'messages' in tables:
            self.artifact_type = 'message_store'
            return 'message_store'
            
        if 'android_metadata' in tables:
            self.artifact_type = 'android_app_data'
            return 'android_app_data'
            
        # Fallback to generic classification
        self.artifact_type = 'sqlite_application_data'
        return 'sqlite_application_data'
        
    def search_for_deleted_records(self) -> List[Dict]:
        """
        Search for potentially recoverable deleted records in the database file.
        This is a simplified implementation that looks for record signatures in unused space.
        """
        deleted_records = []
        
        # This requires reading the whole file and looking for patterns of deleted records
        # A simplified approach is to look at the freelist pages
        if not self.connection:
            if not self.connect_to_db():
                return deleted_records
                
        try:
            # Get freelist info from header
            cursor = self.connection.cursor()
            freelist_info = cursor.execute("PRAGMA freelist_count").fetchone()
            
            if freelist_info and freelist_info[0] > 0:
                deleted_records.append({
                    'type': 'freelist_pages',
                    'count': freelist_info[0],
                    'offset': 'various',
                    'note': 'Database has freelist pages that may contain deleted records'
                })
                
            # More advanced technique would involve parsing page headers and looking for
            # deleted btree cell patterns, which is outside the scope of this implementation
                
        except sqlite3.Error as e:
            # Handle SQLite errors
            deleted_records.append({
                'type': 'error',
                'note': f"Error searching for deleted records: {str(e)}"
            })
            
        # Additional technique: look for record headers in file slack space
        with open(self.db_path, 'rb') as f:
            file_data = f.read()
            
            # Check if there appears to be data past the end of the database
            # This can happen when a database is not vacuumed after deletes
            expected_size = self.header_data.get('database_size_pages', 0) * self.page_size
            if self.file_size > expected_size and expected_size > 0:
                deleted_records.append({
                    'type': 'slack_space',
                    'offset': hex(expected_size),
                    'size': self.file_size - expected_size,
                    'note': 'File contains data beyond the reported database size'
                })
                
        return deleted_records
        
    def get_forensic_metadata(self) -> Dict[str, Any]:
        """Gather comprehensive forensic metadata about the SQLite database."""
        # Calculate hashes
        hashes = self.calculate_hashes()
        
        # Parse header if not already done
        if not self.header_data:
            self.parse_header()
            
        # Extract schema if not already done
        if not self.schema:
            self.extract_schema()
            
        # Detect artifact type
        artifact_type = self.detect_artifact_type()
        
        # Look for deleted records
        self.deleted_records = self.search_for_deleted_records()
        
        # Get file metadata
        stat_info = os.stat(self.db_path)
        create_time = datetime.fromtimestamp(stat_info.st_ctime).isoformat()
        modify_time = datetime.fromtimestamp(stat_info.st_mtime).isoformat()
        access_time = datetime.fromtimestamp(stat_info.st_atime).isoformat()
        
        # Compile the metadata
        metadata = {
            'file_info': {
                'name': os.path.basename(self.db_path),
                'path': self.db_path,
                'size': self.file_size,
                'size_formatted': self.format_file_size(self.file_size),
                'created': create_time,
                'modified': modify_time,
                'accessed': access_time
            },
            'hashes': hashes,
            'header': self.header_data,
            'artifact_type': artifact_type,
            'structure_summary': {
                'tables': len(self.schema.get('tables', {})),
                'indices': len(self.schema.get('indices', {})),
                'triggers': len(self.schema.get('triggers', {}))
            },
            'deleted_records': self.deleted_records
        }
        
        return metadata
        
    def analyze_database(self) -> Dict[str, Any]:
        """Perform a comprehensive forensic analysis of the database."""
        # Get forensic metadata
        metadata = self.get_forensic_metadata()
        
        # Analyze schema for forensic insights
        schema_issues = []
        
        if not self.schema.get('tables'):
            schema_issues.append({
                'type': 'error',
                'message': 'No tables found in database schema',
                'severity': 'high'
            })
        else:
            # Look for tables with unusual properties
            for table_name, table_info in self.schema['tables'].items():
                # Check for tables with no indices (potentially performance issues)
                if not table_info.get('indices') and table_info['row_count'] > 1000:
                    schema_issues.append({
                        'type': 'performance',
                        'message': f"Table '{table_name}' has {table_info['row_count']} rows but no indices",
                        'severity': 'medium',
                        'table': table_name
                    })
                    
                # Check for tables with no data
                if table_info['row_count'] == 0:
                    schema_issues.append({
                        'type': 'empty_table',
                        'message': f"Table '{table_name}' exists in schema but contains no data",
                        'severity': 'low',
                        'table': table_name
                    })
                    
                # Check for binary data in text columns
                for sample in table_info.get('sample_rows', []):
                    for column, value in sample.items():
                        if isinstance(value, str) and any(c < ' ' and c != '\t' and c != '\n' for c in value):
                            schema_issues.append({
                                'type': 'binary_in_text',
                                'message': f"Binary data found in text column '{column}' of table '{table_name}'",
                                'severity': 'medium',
                                'table': table_name,
                                'column': column
                            })
                            break
                            
        # Analyze artifact-specific data based on detected type
        artifact_insights = []
        if self.artifact_type == 'web_browser_history':
            # Extract information about browsing history
            if self.connection:
                try:
                    cursor = self.connection.cursor()
                    if 'urls' in self.schema['tables'] and 'visits' in self.schema['tables']:
                        # Chrome-like history structure
                        cursor.execute("""
                            SELECT urls.url, urls.title, urls.visit_count, 
                                   urls.last_visit_time, COUNT(visits.id) as visit_count
                            FROM urls
                            LEFT JOIN visits ON visits.url = urls.id
                            GROUP BY urls.id
                            ORDER BY urls.last_visit_time DESC
                            LIMIT 10
                        """)
                        rows = cursor.fetchall()
                        if rows:
                            artifact_insights.append({
                                'type': 'browsing_history',
                                'message': f"Found {len(rows)} recent browsing history entries",
                                'sample_entries': [dict(row) for row in rows]
                            })
                except sqlite3.Error:
                    # Skip if tables don't match expected schema
                    pass
                    
        elif self.artifact_type == 'message_store':
            # Extract information about messages
            if self.connection:
                try:
                    cursor = self.connection.cursor()
                    if 'messages' in self.schema['tables']:
                        cursor.execute("""
                            SELECT * FROM messages 
                            ORDER BY date_sent DESC, _id DESC 
                            LIMIT 10
                        """)
                        rows = cursor.fetchall()
                        if rows:
                            artifact_insights.append({
                                'type': 'message_history',
                                'message': f"Found {len(rows)} recent messages",
                                'sample_entries': [dict(row) for row in rows]
                            })
                except sqlite3.Error:
                    # Skip if tables don't match expected schema
                    pass
                    
        # Analysis results
        analysis = {
            'forensic_metadata': metadata,
            'schema_issues': schema_issues,
            'artifact_insights': artifact_insights,
            'recommendations': self.generate_recommendations(metadata, schema_issues)
        }
        
        return analysis
        
    def generate_recommendations(self, metadata, schema_issues) -> List[Dict]:
        """Generate investigator recommendations based on analysis results."""
        recommendations = []
        
        # Check if file appears to be corrupted
        if not metadata['header'] or not metadata.get('structure_summary', {}).get('tables'):
            recommendations.append({
                'type': 'data_recovery',
                'priority': 'high',
                'message': 'Database appears to be corrupted or incomplete. Consider specialized SQLite forensic recovery tools.'
            })
            
        # Check for deleted records
        if metadata.get('deleted_records'):
            recommendations.append({
                'type': 'data_recovery',
                'priority': 'medium',
                'message': 'Database contains potentially recoverable deleted records. Consider carving tools or manual hex analysis.'
            })
            
        # Artifact-specific recommendations
        if metadata.get('artifact_type') == 'web_browser_history':
            recommendations.append({
                'type': 'investigation',
                'priority': 'medium',
                'message': 'Extract full browsing history with timestamps and visit counts for timeline analysis.'
            })
            
        elif metadata.get('artifact_type') == 'message_store':
            recommendations.append({
                'type': 'investigation',
                'priority': 'high',
                'message': 'Extract all messages with complete metadata and media attachments for communication analysis.'
            })
            
        # Schema issues
        if any(issue['severity'] == 'high' for issue in schema_issues):
            recommendations.append({
                'type': 'technical',
                'priority': 'medium',
                'message': 'Database has significant schema issues. Consider manual analysis of database structure.'
            })
            
        return recommendations
    
    @staticmethod
    def format_file_size(size_bytes: int) -> str:
        """Format file size in bytes to human-readable format."""
        if size_bytes < 1024:
            return f"{size_bytes} bytes"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.2f} KB"
        elif size_bytes < 1024 * 1024 * 1024:
            return f"{size_bytes / (1024 * 1024):.2f} MB"
        else:
            return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"
            
    def get_hex_dump(self, offset: int, length: int) -> Dict[str, Any]:
        """Get a hex dump of the database file starting at the specified offset."""
        result = {
            'offset': offset,
            'length': length,
            'hex_data': [],
            'ascii_data': []
        }
        
        try:
            with open(self.db_path, 'rb') as f:
                f.seek(offset)
                data = f.read(length)
                
                # Process in rows of 16 bytes
                for i in range(0, len(data), 16):
                    row_data = data[i:i+16]
                    hex_row = binascii.hexlify(row_data).decode('ascii')
                    hex_formatted = ' '.join(hex_row[j:j+2] for j in range(0, len(hex_row), 2))
                    
                    # Create ASCII representation
                    ascii_row = ''.join(chr(b) if 32 <= b <= 126 else '.' for b in row_data)
                    
                    result['hex_data'].append(hex_formatted)
                    result['ascii_data'].append(ascii_row)
                    
        except Exception as e:
            result['error'] = str(e)
            
        return result
        
    def find_hex_pattern(self, pattern: str) -> List[Dict[str, Any]]:
        """
        Search for a hex pattern in the database file and return offsets where it's found.
        Pattern should be a hex string (e.g., "53514C697465")
        """
        results = []
        
        try:
            # Convert hex string to bytes
            search_bytes = binascii.unhexlify(pattern)
            
            with open(self.db_path, 'rb') as f:
                data = f.read()
                
                # Find all occurrences
                offset = 0
                while True:
                    offset = data.find(search_bytes, offset)
                    if offset == -1:
                        break
                        
                    # Get some context around the found pattern
                    context_start = max(0, offset - 16)
                    context_end = min(len(data), offset + len(search_bytes) + 16)
                    context_data = data[context_start:context_end]
                    
                    results.append({
                        'offset': offset,
                        'offset_hex': hex(offset),
                        'context': binascii.hexlify(context_data).decode('ascii'),
                        'context_ascii': ''.join(chr(b) if 32 <= b <= 126 else '.' for b in context_data)
                    })
                    
                    offset += len(search_bytes)
                    
        except Exception as e:
            results.append({'error': str(e)})
            
        return results
        
    def close(self):
        """Close the database connection if open."""
        if self.connection:
            self.connection.close()
            self.connection = None 

    def get_table_data(self, table_name: str, page: int = 1, page_size: int = 50, 
                      sort_column: str = None, sort_direction: str = 'ASC',
                      filters: Dict[str, str] = None) -> Dict[str, Any]:
        """Fetch paginated table data with sorting and filtering."""
        if not self.connection:
            if not self.connect_to_db():
                return {'error': 'Could not connect to database'}
            
        try:
            cursor = self.connection.cursor()
            
            # Validate table name to prevent SQL injection
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
            if not cursor.fetchone():
                return {'error': f'Table {table_name} not found'}
            
            # Build the base query
            base_query = f"SELECT * FROM {table_name}"
            count_query = f"SELECT COUNT(*) FROM {table_name}"
            
            # Add filters if provided
            where_clauses = []
            params = []
            if filters:
                for column, value in filters.items():
                    # Validate column name
                    cursor.execute(f"PRAGMA table_info({table_name})")
                    valid_columns = [row['name'] for row in cursor.fetchall()]
                    if column not in valid_columns:
                        continue
                        
                    where_clauses.append(f"{column} LIKE ?")
                    params.append(f"%{value}%")
                
            if where_clauses:
                where_clause = " WHERE " + " AND ".join(where_clauses)
                base_query += where_clause
                count_query += where_clause
            
            # Add sorting if provided
            if sort_column:
                # Validate sort column
                cursor.execute(f"PRAGMA table_info({table_name})")
                valid_columns = [row['name'] for row in cursor.fetchall()]
                if sort_column in valid_columns:
                    base_query += f" ORDER BY {sort_column} {sort_direction}"
            
            # Add pagination
            offset = (page - 1) * page_size
            base_query += f" LIMIT {page_size} OFFSET {offset}"
            
            # Get total count
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]
            
            # Get paginated data
            cursor.execute(base_query, params)
            rows = cursor.fetchall()
            
            # Convert rows to dictionaries
            data = []
            for row in rows:
                row_dict = {key: row[key] for key in row.keys()}
                data.append(row_dict)
            
            return {
                'data': data,
                'total_count': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size
            }
            
        except sqlite3.Error as e:
            return {'error': str(e)}
        except Exception as e:
            return {'error': f'Unexpected error: {str(e)}'}
        finally:
            if self.connection:
                self.connection.close()
                self.connection = None 