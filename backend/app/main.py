import os
import tempfile
import shutil
import sqlite3
import hashlib
import binascii
import math
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel
import traceback
from datetime import datetime
from .sqlite_parser import SqliteForensicParser
import logging
from pathlib import Path
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('forensic_analyzer.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="SQLite Forensic Artifact Analyzer")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development
    # Uncomment and use the following for production
    # allow_origins=[
    #     "http://localhost:3000",
    #     "https://sqliteparser.vercel.app",
    #     "https://sqlite-forensic-analyzer.vercel.app"
    # ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a temp directory for storing uploaded files
UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "sqlite_analyzer")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Create backup directory
BACKUP_DIR = Path("backups")
BACKUP_DIR.mkdir(exist_ok=True)

class ValidationResponse(BaseModel):
    is_valid: bool
    errors: Optional[List[str]] = None
    md5_hash: Optional[str] = None
    sha1_hash: Optional[str] = None
    sha256_hash: Optional[str] = None
    file_size: Optional[int] = None
    header_signature: Optional[str] = None
    file_id: Optional[str] = None
    artifact_type: Optional[str] = None

class ForensicMetadata(BaseModel):
    sqlite_version: Optional[str] = None
    page_size: Optional[int] = None
    encoding: Optional[str] = None
    creation_time: Optional[str] = None
    last_modified_time: Optional[str] = None
    write_format: Optional[int] = None
    journal_mode: Optional[str] = None
    application_id: Optional[str] = None
    user_version: Optional[int] = None

class TableInfo(BaseModel):
    name: str
    rows: int
    columns: List[Dict[str, Any]]
    sample_data: Optional[List[Dict[str, Any]]] = None
    offset: Optional[int] = None
    page_number: Optional[int] = None

class RecordInfo(BaseModel):
    type: str
    offset: Optional[str] = None
    count: Optional[int] = None
    size: Optional[int] = None
    note: str

class AnalysisResponse(BaseModel):
    file_id: str
    tables: List[TableInfo]
    indices_count: int
    triggers_count: int
    size_formatted: str
    total_rows: int
    forensic_metadata: ForensicMetadata
    deleted_records: List[RecordInfo]
    artifact_type: str
    artifact_significance: Optional[str] = None
    issues: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]

class OptimizationResponse(BaseModel):
    suggestions: List[Dict[str, Any]]
    potential_improvements: List[Dict[str, Any]]

class HexDumpResponse(BaseModel):
    offset: int
    length: int
    hex_data: List[str]
    ascii_data: List[str]
    error: Optional[str] = None

class SearchResponse(BaseModel):
    results: List[Dict[str, Any]]
    count: int
    error: Optional[str] = None

class HistogramData(BaseModel):
    histogram: List[Dict[str, Any]]

class EntropyData(BaseModel):
    entropy: Dict[str, Any]

class ProcessResponse(BaseModel):
    validation: ValidationResponse
    analysis: Optional[AnalysisResponse] = None
    optimization: Optional[OptimizationResponse] = None

class ErrorResponse(BaseModel):
    error: str
    details: Optional[Dict[str, Any]] = None
    recovery_suggestion: Optional[str] = None

class DatabaseRecoveryInfo(BaseModel):
    is_corrupted: bool
    corruption_details: Optional[List[str]] = None
    recovered_tables: List[str] = []
    partial_analysis: bool = False
    error_log: List[str] = []

def get_db_path(file_id: str) -> str:
    """Get the path to the uploaded database file."""
    return os.path.join(UPLOAD_DIR, file_id)

