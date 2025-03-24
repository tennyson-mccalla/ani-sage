import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/app/lib/utils';
import { manualMappings } from '@/app/lib/utils/malsync/manual-mappings';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    console.log("Debug API called");
    
    // Return environment variables (safe ones for debugging)
    const envData = {
      NEXT_PUBLIC_USE_REAL_API: process.env.NEXT_PUBLIC_USE_REAL_API,
      DEBUG_RECOMMENDATIONS: process.env.DEBUG_RECOMMENDATIONS,
      FORCE_REAL_API: process.env.FORCE_REAL_API,
    };
    
    console.log("Environment variables:", JSON.stringify(envData));
    
    // Count manual mappings with image URLs
    const mappingsWithImages = Object.values(manualMappings).filter(m => m.imageUrl);
    console.log(`Manual mappings with images: ${mappingsWithImages.length}/${Object.keys(manualMappings).length}`);
    
    return NextResponse.json({
      success: true,
      env: envData,
      serverTime: new Date().toISOString(),
      manualMappingsCount: Object.keys(manualMappings).length,
      manualMappingsWithImages: mappingsWithImages.length,
      nodeEnv: process.env.NODE_ENV
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error in debug API:', error);
    return NextResponse.json({
      error: 'server_error',
      message: 'Error in debug endpoint',
      details: String(error)
    }, {
      status: 500,
      headers: corsHeaders()
    });
  }
}