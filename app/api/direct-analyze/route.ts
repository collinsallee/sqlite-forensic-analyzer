import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { API_BASE_URL } from '../../config';

// Helper function to analyze a SQLite database header
function analyzeHeader(headerBytes: Buffer): {
  isValid: boolean;
  signature: string;
  pageSize: number;
  encoding: string;
  journalMode?: string;
} {
  try {
    // Check for SQLite signature "SQLite format 3\0"
    const signature = headerBytes.toString('utf8', 0, 16);
    const isValid = signature === 'SQLite format 3\0';
    
    // Extract page size from bytes 16-17 (big endian)
    const pageSize = headerBytes.readUInt16BE(16);
    
    // Get text encoding (1=UTF-8, 2=UTF-16le, 3=UTF-16be)
    const encodingByte = headerBytes.readUInt8(56);
    let encoding = 'Unknown';
    switch (encodingByte) {
      case 1:
        encoding = 'UTF-8';
        break;
      case 2:
        encoding = 'UTF-16le';
        break;
      case 3:
        encoding = 'UTF-16be';
        break;
    }
    
    return {
      isValid,
      signature: isValid ? 'SQLite format 3' : 'Invalid signature',
      pageSize,
      encoding
    };
  } catch (error) {
    console.error('Error analyzing header:', error);
    return {
      isValid: false,
      signature: 'Error analyzing header',
      pageSize: 0,
      encoding: 'Unknown'
    };
  }
}

export async function POST(request: NextRequest) {
  console.log("[POST] Handling /api/direct-analyze request");
  
  try {
    // Clone the request to ensure we can access the body
    const clonedRequest = request.clone();
    
    // Get the form data
    const formData = await clonedRequest.formData();
    console.log("FormData received, processing file upload");
    
    // Determine if we should use a local backend or the remote API
    // Default to localhost:8000 when in development
    const apiBaseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8000' 
      : API_BASE_URL;
    
    // Forward the request to the actual backend API
    const apiPath = `${apiBaseUrl}/api/analyze-database`;
    console.log(`Forwarding to: ${apiPath}`);
    
    const response = await fetch(apiPath, {
      method: 'POST',
      // Pass through the form data directly
      body: formData,
    });
    
    // Log response status
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      console.error(`Error response from API: ${response.status} ${response.statusText}`);
      
      try {
        // Try to get error details if available
        const errorText = await response.text();
        console.error(`Error details: ${errorText}`);
        
        return NextResponse.json(
          { error: `API returned status ${response.status}`, details: errorText },
          { status: response.status }
        );
      } catch (e) {
        return NextResponse.json(
          { error: `API returned status ${response.status}` },
          { status: response.status }
        );
      }
    }
    
    // Return the API response
    const data = await response.json();
    return NextResponse.json(data);
    
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

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
  else return (bytes / 1073741824).toFixed(2) + ' GB';
} 