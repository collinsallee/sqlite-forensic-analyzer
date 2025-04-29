import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log("[POST] Handling /api/edit_hex request");
  
  try {
    const body = await request.json();
    console.log("Received hex edit request:", body);
    
    const fileId = body.file_id;
    const offset = body.offset || 0;
    const hexValue = body.hex_value || '';
    
    // If we're in a browser environment with Electron available
    if (typeof window !== 'undefined' && window.electron) {
      // Use Electron's IPC to edit the file
      const result = await window.electron.editFile(fileId, offset, hexValue);
      
      if (!result.success) {
        return NextResponse.json({ error: 'Failed to edit file' }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        message: "Hex data successfully updated",
        updated_offset: offset,
        updated_length: hexValue.length / 2, // Each byte is 2 hex chars
        timestamp: new Date().toISOString()
      });
    } else {
      // Mock response for SSR or when Electron is not available
      return NextResponse.json({
        success: true,
        message: "Hex data successfully updated (mock)",
        updated_offset: offset,
        updated_length: hexValue ? hexValue.length / 2 : 0, // Each byte is 2 hex chars
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Error handling hex edit request:", error);
    return NextResponse.json(
      { 
        error: 'Failed to update hex data', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 