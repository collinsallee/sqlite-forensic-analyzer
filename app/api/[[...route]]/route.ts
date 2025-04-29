import { NextRequest, NextResponse } from 'next/server';

type RouteParams = {
  route?: string[];
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const params = await context.params;
  const path = params.route?.join('/') || '';
  
  return NextResponse.json({
    message: `Endpoint GET /${path} not implemented`,
    status: 404
  }, { status: 404 });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const params = await context.params;
  const path = params.route?.join('/') || '';
  
  return NextResponse.json({
    message: `Endpoint POST /${path} not implemented`,
    status: 404
  }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const params = await context.params;
  const path = params.route?.join('/') || '';
  
  return NextResponse.json({
    message: `Endpoint PUT /${path} not implemented`,
    status: 404
  }, { status: 404 });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const params = await context.params;
  const path = params.route?.join('/') || '';
  
  return NextResponse.json({
    message: `Endpoint DELETE /${path} not implemented`,
    status: 404
  }, { status: 404 });
} 