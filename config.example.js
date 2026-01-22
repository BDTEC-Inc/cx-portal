/**
 * AI Compute Exchange - Configuration
 *
 * Configure your edge endpoints and settings here.
 * Copy this file to config.js and update with your values.
 */

window.CX_CONFIG = {
    /**
     * Edge Endpoints for Race Pattern
     *
     * Configure at least 2 edge endpoints for redundancy.
     * These should be hosted on different providers for maximum reliability.
     *
     * Examples:
     * - Vercel Edge Functions
     * - Cloudflare Workers
     * - AWS Lambda@Edge
     * - Fastly Compute@Edge
     */
    edgeEndpoints: [
        // Primary endpoint (e.g., Vercel)
        'https://your-project.vercel.app/api/lead',

        // Secondary endpoint (e.g., Cloudflare Workers)
        'https://your-worker.your-subdomain.workers.dev/lead',

        // Optional: Tertiary endpoint (e.g., AWS Lambda@Edge)
        // 'https://your-lambda-id.lambda-url.us-east-1.on.aws/lead'
    ],

    /**
     * Request Timeout (milliseconds)
     *
     * How long to wait for each edge endpoint before considering it failed.
     * Default: 5000ms (5 seconds)
     */
    requestTimeout: 5000,

    /**
     * Optimistic UI Delay (milliseconds)
     *
     * How quickly to show success state after form submission.
     * This should be <50ms for optimal user experience.
     * Default: 40ms
     */
    optimisticDelay: 40,

    /**
     * Email Hash Salt
     *
     * Salt for client-side email hashing.
     * CHANGE THIS in production and rotate periodically.
     *
     * Generate a random salt:
     * node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     */
    emailHashSalt: 'ai-compute-exchange-2025-salt-v1',

    /**
     * Cloudflare Turnstile Site Key
     *
     * Get your site key from: https://dash.cloudflare.com/sign-up
     *
     * 1. Sign up for Cloudflare
     * 2. Navigate to: Turnstile → Create Site Key
     * 3. Select "Managed" (free) or "Non-interactive" for invisible mode
     * 4. Add your domain (e.g., bdtec.ai, localhost for testing)
     * 5. Copy the Site Key here
     *
     * IMPORTANT: Replace 'YOUR_TURNSTILE_SITE_KEY' with your actual key
     */
    turnstileSiteKey: 'YOUR_TURNSTILE_SITE_KEY',

    /**
     * Debug Mode
     *
     * Enable detailed logging in browser console.
     * Disable in production.
     */
    debug: false,

    /**
     * Analytics (Optional)
     *
     * Privacy-friendly analytics configuration.
     * Never collects personal information.
     */
    analytics: {
        enabled: false,
        // Example: Plausible Analytics
        plausibleDomain: 'ai-compute-exchange.com',
        // Example: Google Analytics 4
        ga4MeasurementId: '' // 'G-XXXXXXXXXX'
    },

    /**
     * Feature Flags
     */
    features: {
        // Show queue position on success state
        showQueuePosition: true,

        // Display technical specifications
        showTechSpecs: true,

        // Enable dark mode toggle (if you implement light theme)
        enableThemeToggle: false
    }
};

// Validate configuration
(function validateConfig() {
    if (window.CX_CONFIG.edgeEndpoints.length < 2) {
        console.warn('⚠️  Warning: Less than 2 edge endpoints configured. Race Pattern may not work properly.');
    }

    if (window.CX_CONFIG.debug) {
        console.log('AI Compute Exchange Config:', window.CX_CONFIG);
    }
})();
