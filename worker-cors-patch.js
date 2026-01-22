// ============================================================================
// QUICK CORS FIX - ADD TO YOUR EXISTING WORKER
// ============================================================================

// OPTION 1: Update your existing return statement
// -----------------------------------------------
// FIND this line in your Worker:
return new Response(responseText, {
  headers: { 'content-type': 'application/x-www-form-urlencoded' }
})

// REPLACE with:
return new Response(responseText, {
  headers: {
    'content-type': 'application/json',  // Changed from application/x-www-form-urlencoded
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-CX-Frontend-Signature, X-CX-Request-ID, X-CX-Timestamp, X-CX-Origin, X-Edge-Node, Cache-Control',
  }
})

// ============================================================================
// OPTION 2: Add OPTIONS handler at the top of your Worker
// ============================================================================
// ADD this before your main request handler:

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

// ============================================================================
// MINIMAL CHANGE - IF YOU ONLY WANT TO FIX THE HEADERS
// ============================================================================

// Current (broken):
headers: { 'content-type': 'application/x-www-form-urlencoded' }

// Fixed (working):
headers: {
  'content-type': 'application/json',  // Must return JSON, not form-encoded
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-CX-Frontend-Signature, X-CX-Request-ID, X-CX-Timestamp, X-CX-Origin, X-Edge-Node, Cache-Control',
}

// ============================================================================
// IMPORTANT NOTES
// ============================================================================
//
// 1. Your Worker MUST return JSON, not form-encoded response
//    Change: 'content-type': 'application/x-www-form-urlencoded'
//    To:     'content-type': 'application/json'
//
// 2. The frontend expects: { success: true, id: "uuid-here" }
//
// 3. You MUST handle OPTIONS requests for CORS preflight
//
// 4. Response format example:
//    new Response(JSON.stringify({ success: true, id: crypto.randomUUID() }), {
//      headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*', ... }
//    })
//
// ============================================================================
