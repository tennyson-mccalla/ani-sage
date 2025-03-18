import { NextResponse } from 'next/server';
import { corsHeaders } from '@/app/lib/utils';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET() {
  return NextResponse.json({
    message: "Hello from API root",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
}
