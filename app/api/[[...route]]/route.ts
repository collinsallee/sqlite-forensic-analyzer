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
  
  try {
    // Get the request body
    const contentType = request.headers.get('content-type') || '';
    let body: any;
    
    if (contentType.includes('multipart/form-data')) {
      // For file uploads, we need to forward the FormData
      const formData = await request.formData();
      body = formData;
    } else {
      // For JSON data
      body = await request.json().catch(() => ({}));
    }
    
    const apiPath = `${API_BASE_URL}/api/${route}`;
    
    const response = await fetch(apiPath, {
      method: 'POST',
      headers: contentType.includes('multipart/form-data') 
        ? {} // Let the browser set the correct content-type with boundary for FormData
        : { 'Content-Type': 'application/json' },
      body: contentType.includes('multipart/form-data') ? body : JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error proxying POST to /api/${route}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch data from API' },
      { status: 500 }
    );
  }
} 