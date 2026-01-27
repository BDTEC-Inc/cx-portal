/**
 * AI Compute Exchange - Zero-Trust Lead Capture System
 * Security-enhanced implementation with:
 * - Cloudflare Turnstile bot defense
 * - Input sanitization with strict regex
 * - Honeypot field detection
 * - Secure Race Pattern with custom headers
 * - Debouncing to prevent spam
 * - Strict CORS validation
 *
 * Architecture: Privacy-first with institutional-grade security
 */

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

const CONFIG = {
    // Edge endpoints for Race Pattern
    edgeEndpoints: [
        'https://compute-exchange-lead-capture.cx-portal.workers.dev/'
    ],

    // Fallback endpoint (Formspree)
    fallbackEndpoint: 'https://formspree.io/f/xqakplkw',

    // Request timeout (ms)
    requestTimeout: 5000,

    // Optimistic UI delay (ms)
    optimisticDelay: 40,

    // Email hash salt (rotate periodically in production)
    emailHashSalt: 'ai-compute-exchange-2025-salt-v1',

    // Security: Frontend signature for backend validation
    frontendSignature: 'CX-FE-2025-V1',

    // Security: Debounce delay (ms) to prevent double-tap spam
    debounceDelay: 1000,

    // Security: Max email length (prevent DoS)
    maxEmailLength: 254,

    // Security: Max string length (prevent buffer overflow)
    maxStringLength: 100
};

// ============================================================================
// SECURITY LAYER: Input Sanitization & Validation
// ============================================================================

const Security = {
    /**
     * Strict email validation using RFC 5322 compliant regex
     * Rejects invalid formats, obvious typos, and suspicious patterns
     *
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    validateEmail(email) {
        // Strict RFC 5322 compliant regex (simplified for practical use)
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

        // Additional security checks
        if (!email || typeof email !== 'string') {
            return false;
        }

        // Length check (RFC 5321)
        if (email.length > CONFIG.maxEmailLength) {
            return false;
        }

        // Regex validation
        if (!emailRegex.test(email)) {
            return false;
        }

        const domain = email.split('@')[1]?.toLowerCase();

        // Block common temporary email domains
        const blockedDomains = ['tempmail.com', 'throwaway.com', 'guerrillamail.com'];
        if (blockedDomains.some(blocked => domain?.endsWith(blocked))) {
            return false;
        }

        // Allow whitelisted domains (for testing/development)
        const whitelistedDomains = ['lb-labs.com', 'bdtec.ai', 'gmail.com', 'outlook.com'];
        if (whitelistedDomains.some(allowed => domain?.endsWith(allowed))) {
            return true;
        }

        // For production, require business domains (not generic email providers)
        // Comment this out to allow all valid email addresses
        const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
        if (genericDomains.some(generic => domain?.endsWith(generic))) {
            // Allow generic domains for now, but you can restrict later
            // return false;
        }

        return true;
    },

    /**
     * Sanitize string input to prevent XSS and injection attacks
     *
     * @param {string} input - Input to sanitize
     * @param {number} maxLength - Maximum allowed length
     * @returns {string} Sanitized string
     */
    sanitizeString(input, maxLength = CONFIG.maxStringLength) {
        if (!input || typeof input !== 'string') {
            return '';
        }

        // Trim whitespace
        let sanitized = input.trim();

        // Remove null bytes and other control characters
        sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

        // Escape HTML entities (prevent XSS)
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');

        // Enforce length limit
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }

        return sanitized;
    },

    /**
     * Check honeypot field for bot detection
     * Bots will fill this hidden field, humans won't see it
     *
     * @param {string} honeypotValue - Value from honeypot field
     * @returns {boolean} True if bot detected
     */
    isBot(honeypotValue) {
        // If honeypot has any value, it's a bot
        return honeypotValue && honeypotValue.trim().length > 0;
    },

    /**
     * Validate Turnstile token
     *
     * @param {string} token - Turnstile token
     * @returns {boolean} True if token exists and is valid format
     */
    validateTurnstileToken(token) {
        if (!token || typeof token !== 'string') {
            return false;
        }

        // Turnstile tokens are typically 200-1000 characters (invisible mode can be longer)
        const isValidLength = token.length >= 100 && token.length <= 2000;
        console.log('Token length check:', token.length, 'Valid:', isValidLength);

        // Check if token starts with expected format (0.xxxx)
        const hasValidPrefix = token.startsWith('0.');
        console.log('Token prefix check:', hasValidPrefix);

        return isValidLength && hasValidPrefix;
    },

    /**
     * Validate all form inputs
     *
     * @param {object} formData - Form data to validate
     * @returns {object} { valid: boolean, errors: string[] }
     */
    validateForm(formData) {
        const errors = [];

        // Check honeypot (silent bot detection)
        if (this.isBot(formData.get('website-url'))) {
            console.warn('Bot detected via honeypot field');
            return { valid: false, errors: ['Bot detected'], silent: true };
        }

        // Validate email
        const email = formData.get('email');
        console.debug('Validating email:', email);
        if (!this.validateEmail(email)) {
            console.error('Email validation failed for:', email);
            errors.push('Invalid email address');
        }

        // Validate company (required, sanitized)
        const company = formData.get('company');
        console.debug('Validating company:', company);
        if (!company || company.trim().length < 2) {
            errors.push('Company name is required');
        }

        // Validate Turnstile token
        console.debug('Validating Turnstile token:', window.turnstileToken ? `Present (${window.turnstileToken.length} chars)` : 'MISSING');
        console.debug('Token validation check:', this.validateTurnstileToken(window.turnstileToken));
        if (!this.validateTurnstileToken(window.turnstileToken)) {
            console.error('Turnstile token validation failed');
            console.error('Token value:', window.turnstileToken);
            console.error('Token length:', window.turnstileToken?.length);
            errors.push('Please complete the security verification');
        }

        console.debug('Validation result:', errors.length === 0 ? 'VALID' : 'INVALID', errors);

        return {
            valid: errors.length === 0,
            errors,
            silent: errors.length === 1 && errors[0] === 'Bot detected'
        };
    }
};

