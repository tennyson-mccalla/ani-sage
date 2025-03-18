import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { corsHeaders } from '@/app/lib/utils';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET() {
  return NextResponse.json({
    message: "Hello from session endpoint",
    timestamp: new Date().toISOString()
  });
}
