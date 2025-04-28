import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log("[POST] Handling /api/direct-analyze request");
  
  try {
    // Create a mock ProcessResponse to test if the UI works without backend
    const mockResponse = {
      validation: {
        is_valid: true,
        errors: null,
        md5_hash: "43ab23c8a5e3b286de057e4171f8bc01",
        sha1_hash: "0e81a598df4c3ab9a6e32e687dbed9c2c9e86d98",
        sha256_hash: "b9a6be29e1b9e50ceb3c908b64af43bd1af6a2c8e1bdfb8e8a37bbaa7afbca39",
        file_size: 4096,
        header_signature: "SQLite format 3",
        file_id: "test-file-id-" + Date.now(),
        artifact_type: "SQLite Database"
      },
      analysis: {
        file_id: "test-file-id-" + Date.now(),
        tables: [
          {
            name: "mock_table",
            rows: 5,
            columns: [
              {
                name: "id",
                type: "INTEGER",
                not_null: true,
                primary_key: true
              },
              {
                name: "name",
                type: "TEXT",
                not_null: false,
                primary_key: false
              }
            ],
            sample_data: [
              { id: 1, name: "Sample 1" },
              { id: 2, name: "Sample 2" }
            ]
          }
        ],
        indices_count: 1,
        triggers_count: 0,
        size_formatted: "4 KB",
        total_rows: 5,
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
            offset: "0x1000",
            count: 2,
            note: "Potentially recoverable deleted records"
          }
        ],
        artifact_type: "SQLite Database",
        artifact_significance: "This appears to be a standard SQLite database with no specific forensic significance.",
        issues: [],
        recommendations: [
          {
            type: "Analysis",
            priority: "medium",
            message: "Examine the deleted records to recover any potential evidence."
          }
        ],
        recovery_info: {
          is_corrupted: false,
          corruption_details: [],
          recovered_tables: ["mock_table"],
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
            sql: "CREATE INDEX idx_name ON mock_table(name);",
            table: "mock_table"
          }
        ],
        potential_improvements: [
          {
            type: "Performance",
            description: "Consider using WAL journal mode for better performance",
            impact: "medium"
          }
        ]
      }
    };

    // Wait 1 second to simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error("Error handling direct-analyze request:", error);
    return NextResponse.json(
      { 
        error: 'Failed to process database', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 