@app.post("/api/upload", response_model=Dict[str, Any])
async def upload_file(file: UploadFile = File(...)):
    """Upload a SQLite database file for analysis."""
    try:
        # Generate a unique ID for the file
        file_id = f"{file.filename.replace(' ', '_')}_{os.urandom(4).hex()}"
        file_path = get_db_path(file_id)
        
        # Save the uploaded file
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        # Return the file ID
        return {"file_id": file_id, "message": "File uploaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@app.post("/api/validate", response_model=ValidationResponse)
async def validate_db(file_id: str = Form(...)):
    """Validate the uploaded SQLite database file."""
    try:
        db_path = get_db_path(file_id)
        if not os.path.exists(db_path):
            return ValidationResponse(
                is_valid=False, 
                errors=["File not found"],
                file_id=file_id
            )
        
        # Initialize the parser
        parser = SqliteForensicParser(db_path)
        errors = []
        
        # Parse header and calculate hashes
        try:
            # Calculate hashes
            hashes = parser.calculate_hashes()
            
            # Attempt to parse header
            try:
                header = parser.parse_header()
                header_signature = "SQLite format 3"
            except ValueError as e:
                errors.append(str(e))
                return ValidationResponse(
                    is_valid=False, 
                    errors=errors,
                    file_id=file_id,
                    md5_hash=hashes.get('md5'),
                    sha1_hash=hashes.get('sha1'),
                    sha256_hash=hashes.get('sha256'),
                    file_size=parser.file_size
                )
            
            # Check if can connect to DB
            can_connect = parser.connect_to_db()
            if not can_connect:
                errors.append("File is a SQLite database but appears to be corrupted or encrypted")
                return ValidationResponse(
                    is_valid=False, 
                    errors=errors,
                    file_id=file_id,
                    md5_hash=hashes.get('md5'),
                    sha1_hash=hashes.get('sha1'),
                    sha256_hash=hashes.get('sha256'),
                    file_size=parser.file_size,
                    header_signature=header_signature
                )
            
            # Validate schema
            schema = parser.extract_schema()
            if not schema.get('tables'):
                errors.append("SQLite database appears valid but contains no tables")
                return ValidationResponse(
                    is_valid=False, 
                    errors=errors,
                    file_id=file_id,
                    md5_hash=hashes.get('md5'),
                    sha1_hash=hashes.get('sha1'),
                    sha256_hash=hashes.get('sha256'),
                    file_size=parser.file_size,
                    header_signature=header_signature
                )
            
            # Detect artifact type
            artifact_type = parser.detect_artifact_type()
            
            # Success
            return ValidationResponse(
                is_valid=True, 
                errors=None,
                file_id=file_id,
                md5_hash=hashes.get('md5'),
                sha1_hash=hashes.get('sha1'),
                sha256_hash=hashes.get('sha256'),
                file_size=parser.file_size,
                header_signature=header_signature,
                artifact_type=artifact_type
            )
        except Exception as e:
            errors.append(f"Error validating file: {str(e)}")
            return ValidationResponse(
                is_valid=False, 
                errors=errors,
                file_id=file_id
            )
        finally:
            parser.close()
            
    except Exception as e:
        return ValidationResponse(
            is_valid=False, 
            errors=[f"Error processing file: {str(e)}"],
            file_id=file_id
        )

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_db(file_id: str = Form(...)):
    """Analyze the uploaded SQLite database file."""
    try:
        db_path = get_db_path(file_id)
        if not os.path.exists(db_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Initialize the parser
        parser = SqliteForensicParser(db_path)
        
        try:
            # Perform comprehensive analysis
            analysis_results = parser.analyze_database()
            
            # Extract relevant data for the response
            metadata = analysis_results['forensic_metadata']
            
            # Convert metadata to ForensicMetadata model
            forensic_metadata = ForensicMetadata(
                sqlite_version=str(metadata['header'].get('sqlite_version_number')),
                page_size=metadata['header'].get('page_size'),
                encoding=metadata['header'].get('text_encoding'),
                creation_time=metadata['file_info'].get('created'),
                last_modified_time=metadata['file_info'].get('modified'),
                write_format=metadata['header'].get('file_format_write_version'),
                journal_mode="WAL" if metadata['header'].get('journal_mode', 0) == 1 else "DELETE",
                application_id=metadata['header'].get('application_id'),
                user_version=metadata['header'].get('user_version')
            )
            
            # Convert tables to TableInfo model
            tables = []
            total_rows = 0
            
            for name, info in parser.schema.get('tables', {}).items():
                table_info = TableInfo(
                    name=name,
                    rows=info['row_count'],
                    columns=[{
                        'name': col['name'],
                        'type': col['type'],
                        'not_null': col['not_null'],
                        'primary_key': col['primary_key']
                    } for col in info['columns']],
                    sample_data=info.get('sample_rows', [])[:3] if info.get('sample_rows') else None
                )
                tables.append(table_info)
                total_rows += info['row_count']
            
            # Get artifact significance based on type
            artifact_significance = None
            if metadata['artifact_type'] in ['web_browser_history', 'chrome_history', 'firefox_history']:
                artifact_significance = "Contains web browsing history which may be relevant for investigations regarding user activities online."
            elif metadata['artifact_type'] in ['message_store', 'whatsapp_messages', 'sms_messages']:
                artifact_significance = "Contains messaging data which may provide evidence of communications between parties."
            elif metadata['artifact_type'] in ['android_app_data']:
                artifact_significance = "Contains application data from an Android device which may include user activities and preferences."
            else:
                artifact_significance = "SQLite database that contains structured data of potential evidentiary value."
            
            return AnalysisResponse(
                file_id=file_id,
                tables=tables,
                indices_count=metadata['structure_summary'].get('indices', 0),
                triggers_count=metadata['structure_summary'].get('triggers', 0),
                size_formatted=metadata['file_info'].get('size_formatted', ''),
                total_rows=total_rows,
                forensic_metadata=forensic_metadata,
                deleted_records=metadata.get('deleted_records', []),
                artifact_type=metadata.get('artifact_type', 'unknown'),
                artifact_significance=artifact_significance,
                issues=analysis_results.get('schema_issues', []),
                recommendations=analysis_results.get('recommendations', [])
            )
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Error analyzing file: {str(e)}")
        finally:
            parser.close()
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/api/optimize", response_model=OptimizationResponse)
async def optimize_db(file_id: str = Form(...)):
    """Generate optimization suggestions for the uploaded SQLite database."""
    try:
        db_path = get_db_path(file_id)
        if not os.path.exists(db_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Initialize the parser
        parser = SqliteForensicParser(db_path)
        
        try:
            # Parse the database
            parser.parse_header()
            parser.connect_to_db()
            parser.extract_schema()
            
            # Generate optimization suggestions
            suggestions = []
            improvements = []
            
            # Check for missing indices on large tables
            for table_name, table_info in parser.schema.get('tables', {}).items():
                if table_info['row_count'] > 1000 and not table_info.get('indices'):
                    suggestions.append({
                        "type": "missing_index",
                        "table": table_name,
                        "description": f"Create indices for large table {table_name} ({table_info['row_count']} rows)",
                        "sql": f"CREATE INDEX idx_{table_name}_id ON {table_name} (id);"
                    })
                    
                    improvements.append({
                        "type": "query_performance",
                        "description": f"Queries on table {table_name} could be up to 100x faster with proper indices",
                        "impact": "high"
                    })
            
            # Check for vacuum optimization
            if parser.header_data.get('total_freelist_pages', 0) > 10:
                suggestions.append({
                    "type": "vacuum",
                    "description": "Database has significant free space that could be reclaimed",
                    "sql": "VACUUM;"
                })
                
                improvements.append({
                    "type": "file_size",
                    "description": "Database file size could be reduced by removing unused space",
                    "impact": "medium"
                })
            
            # Check for WAL mode
            if parser.header_data.get('journal_mode', '') != 'wal':
                suggestions.append({
                    "type": "journal_mode",
                    "description": "Consider using WAL mode for better performance",
                    "sql": "PRAGMA journal_mode=WAL;"
                })
                
                improvements.append({
                    "type": "concurrency",
                    "description": "WAL mode allows multiple readers and one writer simultaneously",
                    "impact": "medium"
                })
                
            # Forensic-specific suggestions
            if parser.deleted_records:
                suggestions.append({
                    "type": "forensic_recovery",
                    "description": "Consider extracting deleted records for forensic analysis",
                    "tools": ["SQLite Forensic Explorer", "DB Browser for SQLite"]
                })
                
                improvements.append({
                    "type": "evidence_recovery",
                    "description": "Recovery of deleted content may provide additional forensic evidence",
                    "impact": "high"
                })
            
            return OptimizationResponse(
                suggestions=suggestions,
                potential_improvements=improvements
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error generating optimization suggestions: {str(e)}")
        finally:
            parser.close()
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/api/analyze-database", response_model=ProcessResponse)
async def analyze_database(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """Upload and process a SQLite database in one step."""
    try:
        # Save the uploaded file
        file_id = f"{file.filename.replace(' ', '_')}_{os.urandom(4).hex()}"
        file_path = get_db_path(file_id)
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        # Validate the database
        validation_result = await validate_db(file_id=file_id)
        
        # If validation failed, return early
        if not validation_result.is_valid:
            return ProcessResponse(validation=validation_result)
        
        # Analyze the database
        analysis_result = await analyze_db(file_id=file_id)
        
        # Generate optimization suggestions
        optimization_result = await optimize_db(file_id=file_id)
        
        # Create backup in background
        if background_tasks:
            background_tasks.add_task(create_backup, file_path)
        
        # Return the combined results
        return ProcessResponse(
            validation=validation_result,
            analysis=analysis_result,
            optimization=optimization_result
        )
    except Exception as e:
        logger.error(f"Error processing database: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing database: {str(e)}")

@app.post("/api/hex_dump", response_model=HexDumpResponse)
async def get_hex_dump(request: Request):
    """Get a hex dump of the database file at the specified offset."""
    try:
        # Try to parse as JSON first
        try:
            json_data = await request.json()
            file_id = json_data.get("file_id")
            offset = json_data.get("offset", 0)
            length = json_data.get("length", 256)
        except:
            # Fall back to form data
            form_data = await request.form()
            file_id = form_data.get("file_id")
            offset = int(form_data.get("offset", "0"))
            length = int(form_data.get("length", "256"))
        
        if not file_id:
            raise HTTPException(status_code=400, detail="Missing file_id parameter")
            
        db_path = get_db_path(file_id)
        if not os.path.exists(db_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Initialize the parser
        parser = SqliteForensicParser(db_path)
        
        try:
            # Get hex dump
            result = parser.get_hex_dump(offset, length)
            return result
        except Exception as e:
            return HexDumpResponse(
                offset=offset,
                length=length,
                hex_data=[],
                ascii_data=[],
                error=str(e)
            )
        finally:
            parser.close()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/api/search", response_model=SearchResponse)
async def search_pattern(file_id: str = Form(...), pattern: str = Form(...)):
    """Search for a pattern in the SQLite database."""
    try:
        db_path = get_db_path(file_id)
        if not os.path.exists(db_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Initialize the parser
        parser = SqliteForensicParser(db_path)
        
        try:
            # Search for pattern
            results = parser.find_hex_pattern(pattern)
            return SearchResponse(
                results=results,
                count=len(results),
                error=None
            )
        except Exception as e:
            return SearchResponse(
                results=[],
                count=0,
                error=str(e)
            )
        finally:
            parser.close()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/api/visualization/histogram", response_model=HistogramData)
async def generate_histogram(file_id: str = Form(...)):
    """Generate a byte frequency histogram for the database file."""
    try:
        db_path = get_db_path(file_id)
        if not os.path.exists(db_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Initialize the parser
        parser = SqliteForensicParser(db_path)
        
        try:
            # Generate histogram (frequency count of each byte value 0-255)
            byte_counts = [0] * 256
            
            with open(db_path, 'rb') as f:
                byte_data = f.read()
                
                # Count frequency of each byte
                for byte in byte_data:
                    byte_counts[byte] += 1
            
            # Prepare histogram data
            histogram = []
            for i in range(256):
                # Convert to ASCII if printable
                ascii_char = chr(i) if 32 <= i <= 126 else None
                
                histogram.append({
                    'byte': i,
                    'hex': hex(i)[2:].zfill(2).upper(),
                    'ascii': ascii_char,
                    'frequency': byte_counts[i]
                })
            
            return HistogramData(histogram=histogram)
        finally:
            parser.close()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating histogram: {str(e)}")

@app.post("/api/visualization/entropy", response_model=EntropyData)
async def generate_entropy(file_id: str = Form(...), block_size: int = Form(1024)):
    """Calculate Shannon entropy for blocks of the database file."""
    try:
        db_path = get_db_path(file_id)
        if not os.path.exists(db_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Initialize the parser
        parser = SqliteForensicParser(db_path)
        
        try:
            # Read file
            with open(db_path, 'rb') as f:
                file_data = f.read()
            
            file_size = len(file_data)
            
            # Calculate overall entropy
            overall_entropy = calculate_entropy(file_data)
            
            # Calculate entropy for blocks
            blocks = []
            
            # Adjust block size if the file is very small
            if file_size < block_size:
                block_size = max(file_size // 10, 1)  # At least 10 blocks or 1 byte
            
            # Process each block
            for offset in range(0, file_size, block_size):
                end = min(offset + block_size, file_size)
                block_data = file_data[offset:end]
                
                if len(block_data) > 0:
                    block_entropy = calculate_entropy(block_data)
                    blocks.append({
                        'offset': offset,
                        'entropy': block_entropy
                    })
            
            return EntropyData(entropy={
                'overall': overall_entropy,
                'blocks': blocks
            })
        finally:
            parser.close()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating entropy: {str(e)}")

def calculate_entropy(data):
    """Calculate Shannon entropy for binary data."""
    if not data:
        return 0
    
    # Count frequency of each byte value
    byte_counts = {}
    data_size = len(data)
    
    for byte in data:
        byte_counts[byte] = byte_counts.get(byte, 0) + 1
    
    # Calculate entropy
    entropy = 0
    for count in byte_counts.values():
        probability = count / data_size
        entropy -= probability * math.log2(probability)
    
    return entropy

@app.post("/api/edit_hex")
async def edit_hex(request: Request):
    """Edit a byte in the database file."""
    try:
        # Try to parse as JSON first
        try:
            json_data = await request.json()
            file_id = json_data.get("file_id")
            offset = json_data.get("offset")
            hex_value = json_data.get("hex_value")
        except:
            # Fall back to form data
            form_data = await request.form()
            file_id = form_data.get("file_id")
            offset = int(form_data.get("offset"))
            hex_value = form_data.get("hex_value")
        
        if not file_id or offset is None or hex_value is None:
            raise HTTPException(status_code=400, detail="Missing required parameters")
            
        db_path = get_db_path(file_id)
        if not os.path.exists(db_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Validate hex value
        try:
            byte_value = binascii.unhexlify(hex_value)
        except:
            raise HTTPException(status_code=400, detail="Invalid hex value")
        
        # Edit the file
        with open(db_path, 'r+b') as f:
            f.seek(offset)
            f.write(byte_value)
        
        return {"message": f"Successfully edited byte at offset {offset}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error editing file: {str(e)}")

@app.get("/api/files/{file_id}")
async def get_file_info(file_id: str):
    """Get information about an uploaded file."""
    try:
        db_path = get_db_path(file_id)
        if not os.path.exists(db_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Get file stats
        stats = os.stat(db_path)
        
        return {
            "file_id": file_id,
            "filename": os.path.basename(db_path).split('_')[0],
            "size": stats.st_size,
            "created": datetime.fromtimestamp(stats.st_ctime).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving file info: {str(e)}")

@app.delete("/api/files/{file_id}")
async def delete_file(file_id: str):
    """Delete an uploaded file."""
    try:
        db_path = get_db_path(file_id)
        if not os.path.exists(db_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        os.remove(db_path)
        return {"message": "File deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

def calculate_file_hashes(file_path: str) -> tuple[str, str]:
    """Calculate MD5 and SHA1 hashes of a file."""
    md5_hash = hashlib.md5()
    sha1_hash = hashlib.sha1()
    
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                md5_hash.update(chunk)
                sha1_hash.update(chunk)
    except Exception as e:
        logger.error(f"Error calculating hashes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error calculating file hashes: {str(e)}")
    
    return md5_hash.hexdigest(), sha1_hash.hexdigest()

def validate_sqlite_database(file_path: str) -> tuple[bool, List[str], Optional[DatabaseRecoveryInfo]]:
    """Validate SQLite database and attempt recovery if corrupted."""
    errors = []
    recovery_info = DatabaseRecoveryInfo(is_corrupted=False)
    
    try:
        # Check file signature
        with open(file_path, 'rb') as f:
            header = f.read(16)
            if not header.startswith(b'SQLite format 3\0'):
                errors.append("Invalid SQLite header signature")
                recovery_info.is_corrupted = True
        
        # Try to open database
        try:
            conn = sqlite3.connect(file_path)
            cursor = conn.cursor()
            
            # Check schema
            try:
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = cursor.fetchall()
                recovery_info.recovered_tables = [table[0] for table in tables]
            except sqlite3.DatabaseError as e:
                errors.append(f"Schema error: {str(e)}")
                recovery_info.is_corrupted = True
                recovery_info.partial_analysis = True
            
            # Check each table
            for table in recovery_info.recovered_tables:
                try:
                    cursor.execute(f"SELECT * FROM {table} LIMIT 1")
                except sqlite3.DatabaseError as e:
                    errors.append(f"Table {table} error: {str(e)}")
                    recovery_info.recovered_tables.remove(table)
            
            conn.close()
        except sqlite3.DatabaseError as e:
            errors.append(f"Database error: {str(e)}")
            recovery_info.is_corrupted = True
            recovery_info.partial_analysis = True
    
    except Exception as e:
        errors.append(f"General error: {str(e)}")
        recovery_info.is_corrupted = True
    
    recovery_info.corruption_details = errors
    recovery_info.error_log = errors
    return len(errors) == 0, errors, recovery_info

def extract_forensic_metadata(file_path: str) -> ForensicMetadata:
    """Extract forensic metadata from SQLite database."""
    try:
        with open(file_path, 'rb') as f:
            # Read header
            header = f.read(100)
            
            # Extract metadata
            page_size = int.from_bytes(header[16:18], 'big')
            file_format = header[18]
            reserved_space = header[20]
            max_embedded_payload = header[21]
            min_embedded_payload = header[22]
            leaf_payload = header[23]
            file_change_counter = int.from_bytes(header[24:28], 'big')
            database_size = int.from_bytes(header[28:32], 'big')
            first_freelist_trunk = int.from_bytes(header[32:36], 'big')
            total_freelist_pages = int.from_bytes(header[36:40], 'big')
            schema_cookie = int.from_bytes(header[40:44], 'big')
            schema_format = int.from_bytes(header[44:48], 'big')
            default_cache_size = int.from_bytes(header[48:52], 'big')
            largest_root_b_tree = int.from_bytes(header[52:56], 'big')
            text_encoding = int.from_bytes(header[56:60], 'big')
            user_version = int.from_bytes(header[60:64], 'big')
            incremental_vacuum = int.from_bytes(header[64:68], 'big')
            application_id = int.from_bytes(header[68:72], 'big')
            version_valid_for = int.from_bytes(header[92:96], 'big')
            
            # Calculate hashes
            md5_hash, sha1_hash = calculate_file_hashes(file_path)
            
            return ForensicMetadata(
                md5_hash=md5_hash,
                sha1_hash=sha1_hash,
                file_size=os.path.getsize(file_path),
                header_signature=header[:16].hex(),
                page_size=page_size,
                file_format=file_format,
                reserved_space=reserved_space,
                max_embedded_payload=max_embedded_payload,
                min_embedded_payload=min_embedded_payload,
                leaf_payload=leaf_payload,
                file_change_counter=file_change_counter,
                database_size=database_size,
                first_freelist_trunk=first_freelist_trunk,
                total_freelist_pages=total_freelist_pages,
                schema_cookie=schema_cookie,
                schema_format=schema_format,
                default_cache_size=default_cache_size,
                largest_root_b_tree=largest_root_b_tree,
                text_encoding=text_encoding,
                user_version=user_version,
                incremental_vacuum=incremental_vacuum,
                application_id=application_id,
                version_valid_for=version_valid_for,
                sqlite_version="3.0"  # Default version
            )
    except Exception as e:
        logger.error(f"Error extracting metadata: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error extracting metadata: {str(e)}")

def analyze_database_structure(file_path: str, recovery_info: Optional[DatabaseRecoveryInfo] = None) -> AnalysisResponse:
    """Analyze database structure with forensic details."""
    try:
        # Validate database
        is_valid, errors, recovery_info = validate_sqlite_database(file_path)
        
        # Extract metadata
        metadata = extract_forensic_metadata(file_path)
        
        # Initialize analysis response
        analysis = AnalysisResponse(
            is_valid=is_valid,
            forensic_metadata=metadata,
            tables=[],
            indices=[],
            deleted_records=[],
            recovery_info=recovery_info,
            error_log=errors
        )
        
        # Try to analyze structure if database is valid or partially recoverable
        if is_valid or (recovery_info and recovery_info.partial_analysis):
            try:
                conn = sqlite3.connect(file_path)
                cursor = conn.cursor()
                
                # Get tables
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = cursor.fetchall()
                
                for table in tables:
                    table_name = table[0]
                    try:
                        # Get table info
                        cursor.execute(f"PRAGMA table_info({table_name})")
                        columns = cursor.fetchall()
                        
                        # Get row count
                        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                        row_count = cursor.fetchone()[0]
                        
                        analysis.tables.append({
                            "name": table_name,
                            "columns": [{"name": col[1], "type": col[2]} for col in columns],
                            "row_count": row_count
                        })
                    except sqlite3.DatabaseError as e:
                        logger.warning(f"Error analyzing table {table_name}: {str(e)}")
                        analysis.error_log.append(f"Table {table_name} analysis error: {str(e)}")
                
                # Get indices
                cursor.execute("SELECT name FROM sqlite_master WHERE type='index'")
                indices = cursor.fetchall()
                
                for index in indices:
                    index_name = index[0]
                    try:
                        cursor.execute(f"PRAGMA index_info({index_name})")
                        index_info = cursor.fetchall()
                        analysis.indices.append({
                            "name": index_name,
                            "columns": [info[2] for info in index_info]
                        })
                    except sqlite3.DatabaseError as e:
                        logger.warning(f"Error analyzing index {index_name}: {str(e)}")
                        analysis.error_log.append(f"Index {index_name} analysis error: {str(e)}")
                
                conn.close()
            except sqlite3.DatabaseError as e:
                logger.error(f"Database analysis error: {str(e)}")
                analysis.error_log.append(f"Database analysis error: {str(e)}")
        
        return analysis
    
    except Exception as e:
        logger.error(f"Error in database analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in database analysis: {str(e)}")

def create_backup(file_path: str) -> str:
    """Create a backup of the analysis results."""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = BACKUP_DIR / f"analysis_{timestamp}.json"
        
        # Analyze database
        analysis = analyze_database_structure(file_path)
        
        # Save analysis results
        with open(backup_path, 'w') as f:
            json.dump(analysis.dict(), f, indent=2)
        
        logger.info(f"Created backup at {backup_path}")
        return str(backup_path)
    except Exception as e:
        logger.error(f"Error creating backup: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating backup: {str(e)}")

@app.get("/api/backups")
async def list_backups():
    """List all available analysis backups."""
    try:
        backups = []
        for file in BACKUP_DIR.glob("analysis_*.json"):
            stats = file.stat()
            backups.append({
                "filename": file.name,
                "created": datetime.fromtimestamp(stats.st_ctime).isoformat(),
                "size": stats.st_size
            })
        return backups
    except Exception as e:
        logger.error(f"Error listing backups: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing backups: {str(e)}")

@app.get("/api/backups/{filename}")
async def get_backup(filename: str):
    """Get a specific analysis backup."""
    try:
        backup_path = BACKUP_DIR / filename
        if not backup_path.exists():
            raise HTTPException(status_code=404, detail="Backup not found")
        
        with open(backup_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error retrieving backup: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving backup: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 