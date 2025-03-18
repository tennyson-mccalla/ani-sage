import { NextResponse } from 'next/server';
import { corsHeaders } from '@/app/lib/utils';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET() {
  return NextResponse.json({
    version: '1.0.0',
    status: 'ok'
  }, { headers: corsHeaders() });
}
