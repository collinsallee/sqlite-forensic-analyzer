import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log("[GET] Handling /api/backups request");
  
  try {
    // Mock backups list response
    const mockBackups = [
      {
        filename: "backup_20230101.sqlite",
        created: new Date("2023-01-01").toISOString(),
        size: 51200, // 50KB
        description: "Automatic backup"
      },
      {
        filename: "backup_20230215.sqlite",
        created: new Date("2023-02-15").toISOString(),
        size: 65536, // 64KB
        description: "Manual backup"
      },
      {
        filename: "backup_20230320.sqlite",
        created: new Date("2023-03-20").toISOString(),
        size: 81920, // 80KB
        description: "Pre-upgrade backup"
      }
    ];
    
    return NextResponse.json(mockBackups);
  } catch (error) {
    console.error("Error handling backups request:", error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve backups', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 