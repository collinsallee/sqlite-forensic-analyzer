import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  console.log(`[GET] Handling /api/files/${params.fileId} request`);
  
  try {
    // Mock file info response
    const mockFileInfo = {
      file_id: params.fileId,
      file_size: 102400, // 100KB
      file_name: "sample.db",
      creation_time: new Date().toISOString(),
      metadata: {
        type: "SQLite Database",
        version: "3.39.4"
      }
    };
    
    return NextResponse.json(mockFileInfo);
  } catch (error) {
    console.error(`Error handling file info request for ${params.fileId}:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve file info', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 