import { NextRequest, NextResponse } from 'next/server';

type FileParams = {
  fileId: string;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<FileParams> }
) {
  const params = await context.params;
  console.log(`[GET] Handling /api/files/${params.fileId} request`);
  
  try {
    const fileId = params.fileId;
    
    // If we're in a browser environment with Electron available
    if (typeof window !== 'undefined' && window.electron) {
      // Use Electron's IPC to get file info
      const fileInfo = await window.electron.getFileInfo(fileId);
      
      if (fileInfo.error) {
        return NextResponse.json({ error: fileInfo.error }, { status: 404 });
      }
      
      // Add additional metadata
      const enrichedFileInfo = {
        ...fileInfo,
        metadata: {
          type: "SQLite Database",
          version: "3.39.4"
        }
      };
      
      return NextResponse.json(enrichedFileInfo);
    } else {
      // Mock file info response for SSR or when Electron is not available
      const mockFileInfo = {
        file_id: fileId,
        file_size: 102400, // 100KB
        file_name: "sample.db",
        creation_time: new Date().toISOString(),
        metadata: {
          type: "SQLite Database",
          version: "3.39.4"
        }
      };
      
      return NextResponse.json(mockFileInfo);
    }
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