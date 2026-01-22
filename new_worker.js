export default {
  async fetch(request, env) {
    // Handle OPTIONS first
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-CX-Frontend-Signature, X-CX-Request-ID, X-CX-Timestamp, X-CX-Origin, X-Edge-Node, Cache-Control',
        }
      })
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { 
        status: 405,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const formData = await request.formData();
    const email = formData.get("email");
    const turnstileToken = formData.get("cf-turnstile-response");

    // Debug log
    console.log('Turnstile token:', turnstileToken ? 'present' : 'MISSING');

    // 1. Verify Turnstile
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET,
        response: turnstileToken
      }),
      headers: {
        'content-type': 'application/json'
      }
    });

    const verification = await verifyResponse.json();
    console.log('Turnstile verification:', verification);

    if (!verification.success) {
      console.error('Turnstile verification failed:', verification);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Turnstile verification failed',
        details: verification 
      }), {
        status: 403,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*" 
        }
      });
    }

    // 2. Save to KV
    const id = crypto.randomUUID();
    await env.WAITLIST_STORAGE.put(`lead:${email}`, JSON.stringify({
      email,
      timestamp: new Date().toISOString(),
      id: id
    }));

    console.log('✓ Lead saved:', id);

    return new Response(JSON.stringify({ success: true, id }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};

