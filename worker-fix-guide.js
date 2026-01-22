// ============================================================================
// CRITICAL: YOUR WORKER MUST HANDLE OPTIONS REQUESTS
// ============================================================================
//
// The browser sends an OPTIONS request BEFORE the POST request.
// If your Worker doesn't handle it, the POST never happens.
//
// Copy this ENTIRE structure to your Worker:
// ============================================================================

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // ========================================================================
  // STEP 1: Handle CORS preflight (OPTIONS) - THIS IS REQUIRED!
  // ========================================================================
  if (request.method === 'OPTIONS') {
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

  // ========================================================================
  // STEP 2: Handle POST requests
  // ========================================================================
  if (request.method === 'POST') {
    try {
      const formData = await request.formData()
      const email = formData.get('email')
      const turnstileToken = formData.get('cf-turnstile-response')

      // Generate UUID for this lead
      const leadId = crypto.randomUUID()

      // TODO: Store in KV
      // await LEADS_KV.put(leadId, JSON.stringify({ email, timestamp: Date.now() }))

      // ====================================================================
      // STEP 3: Return response WITH CORS HEADERS
      // ====================================================================
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

  return new Response('Method not allowed', { status: 405 })
}

// ============================================================================
// WHAT YOU'RE DOING WRONG RIGHT NOW:
// ============================================================================
//
// ❌ YOUR CODE (probably):
//    if (request.method === 'POST') {
//      // handle POST
//    }
//    // Missing OPTIONS handler!
//
// ✅ CORRECT CODE:
//    if (request.method === 'OPTIONS') {
//      // Handle preflight FIRST
//    }
//    if (request.method === 'POST') {
//      // Then handle POST
//    }
//
// ============================================================================
// DEPLOY STEPS:
// ============================================================================
//
// 1. Copy the code above to your Worker
// 2. Deploy: wrangler deploy
// 3. Test with curl:
//    curl -X OPTIONS https://compute-exchange-lead-capture.cx-portal.workers.dev/ \
//      -H "Access-Control-Request-Method: POST" \
//      -H "Origin: http://localhost:3000"
//
// Expected response: HTTP 204 with CORS headers
//
// 4. Then test index.html submission
//
// ============================================================================
