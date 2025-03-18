import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: "Hello from API root",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
}