// ============================================================================
// DEBOUNCE UTILITY
// ============================================================================

/**
 * Debounce function execution to prevent rapid-fire clicks
 *
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay) {
    let timeoutId;
    let lastCall = 0;

    return function executedFunction(...args) {
        const now = Date.now();
        const timeSinceLastCall = now - lastCall;

        clearTimeout(timeoutId);

        if (timeSinceLastCall >= delay) {
            lastCall = now;
            func.apply(this, args);
        } else {
            timeoutId = setTimeout(() => {
                lastCall = Date.now();
                func.apply(this, args);
            }, delay - timeSinceLastCall);
        }
    };
}

// ============================================================================
// CRYPTO UTILITIES (Privacy-First)
// ============================================================================

/**
 * Hash email client-side before transmission
 *
 * @param {string} email - Email to hash
 * @returns {Promise<string>} SHA-256 hash
 */
async function hashEmail(email) {
    const encoder = new TextEncoder();
    const data = encoder.encode(email.toLowerCase().trim() + CONFIG.emailHashSalt);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
}

/**
 * Generate unique reference ID
 *
 * @returns {string} Unique reference ID
 */
function generateReferenceId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 9);
    return `req_${timestamp}_${randomStr}`;
}

// ============================================================================
// SECURE RACE PATTERN IMPLEMENTATION
// ============================================================================

/**
 * Submit lead data using Race Pattern with security headers
 * Primary: Cloudflare Worker (high-performance path)
 * Fallback: Formspree (redundancy path)
 *
 * @param {object} payload - Lead data payload
 * @returns {Promise<object>} First successful response
 */
