import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log("[POST] Handling /api/hex_dump request");
  
  try {
    // Get the request body
    const body = await request.json();
    console.log("Request body:", body);
    
    // Extract request parameters
    const fileId = body.file_id;
    const offset = body.offset || 0;
    const length = body.length || 256;
    
    // If we're in a browser environment with Electron available
    if (typeof window !== 'undefined' && window.electron) {
      // Use Electron's IPC to read the file
      const result = await window.electron.readFile(fileId, offset, length);
      
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      
      // Convert the hex string to an array of rows (16 bytes per row)
      const hexData: string[] = [];
      const asciiData: string[] = [];
      const bytesPerRow = 16;
      
      const hexString = result.data;
      for (let i = 0; i < hexString.length; i += bytesPerRow * 2) {
        // Each byte is 2 hex chars
        const rowHex = hexString.slice(i, i + bytesPerRow * 2);
        let hexRow = '';
        let asciiRow = '';
        
        // Process each byte in the row
        for (let j = 0; j < rowHex.length; j += 2) {
          const hexByte = rowHex.slice(j, j + 2);
          hexRow += hexByte.toUpperCase() + ' ';
          
          // Convert to ASCII character
          const byte = parseInt(hexByte, 16);
          if (byte >= 32 && byte <= 126) {
            asciiRow += String.fromCharCode(byte);
          } else {
            asciiRow += '.';
          }
        }
        
        hexData.push(hexRow.trim());
        asciiData.push(asciiRow);
      }
      
      return NextResponse.json({
        offset,
        length: result.length,
        hex_data: hexData,
        ascii_data: asciiData
      });
    } else {
      // Fallback to mock data for SSR or when Electron is not available
      const mockHexData: {
        offset: number;
        length: number;
        hex_data: string[];
        ascii_data: string[];
      } = {
        offset,
        length,
        hex_data: [],
        ascii_data: []
      };
      
      // Generate mock hex data
      const bytesPerRow = 16;
      const rows = Math.ceil(length / bytesPerRow);
      
      for (let i = 0; i < rows; i++) {
        let hexRow = '';
        let asciiRow = '';
        
        for (let j = 0; j < bytesPerRow && (i * bytesPerRow + j) < length; j++) {
          // Generate predictable byte based on position
          const byteValue = ((offset + i * bytesPerRow + j) % 256);
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
    }
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