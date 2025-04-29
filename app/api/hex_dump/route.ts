import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '../../config';

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
    
    // Determine if we should use a local backend or the remote API
    // Default to localhost:8000 when in development
    const apiBaseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8000' 
      : API_BASE_URL;
    
    // Forward the request to the actual backend API
    const apiPath = `${apiBaseUrl}/api/hex_dump`;
    console.log(`Forwarding to: ${apiPath}`);
    
    const response = await fetch(apiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_id: fileId,
        offset: offset,
        length: length,
      }),
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