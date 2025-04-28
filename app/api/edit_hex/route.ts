import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log("[POST] Handling /api/edit_hex request");
  
  try {
    const body = await request.json();
    console.log("Received hex edit request:", body);
    
    // Normally this would modify the actual file, but for mock purposes
    // we'll just return a success message
    return NextResponse.json({
      success: true,
      message: "Hex data successfully updated",
      updated_offset: body.offset,
      updated_length: body.hex_value ? body.hex_value.length / 2 : 0, // Each byte is 2 hex chars
      timestamp: new Date().toISOString()
    });
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