import { NextRequest, NextResponse } from 'next/server';

type BackupParams = {
  filename: string;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<BackupParams> }
) {
  const params = await context.params;
  console.log(`[GET] Handling /api/backups/${params.filename} request`);
  
  try {
    // Reuse the mock data format from direct-analyze
    const mockResponse = {
      validation: {
        is_valid: true,
        errors: null,
        md5_hash: "43ab23c8a5e3b286de057e4171f8bc01",
        sha1_hash: "0e81a598df4c3ab9a6e32e687dbed9c2c9e86d98",
        sha256_hash: "b9a6be29e1b9e50ceb3c908b64af43bd1af6a2c8e1bdfb8e8a37bbaa7afbca39",
        file_size: 4096,
        header_signature: "SQLite format 3",
        file_id: "backup-" + params.filename,
        artifact_type: "SQLite Database (Backup)"
      },
      analysis: {
        file_id: "backup-" + params.filename,
        tables: [
          {
            name: "backup_table",
            rows: 15,
            columns: [
              {
                name: "id",
                type: "INTEGER",
                not_null: true,
                primary_key: true
              },
              {
                name: "data",
                type: "TEXT",
                not_null: false,
                primary_key: false
              }
            ],
            sample_data: [
              { id: 1, data: "Backup data 1" },
              { id: 2, data: "Backup data 2" }
            ]
          }
        ],
        indices_count: 2,
        triggers_count: 1,
        size_formatted: "64 KB",
        total_rows: 15,
        forensic_metadata: {
          sqlite_version: "3.39.4",
          page_size: 4096,
          encoding: "UTF-8",
          creation_time: new Date().toISOString(),
          last_modified_time: new Date().toISOString(),
          write_format: 1,
          journal_mode: "delete",
          application_id: null,
          user_version: 0
        },
        deleted_records: [
          {
            type: "Record",
            offset: "0x2000",
            count: 5,
            note: "Potentially recoverable deleted records from backup"
          }
        ],
        artifact_type: "SQLite Database (Backup)",
        artifact_significance: "This is a backup of a standard SQLite database.",
        issues: [],
        recommendations: [
          {
            type: "Analysis",
            priority: "medium",
            message: "Examine the backup timestamps for timeline information."
          }
        ],
        recovery_info: {
          is_corrupted: false,
          corruption_details: [],
          recovered_tables: ["backup_table"],
          partial_analysis: false,
          error_log: []
        },
        error_log: []
      },
      optimization: {
        suggestions: [
          {
            type: "Index",
            description: "Add an index on frequently queried columns",
            sql: "CREATE INDEX idx_data ON backup_table(data);",
            table: "backup_table"
          }
        ],
        potential_improvements: [
          {
            type: "Storage",
            description: "Consider compressing older backups to save space",
            impact: "medium"
          }
        ]
      }
    };
    
    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error(`Error handling backup restore request for ${params.filename}:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to restore backup', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 