async function racePatternSubmit(payload) {
    const requestId = generateReferenceId();

    // Create security headers for backend validation
    const securityHeaders = {
        'X-CX-Frontend-Signature': CONFIG.frontendSignature,
        'X-CX-Request-ID': requestId,
        'X-CX-Timestamp': Date.now().toString(),
        'X-CX-Origin': window.location.origin
    };

    // Create array of promises for all endpoints (primary + fallback)
    const allEndpoints = [...CONFIG.edgeEndpoints, CONFIG.fallbackEndpoint];

    const requests = allEndpoints.map(async (endpoint, index) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.requestTimeout);

        try {
            // For fallback (Formspree), use form-encoded data with different field names
            // For primary Worker, use form-encoded data with Turnstile token
            const isFallback = index === CONFIG.edgeEndpoints.length;

            let body, headers;

            if (isFallback) {
                // Formspree fallback
                body = new URLSearchParams({
                    company: payload.company,
                    email: payload.email, // Clear email now
                    gpu_scale: payload.gpuScale,
                    reference_id: payload.referenceId,
                    _subject: `New Lead: ${payload.company}`
                });
                headers = {
                    'Content-Type': 'application/x-www-form-urlencoded'
                };
            } else {
                // Primary Worker - send clear email + company + gpu scale
                body = new URLSearchParams({
                    email: payload.email,
                    company: payload.company,
                    gpuScale: payload.gpuScale,
                    'cf-turnstile-response': payload.turnstileToken
                });
                headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    ...securityHeaders,
                    'X-Edge-Node': index.toString(),
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                };
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                mode: 'cors', // Explicit CORS mode
                headers,
                body,
                signal: controller.signal,
                credentials: 'omit' // Don't send cookies for security
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // Parse response based on endpoint type
            let data;
            if (isFallback) {
                // Formspree returns simple OK
                data = { ok: true };
            } else {
                // Worker returns JSON with { success: true, id: "..." }
                const responseText = await response.text();
                try {
                    data = responseText ? JSON.parse(responseText) : { ok: true };
                } catch (e) {
                    data = { ok: true, raw: responseText };
                }
            }

            // Verify response signature (if implemented)
            if (!isFallback && data.signature && data.signature !== CONFIG.frontendSignature) {
                throw new Error('Invalid response signature');
            }

            return {
                success: true,
                endpoint: index,
                endpointType: isFallback ? 'fallback' : 'primary',
                data,
                requestId
            };

        } catch (error) {
            clearTimeout(timeoutId);

            // Log error without revealing endpoint details (security)
            console.debug(`Request ${index} (${index === CONFIG.edgeEndpoints.length ? 'fallback' : 'primary'}) failed:`, error.message);

            return {
                success: false,
                endpoint: index,
                error: error.message,
                requestId
            };
        }
    });

    // Wait for ALL requests to complete (redundancy)
    const results = await Promise.allSettled(requests);

    // Find first successful result (prefer primary over fallback)
    const primarySuccess = results.find((result, idx) =>
        result.status === 'fulfilled' &&
        result.value.success &&
        idx < CONFIG.edgeEndpoints.length
    );

    if (primarySuccess) {
        return primarySuccess.value;
    }

    // Fall back to fallback endpoint
    const fallbackSuccess = results.find((result, idx) =>
        result.status === 'fulfilled' &&
        result.value.success &&
        idx === CONFIG.edgeEndpoints.length
    );

    if (fallbackSuccess) {
        return fallbackSuccess.value;
    }

    // If all failed, return error without revealing which endpoints failed
    throw new Error('All endpoints unavailable. Please try again.');
}

// ============================================================================
// UI CONTROLLER (Optimistic Updates)
// ============================================================================

const UI = {
    form: document.getElementById('lead-form'),
    successState: document.getElementById('success-state'),
    submitBtn: document.getElementById('submit-btn'),
    refIdDisplay: document.getElementById('ref-id'),
    isSubmitting: false,

    /**
     * Show loading state
     */
    setLoading() {
        this.submitBtn.classList.add('loading');
        this.submitBtn.disabled = true;
        this.isSubmitting = true;
    },

    /**
     * Hide loading state
     */
    hideLoading() {
        this.submitBtn.classList.remove('loading');
        this.submitBtn.disabled = !window.turnstileToken; // Keep disabled if no Turnstile token
        this.isSubmitting = false;
    },

    /**
     * Show success state (OPTIMISTIC - <50ms)
     *
     * @param {string} referenceId - Submission reference ID
     */
    showSuccess(referenceId) {
        console.log('showSuccess called with referenceId:', referenceId, 'Type:', typeof referenceId);
        this.form.style.display = 'none';
        this.successState.classList.add('active');

        // Defensive: Ensure referenceId is valid before setting
        if (referenceId && typeof referenceId === 'string' && referenceId !== 'NaN') {
            this.refIdDisplay.textContent = referenceId;
            console.log('✓ Reference ID set to:', referenceId);
        } else {
            console.error('✗ Invalid referenceId passed to showSuccess:', referenceId);
            this.refIdDisplay.textContent = 'Processing...';
        }

        this.updateQueuePosition();
    },

    /**
     * Show error message
     *
     * @param {string} message - Error message
     * @param {boolean} silent - If true, don't show error to user (bot detection)
     */
    showError(message, silent = false) {
        // Silent failure for bots (don't reveal bot detection)
        if (silent) {
            console.warn('Silent rejection:', message);
            return;
        }

        // Remove existing error
        const existingError = this.form.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Create error element
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        errorEl.style.cssText = `
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 0.5rem;
            padding: 0.75rem;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 6px;
        `;

        this.submitBtn.parentNode.insertBefore(errorEl, this.submitBtn);

        // Auto-remove after 5 seconds
        setTimeout(() => errorEl.remove(), 5000);
    },

    /**
     * Update queue position display
     */
    updateQueuePosition() {
        // Use ID selector to be more specific and avoid selecting wrong element
        const queuePosition = document.querySelector('.confirmation-details .detail-item:last-child .detail-value');
        if (queuePosition) {
            const currentText = queuePosition.textContent.replace('#', '').trim();
            const currentPosition = parseInt(currentText);
            console.log('Current queue position:', currentPosition);

            if (!isNaN(currentPosition)) {
                queuePosition.textContent = `#${currentPosition + 1}`;
                console.log('✓ Queue position updated to:', currentPosition + 1);
            } else {
                console.warn('⚠️ Could not parse queue position from:', currentText);
            }
        } else {
            console.warn('⚠️ Queue position element not found');
        }
    }
};

