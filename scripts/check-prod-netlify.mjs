import fetch from 'node-fetch';

const SITE_URL = process.env.NETLIFY_SITE_URL || 'http://localhost:8888';
const FUNCTION_URL = `${SITE_URL}/.netlify/functions/prod-readiness-check`;

console.log('🔍 Running Production Readiness Check via Netlify Function...\n');
console.log(`Calling: ${FUNCTION_URL}\n`);

try {
  const response = await fetch(FUNCTION_URL, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  const data = await response.json();

  if (data.consoleOutput) {
    console.log(data.consoleOutput);
  } else {
    // Fallback to JSON output
    console.log(JSON.stringify(data, null, 2));
  }

  // Exit with appropriate code
  process.exitCode = data.allPassed ? 0 : 1;
} catch (error) {
  console.error('❌ Error calling Netlify function:', error.message);
  console.error('\nMake sure:');
  console.error('1. Netlify Dev is running: npx netlify dev');
  console.error('2. Or set NETLIFY_SITE_URL to your deployed site URL');
  console.error('3. The function is deployed to Netlify');
  process.exitCode = 1;
}

