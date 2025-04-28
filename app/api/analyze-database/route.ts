import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sqlite-forensic-analyzer-api.vercel.app';

export async function POST(request: NextRequest) {
  console.log("[POST] Handling /api/analyze-database request");
  
  try {
    // Clone the request to ensure we can access the body
    const clonedRequest = request.clone();
    
    // Get the form data
    const formData = await clonedRequest.formData();
    console.log("FormData received, processing file upload");
    
    // Forward the request to the actual API
    const apiPath = `${API_BASE_URL}/api/analyze-database`;
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
    
    const contentType = response.headers.get('content-type') || '';
    console.log(`Response content-type: ${contentType}`);
    
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
        },
      });
    }
  } catch (error) {
    console.error("Error handling analyze-database request:", error);
    return NextResponse.json(
      { 
        error: 'Failed to process database', 
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 