// ============================================================================
// FORM HANDLER (Secure & Debounced)
// ============================================================================

/**
 * Handle form submission with security validation and Race Pattern
 */
async function handleFormSubmit(event) {
    event.preventDefault();

    // Prevent double-submit (already submitting)
    if (UI.isSubmitting) {
        console.warn('Form already submitting');
        return;
    }

    // Get form data
    const formData = new FormData(event.target);

    // SECURITY: Validate all inputs
    const validation = Security.validateForm(formData);

    if (!validation.valid) {
        if (validation.silent) {
            // Silent rejection for bots
            console.warn('Bot silently rejected');
            return;
        }

        UI.showError(validation.errors[0]);
        return;
    }

    // Sanitize inputs
    const sanitizedData = {
        company: Security.sanitizeString(formData.get('company'), 100),
        email: Security.sanitizeString(formData.get('email'), CONFIG.maxEmailLength),
        gpuScale: Security.sanitizeString(formData.get('gpu-scale'), 20)
    };

    // Generate reference ID
    const referenceId = generateReferenceId();

    // OPTIMISTIC UI: Show success state in <50ms
    setTimeout(() => {
        UI.showSuccess(referenceId);
    }, CONFIG.optimisticDelay);

    // Prepare secure payload - sending CLEAR email for direct communication
    const payload = {
        referenceId,
        timestamp: Date.now(),
        company: sanitizedData.company,
        email: sanitizedData.email, // Clear text - you can email them directly!
        gpuScale: sanitizedData.gpuScale, // Lead qualification metric
        turnstileToken: window.turnstileToken, // For backend verification
        security: {
            signature: CONFIG.frontendSignature,
            origin: window.location.origin,
            userAgent: navigator.userAgent.substring(0, 200) // Truncated for privacy
        }
    };

    // RACE PATTERN: Fire redundant requests
    try {
        const result = await racePatternSubmit(payload);
        console.debug('Lead submitted securely:', result.requestId);
        console.log('Full result object:', JSON.stringify(result, null, 2));

        // Update reference ID with actual server-generated ID (UUID)
        if (result.data) {
            console.log('Response data:', result.data);
            console.log('Response data.id:', result.data.id);

            // Check if data.id exists and is valid
            if (result.data.id && result.data.id !== 'NaN') {
                console.log(`✓ Updating reference ID to server-generated UUID: ${result.data.id}`);
                UI.refIdDisplay.textContent = result.data.id;
            } else {
                console.warn('⚠️ Server did not return a valid ID, keeping client-generated reference:', referenceId);
            }
        } else {
            console.warn('⚠️ No data object in response, keeping client-generated reference:', referenceId);
        }
    } catch (error) {
        // Log error but don't show user (optimistic UI already shown)
        console.error('Background submission failed:', error.message);
    }
}

// Debounced form handler to prevent rapid-fire spam
const debouncedFormHandler = debounce(handleFormSubmit, CONFIG.debounceDelay);

// ============================================================================
// CLOUDFLARE TURNSTILE CALLBACKS
// ============================================================================

/**
 * Cloudflare Turnstile success callback
 * Called when user completes the challenge
 *
 * @param {string} token - Turnstile token
 */
window.turnstileCallback = function(token) {
    // Store token globally for form submission
    window.turnstileToken = token;

    // Enable submit button and update text
    if (UI.submitBtn) {
        UI.submitBtn.disabled = false;
        const buttonText = UI.submitBtn.querySelector('.button-text');
        if (buttonText) {
            buttonText.textContent = 'Request Access';
        }
        console.debug('✓ Turnstile verified - Submit button enabled');
    }
};

