// ============================================================================
// DIAGNOSTIC: Test if your Worker handles OPTIONS correctly
// ============================================================================
//
// Run this in your terminal to test if Worker CORS is working:
// ============================================================================

// Test 1: Check if Worker responds to OPTIONS
console.log("Test 1: Sending OPTIONS request...");

fetch('https://compute-exchange-lead-capture.cx-portal.workers.dev/', {
  method: 'OPTIONS',
  headers: {
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type, X-CX-Frontend-Signature',
    'Origin': 'http://localhost:3000'
  }
})
.then(response => {
  console.log('Response status:', response.status);
  console.log('Response headers:', [...response.headers.entries()]);

  const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
  const corsMethods = response.headers.get('Access-Control-Allow-Methods');
  const corsHeaders = response.headers.get('Access-Control-Allow-Headers');

  if (!corsOrigin) {
    console.error('❌ FAIL: No Access-Control-Allow-Origin header found!');
    console.error('Your Worker is NOT handling OPTIONS requests correctly.');
  } else {
    console.log('✓ PASS: Access-Control-Allow-Origin:', corsOrigin);
    console.log('✓ PASS: Access-Control-Allow-Methods:', corsMethods);
    console.log('✓ PASS: Access-Control-Allow-Headers:', corsHeaders);
  }
})
.catch(error => {
  console.error('❌ Network error:', error);
});

// ============================================================================
// WHAT YOUR WORKER CODE MUST LOOK LIKE
// ============================================================================

// COPY THIS EXACT CODE TO YOUR WORKER:

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // =============================================================
  // CRITICAL: This OPTIONS handler MUST be here!
  // =============================================================
  if (request.method === 'OPTIONS') {
    // Log for debugging
    console.log('Received OPTIONS request - returning CORS headers');

    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-CX-Frontend-Signature, X-CX-Request-ID, X-CX-Timestamp, X-CX-Origin, X-Edge-Node, Cache-Control',
        'Access-Control-Max-Age': '86400',
      }
    })
  }

  // =============================================================
  // POST handler
  // =============================================================
  if (request.method === 'POST') {
    console.log('Received POST request');

    try {
      const formData = await request.formData()
      const email = formData.get('email')
      const turnstileToken = formData.get('cf-turnstile-response')

      console.log('Email hash:', email);
      console.log('Turnstile token:', turnstileToken ? 'present' : 'missing');

      const leadId = crypto.randomUUID()
      console.log('Generated lead ID:', leadId);

      // Store in KV
      const leadData = {
        email: email,
        timestamp: new Date().toISOString(),
        id: leadId
      }

      // TODO: Uncomment when KV is properly configured
      // await LEADS_KV.put(leadId, JSON.stringify(leadData))
      console.log('Would store in KV:', leadData)

      return new Response(JSON.stringify({
        success: true,
        id: leadId
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-CX-Frontend-Signature, X-CX-Request-ID, X-CX-Timestamp, X-CX-Origin, X-Edge-Node, Cache-Control',
        }
      })

    } catch (error) {
      console.error('Error in POST handler:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }
  }

  console.log('Unhandled method:', request.method);
  return new Response('Method not allowed', { status: 405 })
}

// ============================================================================
// HOW TO DEPLOY:
// ============================================================================
//
// 1. Save the code above as worker.js
// 2. Deploy: wrangler deploy
// 3. Check Worker logs: wrangler tail
// 4. Test with the fetch code above
// 5. You should see: "Received OPTIONS request - returning CORS headers"
//
// ============================================================================
// COMMON MISTAKES:
// ============================================================================
//
// ❌ WRONG: Not checking for OPTIONS before POST
// ❌ WRONG: Returning 200 instead of 204 for OPTIONS
// ❌ WRONG: Forgetting Access-Control-Allow-Headers
// ❌ WRONG: Not having OPTIONS handler at all
//
// ✅ CORRECT: Check OPTIONS first, return 204 with all CORS headers
// ✅ CORRECT: Then check POST, return 200 with data + CORS headers
//
// ============================================================================
