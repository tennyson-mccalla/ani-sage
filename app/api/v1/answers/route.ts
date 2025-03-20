import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { questions } from '@/app/lib/question-bank';
import { corsHeaders } from '@/app/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { optionId, sessionId, questionId } = data;

    if (!sessionId || !optionId) {
      return NextResponse.json({
        error: 'bad_request',
        message: 'Missing required fields'
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

    const question = questions.find(q => q.id === questionId);
    if (!question) {
      return NextResponse.json({
        error: 'not_found',
        message: 'Question not found'
      }, {
        status: 404,
        headers: corsHeaders()
      });
    }

    const option = question.options.find(opt => opt.id === optionId);
    if (!option) {
      return NextResponse.json({
        error: 'bad_request',
        message: 'Invalid option selected'
      }, {
        status: 400,
        headers: corsHeaders()
      });
    }

    const updatedProfile = await updateProfileWithAnswer(profile, questionId, optionId);

    return NextResponse.json({
      success: true,
      profile: {
        dimensions: updatedProfile.dimensions,
        confidences: updatedProfile.confidences
      }
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json({
      error: 'server_error',
      message: 'Error processing answer',
      details: String(error)
    }, {
      status: 500,
      headers: corsHeaders()
    });
  }
}

async function updateProfileWithAnswer(profile: any, questionId: string, selectedOptionId: string): Promise<any> {
  const question = questions.find(q => q.id === questionId);
  if (!question) {
    throw new Error(`Question not found: ${questionId}`);
  }

  const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
  if (!selectedOption) {
    throw new Error(`Option not found: ${selectedOptionId}`);
  }

  const updatedProfile = {
    ...profile,
    answeredQuestions: [...profile.answeredQuestions, questionId],
    updatedAt: new Date()
  };

  if (selectedOption.mappings) {
    for (const mapping of selectedOption.mappings) {
      const { dimension, value } = mapping;
      updatedProfile.dimensions[dimension] = (updatedProfile.dimensions[dimension] || 0) + value;
    }
  }

  if (selectedOption.mappings) {
    for (const mapping of selectedOption.mappings) {
      const { dimension } = mapping;
      updatedProfile.confidences[dimension] = Math.max(0, Math.min(1,
        (updatedProfile.confidences[dimension] || 0) + 0.1
      ));
    }
  }

  await db.updateProfile(updatedProfile);

  return updatedProfile;
}