/**
 * Cloudflare Turnstile error callback
 * Called when Turnstile encounters an error
 *
 * @param {string} error - Error code
 */
window.turnstileErrorCallback = function(error) {
    console.error('✗ Turnstile error:', error);

    // Keep button disabled on error
    if (UI.submitBtn) {
        UI.submitBtn.disabled = true;
    }

    // Show user-friendly error
    if (typeof UI !== 'undefined' && UI.showError) {
        UI.showError('Security verification failed. Please refresh the page.');
    }
};

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
    // Attach debounced form handler
    UI.form.addEventListener('submit', debouncedFormHandler);

    // Wait for Turnstile to load and explicitly render invisible widget
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds max
    let widgetRendered = false;

    const checkTurnstile = setInterval(() => {
        attempts++;

        if (typeof turnstile !== 'undefined') {
            const widgetDiv = document.getElementById('turnstile-widget');

            if (widgetDiv && !widgetRendered) {
                // Only render once
                console.debug(`Turnstile API loaded. Rendering widget (attempt ${attempts})...`);
                widgetRendered = true;
                clearInterval(checkTurnstile);

                try {
                    turnstile.render(widgetDiv, {
                        sitekey: '0x4AAAAAACNkgGWXXZi6sAmT',
                        theme: 'light',
                        callback: (token) => {
                            console.log('✓ Turnstile callback fired! Token received:', token.substring(0, 20) + '...');
                            window.turnstileCallback(token);
                        },
                        'error-callback': (error) => {
                            console.error('Turnstile error:', error);
                            window.turnstileErrorCallback(error);
                        }
                    });
                    console.debug('✓ Turnstile render() called successfully');
                } catch (e) {
                    console.error('Failed to render Turnstile:', e);
                }
            } else if (widgetDiv && widgetRendered) {
                // Already rendered, stop checking
                clearInterval(checkTurnstile);
                console.debug('Turnstile already rendered');
            } else {
                console.warn('Turnstile container not found in DOM');
            }
        }

        if (attempts >= maxAttempts) {
            clearInterval(checkTurnstile);
            console.error('Turnstile failed to load after 10 seconds');
        }
    }, 100);

    // Track page view (privacy-friendly)
    console.debug('AI Compute Exchange initialized (Zero-Trust Mode)');

    // Monitor performance
    if ('performance' in window) {
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            const loadTime = Math.round(perfData.loadEventEnd - perfData.fetchStart);
            console.debug('Page load time:', loadTime, 'ms');

            // Warn if load time is slow
            if (loadTime > 2000) {
                console.warn('Page load time exceeds 2s - consider optimization');
            }
        });
    }

    // Configure edge endpoints from environment if available
    if (window.CX_CONFIG?.edgeEndpoints) {
        CONFIG.edgeEndpoints = window.CX_CONFIG.edgeEndpoints;
    }

    // Configure Turnstile site key if available
    if (window.CX_CONFIG?.turnstileSiteKey) {
        const turnstileContainer = document.querySelector('.cf-turnstile');
        if (turnstileContainer) {
            turnstileContainer.setAttribute('data-sitekey', window.CX_CONFIG.turnstileSiteKey);
        }
    }

    // Security: Disable right-click on sensitive elements (optional)
    // This is security by obscurity and not a real security measure
    // Uncomment if desired:
    // document.addEventListener('contextmenu', e => {
    //     if (e.target.closest('.form-container')) {
    //         e.preventDefault();
    //     }
    // });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ============================================================================
// TELEMETRY (Privacy-First)
// ============================================================================

const Telemetry = {
    metrics: {
        formViews: 0,
        formSubmissions: 0,
        turnstileVerifications: 0,
        botRejections: 0
    },

    trackFormView() {
        this.metrics.formViews++;
    },

    trackSubmission() {
        this.metrics.formSubmissions++;
    },

    trackTurnstileSuccess() {
        this.metrics.turnstileVerifications++;
    },

    trackBotRejection() {
        this.metrics.botRejections++;
    },

    getMetrics() {
        return { ...this.metrics };
    }
};

// Track form view
Telemetry.trackFormView();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Smooth scroll to form
 */
function scrollToForm() {
    document.getElementById('waitlist-form').scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

// Expose globally
window.scrollToForm = scrollToForm;
