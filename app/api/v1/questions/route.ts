import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/api/db';
import { questions } from '@/api/question-bank';
import { corsHeaders } from '@/api/utils';

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

    if (profile.confidences) {
      const sortedDimensions = Object.entries(profile.confidences)
        .map(([dimension, confidence]) => ({
          dimension,
          confidence: confidence as number
        }))
        .sort((a, b) => (a.confidence as number) - (b.confidence as number));

      const targetDimensions = sortedDimensions
        .slice(0, 3)
        .map(d => d.dimension);

      const targetingQuestions = availableQuestions.filter(q =>
        q.targetDimensions && q.targetDimensions.some(d => targetDimensions.includes(d))
      );

      if (targetingQuestions.length > 0) {
        while (selectedQuestions.length < Math.min(Number(count), targetingQuestions.length)) {
          const randomIndex = Math.floor(Math.random() * targetingQuestions.length);
          const question = targetingQuestions[randomIndex];

          if (!selectedQuestions.find(q => q.id === question.id)) {
            selectedQuestions.push(question);
          }

          targetingQuestions.splice(randomIndex, 1);
        }
      }
    }

    while (selectedQuestions.length < Math.min(Number(count), availableQuestions.length)) {
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      const question = availableQuestions[randomIndex];

      if (!selectedQuestions.find(q => q.id === question.id)) {
        selectedQuestions.push(question);
      }

      availableQuestions.splice(randomIndex, 1);
    }

    const formattedQuestions = selectedQuestions.map(q => ({
      id: q.id,
      type: q.type || 'text',
      text: q.text,
      description: q.description || '',
      imageUrl: q.imageUrl || '',
      options: q.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        imageUrl: opt.imageUrl || '',
        value: opt.value || 0,
        dimensionUpdates: opt.dimensionUpdates || {},
        confidenceUpdates: opt.confidenceUpdates || {}
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
