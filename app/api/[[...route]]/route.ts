import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { route: string[] } }
) {
  const path = params.route?.join('/') || '';
  
  return NextResponse.json({
    message: `Endpoint GET /${path} not implemented`,
    status: 404
  }, { status: 404 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { route: string[] } }
) {
  const path = params.route?.join('/') || '';
  
  return NextResponse.json({
    message: `Endpoint POST /${path} not implemented`,
    status: 404
  }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { route: string[] } }
) {
  const path = params.route?.join('/') || '';
  
  return NextResponse.json({
    message: `Endpoint PUT /${path} not implemented`,
    status: 404
  }, { status: 404 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { route: string[] } }
) {
  const path = params.route?.join('/') || '';
  
  return NextResponse.json({
    message: `Endpoint DELETE /${path} not implemented`,
    status: 404
  }, { status: 404 });
} 