import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sqlite-forensic-analyzer-api.vercel.app';

export async function GET(
  request: NextRequest,
  { params }: { params: { route: string[] } }
) {
  const route = params.route?.join('/') || '';
  const { searchParams } = new URL(request.url);
  
  // Preserve query parameters
  const queryString = Array.from(searchParams.entries())
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  const apiPath = `${API_BASE_URL}/api/${route}${queryString ? `?${queryString}` : ''}`;
  
  console.log(`Proxying GET request to: ${apiPath}`);
  
  try {
    const response = await fetch(apiPath, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error proxying to ${apiPath}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch data from API' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { route: string[] } }
) {
  const route = params.route?.join('/') || '';
  const apiPath = `${API_BASE_URL}/api/${route}`;
  
  console.log(`Proxying POST request to: ${apiPath}`);
  
  try {
    // Get the content type to determine how to handle the request body
    const contentType = request.headers.get('content-type') || '';
    
    // Clone the request to create a new one we can forward
    // This is important for file uploads with FormData
    const clonedRequest = request.clone();
    
    // Forward the request to the API server
    const response = await fetch(apiPath, {
      method: 'POST',
      headers: {
        // Forward all headers except host
        ...Object.fromEntries(
          Array.from(request.headers.entries()).filter(([key]) => 
            key.toLowerCase() !== 'host'
          )
        ),
      },
      // Pass through the original request body
      body: clonedRequest.body,
    });
    
    // Check if the response is JSON
    const contentTypeHeader = response.headers.get('content-type') || '';
    if (contentTypeHeader.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      // For non-JSON responses
      const data = await response.text();
      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': contentTypeHeader,
        },
      });
    }
  } catch (error) {
    console.error(`Error proxying POST to ${apiPath}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch data from API' },
      { status: 500 }
    );
  }
} 