import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '../../config';

export async function POST(request: NextRequest) {
  return NextResponse.json({
    status: 'success',
    message: 'API proxy is functioning correctly',
    api_base_url: API_BASE_URL,
    timestamp: new Date().toISOString()
  });
} 