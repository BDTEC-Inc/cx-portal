export default {
  async fetch(request, env) {
    // Handle CORS preflight
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
    const company = formData.get("company");
    const turnstileToken = formData.get("cf-turnstile-response");

    console.log('New lead:', { email, company });

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
    if (!verification.success) {
      console.error('Turnstile verification failed:', verification);
      return new Response(JSON.stringify({
        success: false,
        error: 'Turnstile verification failed'
      }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // 2. Save to KV - Storing CLEAR email for easy communication
    const id = crypto.randomUUID();
    await env.WAITLIST_STORAGE.put(id, JSON.stringify({
      email,  // Clear text email - you can email them directly!
      company,
      timestamp: new Date().toISOString(),
      id
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
