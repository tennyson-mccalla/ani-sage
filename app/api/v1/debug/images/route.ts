import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/app/lib/utils';
import { getImageUrlFromManualMapping, manualMappings } from '@/app/lib/utils/malsync/manual-mappings';

// Set dynamic runtime to handle URL search parameters
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    console.log("GET /api/v1/debug/images called");
    
    // Convert manual mappings to desired format
    const imageMappings = Object.entries(manualMappings).map(([id, mapping]) => {
      return {
        id,
        title: mapping.title,
        type: 'TMDb',
        imageUrl: mapping.imageUrl || `https://dummyimage.com/600x900/3498db/ffffff&text=${encodeURIComponent(mapping.title)}`
      };
    });
    
    // Sort by title for readability
    imageMappings.sort((a, b) => a.title.localeCompare(b.title));
    
    return NextResponse.json({
      success: true,
      mappingsCount: imageMappings.length,
      mappings: imageMappings
    }, { 
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('Error in debug images endpoint:', error);
    return NextResponse.json({
      error: 'server_error',
      message: 'Error retrieving image mappings',
      details: String(error)
    }, {
      status: 500,
      headers: corsHeaders()
    });
  }
}