import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { questions } from '@/app/lib/question-bank';
import { corsHeaders } from '@/app/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const count = searchParams.get('count') || '5';
    const stage = searchParams.get('stage');
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({
        error: 'bad_request',
        message: 'Missing sessionId'
      }, {
        status: 400,
        headers: corsHeaders()
      });
    }

    const session = await db.getSession(sessionId);
    if (!session) {
      return NextResponse.json({
        error: 'not_found',
        message: 'Session not found'
      }, {
        status: 404,
        headers: corsHeaders()
      });
    }

    const profile = await db.getProfile(session.profileId);
    if (!profile) {
      return NextResponse.json({
        error: 'not_found',
        message: 'Profile not found'
      }, {
        status: 404,
        headers: corsHeaders()
      });
    }

    let availableQuestions = questions;
    if (stage) {
      const stageNum = parseInt(stage, 10);
      availableQuestions = questions.filter(q => q.stage === stageNum);
    }

    availableQuestions = availableQuestions.filter(q => !profile.answeredQuestions.includes(q.id));

    let selectedQuestions = [];
    const targetDimensions = Object.entries(profile.confidences || {})
      .filter(([_, confidence]) => confidence < 0.5)
      .map(([dimension]) => dimension);

    if (targetDimensions.length > 0) {
      selectedQuestions = availableQuestions.filter(q =>
        q.targetDimensions?.some(d => targetDimensions.includes(d))
      );
    }

    while (selectedQuestions.length < parseInt(count)) {
      const remaining = availableQuestions.filter(
        q => !selectedQuestions.includes(q)
      );
      if (remaining.length === 0) break;

      const randomIndex = Math.floor(Math.random() * remaining.length);
      selectedQuestions.push(remaining[randomIndex]);
    }

    const formattedQuestions = selectedQuestions.map(q => ({
      id: q.id,
      type: q.type,
      text: q.text,
      description: q.description,
      imageUrl: q.imageUrl,
      options: q.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        imageUrl: opt.imageUrl
      })),
      stage: q.stage
    }));

    return NextResponse.json({ questions: formattedQuestions }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error getting questions:', error);
    return NextResponse.json({
      error: 'server_error',
      message: 'Error retrieving questions',
      details: String(error)
    }, {
      status: 500,
      headers: corsHeaders()
    });
  }
}
