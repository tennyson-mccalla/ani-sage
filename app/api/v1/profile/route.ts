import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { corsHeaders } from '@/app/lib/utils';

export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/v1/profile called");
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    console.log("Looking up profile for sessionId:", sessionId);

    if (!sessionId) {
      console.log("No sessionId provided");
      return NextResponse.json({
        error: 'bad_request',
        message: 'Missing sessionId'
      }, {
        status: 400,
        headers: corsHeaders()
      });
    }

    // Check if the session exists using our database interface
    const session = await db.getSession(sessionId);
    console.log("Session lookup result:", session);
    
    if (!session) {
      console.log("Session not found for ID:", sessionId);
      
      // For debug only: If it's a mock session ID, create a fake profile
      if (sessionId.startsWith('mock-')) {
        console.log("Creating fake profile for mock session");
        const mockProfileId = "mock-profile-1";
        
        // Create a fake session and profile
        const mockSession = {
          id: sessionId,
          profileId: mockProfileId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Store directly
        inMemoryDb.sessions.set(sessionId, mockSession);
        
        // Create a mock profile
        const mockProfile = {
          id: mockProfileId,
          dimensions: {
            'visualComplexity': 7.5,
            'narrativeComplexity': 8.2,
            'emotionalIntensity': 6.8,
            'characterComplexity': 8.5,
            'moralAmbiguity': 7.9
          },
          confidences: {},
          answeredQuestions: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        inMemoryDb.profiles.set(mockProfileId, mockProfile);
        
        // Convert dimensions for response
        const dimensionsArray = Object.entries(mockProfile.dimensions).map(([name, value]) => ({
          name,
          value,
          min: 1,
          max: 10,
          lowLabel: `Low ${name}`,
          highLabel: `High ${name}`
        }));
        
        return NextResponse.json({
          profile: {
            dimensions: dimensionsArray,
            confidences: {},
            answeredQuestions: [],
            suggestedAdjustments: []
          }
        }, { headers: corsHeaders() });
      }
      
      return NextResponse.json({
        error: 'not_found',
        message: 'Session not found'
      }, {
        status: 404,
        headers: corsHeaders()
      });
    }

    // Look up profile using database interface
    const profile = await db.getProfile(session.profileId);
    console.log("Profile lookup result:", profile);
    
    if (!profile) {
      console.log("Profile not found for ID:", session.profileId);
      return NextResponse.json({
        error: 'not_found',
        message: 'Profile not found'
      }, {
        status: 404,
        headers: corsHeaders()
      });
    }

    // Convert dimensions object to array format expected by frontend
    const dimensionsArray = Object.entries(profile.dimensions || {}).map(([name, value]) => ({
      name,
      value,
      min: 1,
      max: 10,
      lowLabel: `Low ${name}`,
      highLabel: `High ${name}`
    }));

    return NextResponse.json({
      profile: {
        dimensions: dimensionsArray,
        confidences: profile.confidences || {},
        answeredQuestions: profile.answeredQuestions || [],
        suggestedAdjustments: [
          {
            dimension: 'Narrative Complexity',
            explanation: 'Based on your answers, we suggest adjusting this value.',
            currentValue: 8.2,
            suggestedValue: 9.1
          }
        ]
      }
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error getting profile:', error);
    return NextResponse.json({
      error: 'server_error',
      message: 'Error retrieving profile',
      details: String(error)
    }, {
      status: 500,
      headers: corsHeaders()
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    const data = await request.json();
    const { answers } = data;

    console.log('POST /api/v1/profile called with sessionId:', sessionId);
    console.log('Request body:', data);

    if (!sessionId) {
      return NextResponse.json({
        error: 'bad_request',
        message: 'Missing sessionId'
      }, { 
        status: 400,
        headers: corsHeaders()
      });
    }

    // Use the database interface directly - don't try to access storage
    const session = await db.getSession(sessionId);
    console.log("Session direct lookup result:", session);
    
    if (!session) {
      console.log('Session not found:', sessionId);
      return NextResponse.json({
        error: 'not_found',
        message: 'Session not found'
      }, { 
        status: 404,
        headers: corsHeaders()
      });
    }

    // Use database interface to get profile
    const profile = await db.getProfile(session.profileId);
    console.log("Profile direct lookup result:", profile);
    
    if (!profile) {
      console.log('Profile not found:', session.profileId);
      return NextResponse.json({
        error: 'not_found',
        message: 'Profile not found'
      }, { 
        status: 404,
        headers: corsHeaders()
      });
    }

    // Process answers
    if (answers && typeof answers === 'object') {
      // Add question IDs to answered questions list
      Object.keys(answers).forEach(questionId => {
        if (!profile.answeredQuestions.includes(questionId)) {
          profile.answeredQuestions.push(questionId);
        }
      });
      
      // In a real implementation, we would have a proper mapping algorithm
      // For now, use the answers to generate dimension values
      
      // Map the answers to dimensions
      const dimensionMapping = {
        'visual-style': {
          'clean-simple': { name: 'visualComplexity', value: 3.2 },
          'balanced': { name: 'visualComplexity', value: 6.5 },
          'dynamic': { name: 'visualComplexity', value: 9.1 }
        },
        'narrative-complexity': {
          'low-complexity': { name: 'narrativeComplexity', value: 3.4 },
          'medium-complexity': { name: 'narrativeComplexity', value: 6.7 },
          'high-complexity': { name: 'narrativeComplexity', value: 9.2 }
        },
        'character-depth': {
          'simple-characters': { name: 'characterComplexity', value: 3.3 },
          'moderate-development': { name: 'characterComplexity', value: 6.6 },
          'complex-characters': { name: 'characterComplexity', value: 9.4 }
        },
        'moral-ambiguity': {
          'clear-morals': { name: 'moralAmbiguity', value: 2.5 },
          'some-gray-areas': { name: 'moralAmbiguity', value: 6.0 },
          'ambiguous': { name: 'moralAmbiguity', value: 9.5 }
        },
        'emotional-tone': {
          'light-optimistic': { name: 'emotionalIntensity', value: 3.0 },
          'balanced-tone': { name: 'emotionalIntensity', value: 5.5 },
          'dark-intense': { name: 'emotionalIntensity', value: 8.5 },
          'bittersweet-reflective': { name: 'emotionalIntensity', value: 7.0 }
        }
      };
      
      // Initialize dimensions object if it doesn't exist
      profile.dimensions = profile.dimensions || {};
      
      // Update dimensions based on answers
      Object.entries(answers).forEach(([question, answer]) => {
        const mapping = dimensionMapping[question]?.[answer];
        if (mapping) {
          profile.dimensions[mapping.name] = mapping.value;
        }
      });
      
      // Make sure we have all dimensions with defaults
      if (!profile.dimensions['visualComplexity']) profile.dimensions['visualComplexity'] = 5.0;
      if (!profile.dimensions['narrativeComplexity']) profile.dimensions['narrativeComplexity'] = 5.0;
      if (!profile.dimensions['emotionalIntensity']) profile.dimensions['emotionalIntensity'] = 5.0;
      if (!profile.dimensions['characterComplexity']) profile.dimensions['characterComplexity'] = 5.0;
      if (!profile.dimensions['moralAmbiguity']) profile.dimensions['moralAmbiguity'] = 5.0;
    }

    // Save updated profile
    await db.updateProfile(profile);

    // Convert dimensions object to array format expected by frontend
    const dimensionsArray = Object.entries(profile.dimensions || {}).map(([name, value]) => ({
      name,
      value,
      min: 1,
      max: 10,
      lowLabel: `Low ${name}`,
      highLabel: `High ${name}`
    }));

    return NextResponse.json({
      success: true,
      profile: {
        dimensions: dimensionsArray,
        confidences: profile.confidences || {},
        answeredQuestions: profile.answeredQuestions || [],
        suggestedAdjustments: [
          {
            dimension: 'Narrative Complexity',
            explanation: 'Based on your answers, we suggest adjusting this value.',
            currentValue: 8.2,
            suggestedValue: 9.1
          }
        ]
      }
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({
      error: 'server_error',
      message: 'Error updating profile',
      details: String(error)
    }, { status: 500 });
  }
}
