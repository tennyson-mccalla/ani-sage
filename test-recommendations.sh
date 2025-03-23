#!/bin/bash

# Test different profiles getting different recommendations
BASE_URL="http://localhost:3000/api/v1"  # Next.js API routes path
SESSION_ID1=$(uuidgen | tr '[:upper:]' '[:lower:]' || echo "test-$(date +%s)-1") # Fallback if uuidgen not available
SESSION_ID2=$(uuidgen | tr '[:upper:]' '[:lower:]' || echo "test-$(date +%s)-2") # Fallback if uuidgen not available

echo "====== PROFILE TEST ======"
echo "Testing if different profiles get different recommendations"
echo ""

# Create first session with calm/thoughtful profile
echo "Creating calm/simple profile with session ID: $SESSION_ID1"
curl -s "$BASE_URL/session" -H "Content-Type: application/json" -d "{\"sessionId\": \"$SESSION_ID1\"}" > /dev/null

# Submit answers for calm profile
echo "Submitting answers for calm profile..."
curl -s "$BASE_URL/answers" -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID1\", \"answers\": {
    \"visual_complexity_1\": \"simple\",
    \"color_palette_1\": \"muted\",
    \"animation_style_1\": \"fluid_realistic\",
    \"narrative_complexity_1\": \"straightforward\",
    \"pacing_preference_1\": \"slow_thoughtful\",
    \"plot_predictability_1\": \"comfort_predictability\",
    \"emotional_intensity_1\": \"mild\",
    \"emotional_tone_1\": \"light_hearted\",
    \"character_complexity_1\": \"simple_clear\",
    \"character_growth_1\": \"minimal_growth\"
  }}" > /dev/null

# Update profile for first session
echo "Updating profile for calm preferences..."
curl -s "$BASE_URL/profile?sessionId=$SESSION_ID1" -X POST -H "Content-Type: application/json" \
  -d "{\"answers\": {
    \"visual_complexity_1\": \"simple\",
    \"color_palette_1\": \"muted\",
    \"animation_style_1\": \"fluid_realistic\",
    \"narrative_complexity_1\": \"straightforward\",
    \"pacing_preference_1\": \"slow_thoughtful\",
    \"plot_predictability_1\": \"comfort_predictability\",
    \"emotional_intensity_1\": \"mild\",
    \"emotional_tone_1\": \"light_hearted\",
    \"character_complexity_1\": \"simple_clear\",
    \"character_growth_1\": \"minimal_growth\"
  }}" > /dev/null

# Get recommendations for calm profile
echo "Getting recommendations for calm profile..."
CALM_RECS=$(curl -s "$BASE_URL/recommendations?sessionId=$SESSION_ID1")
echo "Received recommendations for calm profile"
echo "Response: ${CALM_RECS:0:100}..." # Print first 100 chars to debug

# Create second session with intense/complex profile
echo -e "\nCreating intense/complex profile with session ID: $SESSION_ID2"
curl -s "$BASE_URL/session" -H "Content-Type: application/json" -d "{\"sessionId\": \"$SESSION_ID2\"}" > /dev/null

# Submit answers for intense profile
echo "Submitting answers for intense profile..."
curl -s "$BASE_URL/answers" -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID2\", \"answers\": {
    \"visual_complexity_1\": \"complex\",
    \"color_palette_1\": \"vivid\",
    \"animation_style_1\": \"stylized\",
    \"narrative_complexity_1\": \"complex\",
    \"pacing_preference_1\": \"fast_action\",
    \"plot_predictability_1\": \"unpredictable_twists\",
    \"emotional_intensity_1\": \"intense\",
    \"emotional_tone_1\": \"serious\",
    \"character_complexity_1\": \"complex_nuanced\",
    \"character_growth_1\": \"significant_growth\"
  }}" > /dev/null

# Update profile for second session
echo "Updating profile for intense preferences..."
curl -s "$BASE_URL/profile?sessionId=$SESSION_ID2" -X POST -H "Content-Type: application/json" \
  -d "{\"answers\": {
    \"visual_complexity_1\": \"complex\",
    \"color_palette_1\": \"vivid\",
    \"animation_style_1\": \"stylized\",
    \"narrative_complexity_1\": \"complex\",
    \"pacing_preference_1\": \"fast_action\",
    \"plot_predictability_1\": \"unpredictable_twists\",
    \"emotional_intensity_1\": \"intense\",
    \"emotional_tone_1\": \"serious\",
    \"character_complexity_1\": \"complex_nuanced\",
    \"character_growth_1\": \"significant_growth\"
  }}" > /dev/null

# Get recommendations for intense profile
echo "Getting recommendations for intense profile..."
INTENSE_RECS=$(curl -s "$BASE_URL/recommendations?sessionId=$SESSION_ID2")
echo "Received recommendations for intense profile" 
echo "Response: ${INTENSE_RECS:0:100}..." # Print first 100 chars to debug

# Extract titles and match scores for each profile's recommendations
echo -e "\n===== CALM PROFILE RECOMMENDATIONS ====="
echo "$CALM_RECS" | grep -Eo '"title":"[^"]*"' | cut -d'"' -f4 | nl | head -5
echo -e "\n===== INTENSE PROFILE RECOMMENDATIONS ====="
echo "$INTENSE_RECS" | grep -Eo '"title":"[^"]*"' | cut -d'"' -f4 | nl | head -5

# Save full results to files for comparison
mkdir -p test-results
echo "$CALM_RECS" > test-results/calm-profile-recommendations.json
echo "$INTENSE_RECS" > test-results/intense-profile-recommendations.json

echo -e "\nFull results saved to test-results directory"
echo "Test completed!"