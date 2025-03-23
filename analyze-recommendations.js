// Simple script to analyze and compare recommendations from different profiles

// Read the JSON files saved by the test script
const fs = require('fs');

try {
  // Load recommendation data
  const calmRecsPath = './test-results/calm-profile-recommendations.json';
  const intenseRecsPath = './test-results/intense-profile-recommendations.json';
  
  if (!fs.existsSync(calmRecsPath) || !fs.existsSync(intenseRecsPath)) {
    console.error("Recommendation files not found. Please run test-recommendations.sh first.");
    process.exit(1);
  }
  
  const calmData = JSON.parse(fs.readFileSync(calmRecsPath, 'utf8'));
  const intenseData = JSON.parse(fs.readFileSync(intenseRecsPath, 'utf8'));
  
  // Extract recommendations
  const calmRecs = calmData.recommendations || [];
  const intenseRecs = intenseData.recommendations || [];
  
  console.log("===== RECOMMENDATION ANALYSIS =====");
  console.log(`Calm Profile: ${calmRecs.length} recommendations`);
  console.log(`Intense Profile: ${intenseRecs.length} recommendations`);
  
  // Compare titles
  const calmTitles = new Set(calmRecs.map(rec => rec.title));
  const intenseTitles = new Set(intenseRecs.map(rec => rec.title));
  
  // Find common titles
  const commonTitles = [...calmTitles].filter(title => intenseTitles.has(title));
  
  console.log(`\nCommon recommendations: ${commonTitles.length} titles`);
  console.log(`Unique to calm profile: ${calmTitles.size - commonTitles.length} titles`);
  console.log(`Unique to intense profile: ${intenseTitles.size - commonTitles.length} titles`);
  
  // Calculate recommendation overlap percentage
  const overlapPercentage = (commonTitles.length / Math.min(calmTitles.size, intenseTitles.size)) * 100;
  console.log(`Overlap percentage: ${overlapPercentage.toFixed(1)}%`);
  console.log(`Differentiation: ${(100 - overlapPercentage).toFixed(1)}%`);
  
  // Compare top 5 recommendations
  console.log("\n===== TOP 5 RECOMMENDATIONS =====");
  console.log("CALM PROFILE:");
  calmRecs.slice(0, 5).forEach((rec, i) => {
    console.log(`${i+1}. ${rec.title} - ${rec.match}% match`);
  });
  
  console.log("\nINTENSE PROFILE:");
  intenseRecs.slice(0, 5).forEach((rec, i) => {
    console.log(`${i+1}. ${rec.title} - ${rec.match}% match`);
  });
  
  // Show common titles between the two lists
  if (commonTitles.length > 0) {
    console.log("\n===== COMMON TITLES =====");
    commonTitles.forEach(title => {
      const calmRec = calmRecs.find(rec => rec.title === title);
      const intenseRec = intenseRecs.find(rec => rec.title === title);
      console.log(`${title}:`);
      console.log(`  - Calm profile match: ${calmRec?.match}%`);
      console.log(`  - Intense profile match: ${intenseRec?.match}%`);
      console.log();
    });
  }
  
  console.log("Analysis complete!");

} catch (error) {
  console.error("Error analyzing recommendations:", error);
}