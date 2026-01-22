export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-CX-Frontend-Signature, X-CX-Request-ID, X-CX-Timestamp, X-CX-Origin, X-Edge-Node, Cache-Control'
        }
      })
    }
    if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
    const formData = await request.formData();
    const email = formData.get("email");
    const turnstileToken = formData.get("cf-turnstile-response");

   

    


    // 1. Verify Turnstile (Security check)
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: `secret=${env.TURNSTILE_SECRET}&response=${turnstileToken}`,
      // headers: { 'content-type': 'application/x-www-form-urlencoded' }

      headers: {
        'content-type': 'application/json',  // Must be JSON, not form-encoded
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-CX-Frontend-Signature, X-CX-Request-ID, X-CX-Timestamp, X-CX-Origin, X-Edge-Node, Cache-Control'
      }
      
    });
    const verification = await verifyResponse.json();
    if (!verification.success) return new Response("Bot detected", { status: 403 });

    // 2. Save to KV (The Database)
    const id = crypto.randomUUID();
    await env.WAITLIST_STORAGE.put(`lead:${email}`, JSON.stringify({
      email,
      timestamp: new Date().toISOString(),
      id: id
    }));

    return new Response(JSON.stringify({ success: true, id }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
};
