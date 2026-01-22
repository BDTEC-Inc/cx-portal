// ============================================================================
// CLOUDFLARE WORKER - CORS FIX REQUIRED
// ============================================================================
//
// Your Worker is missing CORS headers. Update your Worker code to include:
//
// addEventListener('fetch', event => {
//   event.respondWith(handleRequest(event.request))
// })
//
// async function handleRequest(request) {
//   // Handle CORS preflight
//   if (request.method === 'OPTIONS') {
//     return handleCORS()
//   }
//
//   // Handle POST requests
//   if (request.method === 'POST') {
//     const formData = await request.formData()
//     const email = formData.get('email')
//     const turnstileToken = formData.get('cf-turnstile-response')
//
//     // Validate Turnstile token
//     const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         secret: 'YOUR_SECRET_KEY_HERE',  // Replace with your secret
//         response: turnstileToken
//       })
//     })
//
//     const turnstileResult = await turnstileResponse.json()
//
//     if (!turnstileResult.success) {
//       return new Response('Invalid Turnstile token', { status: 400 })
//     }
//
//     // Store lead in KV
//     const leadId = crypto.randomUUID()
//     await LEADS_KV.put(leadId, JSON.stringify({
//       email,
//       timestamp: Date.now()
//     }))
//
//     // Return success with CORS headers
//     return handleCORS({
//       success: true,
//       id: leadId
//     })
//   }
//
//   return new Response('Method not allowed', { status: 405 })
// }
//
// function handleCORS(responseData = null) {
//   const headers = {
//     'Access-Control-Allow-Origin': '*',  // Allow all origins during dev
//     'Access-Control-Allow-Methods': 'POST, OPTIONS',
//     'Access-Control-Allow-Headers': 'Content-Type, X-CX-Frontend-Signature, X-CX-Request-ID',
//   }
//
//   if (responseData) {
//     headers['Content-Type'] = 'application/json'
//     return new Response(JSON.stringify(responseData), { headers })
//   }
//
//   return new Response(null, { headers })
// }
//
// ============================================================================
// REQUIRED: Bind KV store in wrangler.toml:
//
// [[kv_namespaces]]
// binding = "LEADS_KV"
// id = "your_kv_namespace_id"
//
// ============================================================================
