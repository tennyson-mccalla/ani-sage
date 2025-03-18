import { NextRequest, NextResponse } from 'next/server';
import { createApiAdapter } from '@/app/lib/anime-api-adapter';
import { corsHeaders } from '@/app/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const animeId = params.id;

    if (!animeId) {
      return NextResponse.json({
        error: 'bad_request',
        message: 'Missing anime ID'
      }, {
        status: 400,
        headers: corsHeaders()
      });
    }

    const apiAdapter = createApiAdapter();
    const details = await apiAdapter.getAnimeDetails(parseInt(animeId, 10));

    if (!details) {
      return NextResponse.json({
        error: 'not_found',
        message: 'Anime not found'
      }, {
        status: 404,
        headers: corsHeaders()
      });
    }

    return NextResponse.json({ anime: details }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error getting anime details:', error);
    return NextResponse.json({
      error: 'server_error',
      message: 'Error retrieving anime details',
      details: String(error)
    }, {
      status: 500,
      headers: corsHeaders()
    });
  }
}
