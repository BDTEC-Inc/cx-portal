/**
 * AI Compute Exchange - Configuration
 *
 * Minimal configuration for production deployment
 */

window.CX_CONFIG = {
    // Cloudflare Turnstile Site Key (already set in index.html, this is for reference)
    turnstileSiteKey: '0x4AAAAAACNkgGWXXZi6sAmT',

    // Debug mode (set to false in production)
    debug: true
};

// Log configuration on load
if (window.CX_CONFIG.debug) {
    console.log('AI Compute Exchange Config loaded');
}
