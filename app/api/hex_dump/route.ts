import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sqlite-forensic-analyzer-api.vercel.app';

export async function POST(request: NextRequest) {
  console.log("[POST] Handling /api/hex_dump request");
  
  try {
    // Get the request body
    const body = await request.json();
    console.log("Request body:", body);
    
    // Forward the request to the actual API
    const apiPath = `${API_BASE_URL}/api/hex_dump`;
    console.log(`Forwarding to: ${apiPath}`);
    
    const response = await fetch(apiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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