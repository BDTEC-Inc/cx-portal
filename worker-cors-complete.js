// ============================================================================
// CLOUDFLARE WORKER - COMPLETE IMPLEMENTATION WITH CORS
// ============================================================================

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleOptions()
  }

  // Handle POST requests
  if (request.method === 'POST') {
    return handlePost(request)
  }

  // Reject other methods
  return new Response('Method not allowed', { status: 405 })
}

// ============================================================================
// CORS PREFLIGHT HANDLER
// ============================================================================
function handleOptions() {
  return new Response(null, {
    status: 204, // No Content
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-CX-Frontend-Signature, X-CX-Request-ID, X-CX-Timestamp, X-CX-Origin, X-Edge-Node, Cache-Control',
      'Access-Control-Max-Age': '86400', // 24 hours
    }
  })
}

// ============================================================================
// POST REQUEST HANDLER
// ============================================================================
async function handlePost(request) {
  try {
    // Parse form data
    const formData = await request.formData()
    const email = formData.get('email')
    const turnstileToken = formData.get('cf-turnstile-response')

    // Validate required fields
    if (!turnstileToken) {
      return jsonResponse({ success: false, error: 'Missing Turnstile token' }, 400)
    }

    // Verify Turnstile token with Cloudflare
    const turnstileVerify = await verifyTurnstile(turnstileToken)

    if (!turnstileVerify.success) {
      return jsonResponse({ success: false, error: 'Invalid Turnstile token' }, 403)
    }

    // Store lead in KV
    const leadId = crypto.randomUUID()
    const leadData = {
      email,
      timestamp: new Date().toISOString(),
      id: leadId
    }

    // Store in KV (assuming you have LEADS_KV bound)
    // await LEADS_KV.put(leadId, JSON.stringify(leadData))

    // For now, just log it
    console.log('Lead stored:', JSON.stringify(leadData))

    // Return success with CORS headers
    return jsonResponse({
      success: true,
      id: leadId
    }, 200)

  } catch (error) {
    console.error('Error processing request:', error)
    return jsonResponse({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
}

// ============================================================================
// TURNSTILE VERIFICATION
// ============================================================================
async function verifyTurnstile(token) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: 'YOUR_TURNSTILE_SECRET_KEY_HERE', // Replace with your actual secret
      response: token
    })
  })

  return await response.json()
}

// ============================================================================
// JSON RESPONSE WITH CORS HEADERS
// ============================================================================
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-CX-Frontend-Signature, X-CX-Request-ID, X-CX-Timestamp, X-CX-Origin, X-Edge-Node, Cache-Control',
    }
  })
}

// ============================================================================
// WRANGLER.TOML CONFIGURATION REQUIRED
// ============================================================================
/*
# wrangler.toml

name = "compute-exchange-lead-capture"
main = "worker.js"
compatibility_date = "2024-01-01"

# KV Namespace (optional - for storing leads)
[[kv_namespaces]]
binding = "LEADS_KV"
id = "your_kv_namespace_id_here"

# Environment variables (optional)
[vars]
TURNSTILE_SECRET_KEY = "your_secret_key_here"
*/
