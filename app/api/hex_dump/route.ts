import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log("[POST] Handling /api/hex_dump request");
  
  try {
    // Get the request body
    const body = await request.json();
    console.log("Request body:", body);
    
    // Create mock hex data response instead of calling the API
    const mockHexData: {
      offset: number;
      length: number;
      hex_data: string[];
      ascii_data: string[];
    } = {
      offset: body.offset || 0,
      length: body.length || 256,
      hex_data: [],
      ascii_data: []
    };
    
    // Generate mock hex data
    const bytesPerRow = 16;
    const rows = Math.ceil(mockHexData.length / bytesPerRow);
    
    for (let i = 0; i < rows; i++) {
      let hexRow = '';
      let asciiRow = '';
      
      for (let j = 0; j < bytesPerRow && (i * bytesPerRow + j) < mockHexData.length; j++) {
        // Generate predictable byte based on position
        const byteValue = ((mockHexData.offset + i * bytesPerRow + j) % 256);
        hexRow += byteValue.toString(16).padStart(2, '0').toUpperCase() + ' ';
        
        // Generate ASCII representation
        if (byteValue >= 32 && byteValue <= 126) {
          asciiRow += String.fromCharCode(byteValue);
        } else {
          asciiRow += '.';
        }
      }
      
      mockHexData.hex_data.push(hexRow.trim());
      mockHexData.ascii_data.push(asciiRow);
    }
    
    return NextResponse.json(mockHexData);
  } catch (error) {
    console.error("Error handling hex_dump request:", error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve hex dump', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 