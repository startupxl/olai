/**
 * Olai Notes — Production Server
 *
 * Replaces `serve dist` with an Express server that:
 *  1. Serves the static Vite build (dist/)
 *  2. Handles PayPal subscription webhooks at POST /api/webhooks/paypal
 *
 * Required environment variables:
 *   PORT                        — defaults to 3000
 *   FIREBASE_SERVICE_ACCOUNT    — JSON string of the Firebase service account key
 *   PAYPAL_CLIENT_ID            — PayPal live client ID (server copy, no VITE_ prefix)
 *   PAYPAL_CLIENT_SECRET        — PayPal live client secret
 *   PAYPAL_WEBHOOK_ID           — Webhook ID from PayPal dashboard (see README)
 */

import express    from 'express';
import path       from 'path';
import { fileURLToPath } from 'url';
import https      from 'https';
import admin      from 'firebase-admin';

// Simple in-memory rate limiter (resets on server restart)
function createRateLimiter({ windowMs, max }) {
  const hits = new Map();
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const entry = hits.get(key) || { count: 0, start: now };
    if (now - entry.start > windowMs) { entry.count = 0; entry.start = now; }
    entry.count++;
    hits.set(key, entry);
    if (entry.count > max) return res.status(429).json({ error: 'Too many requests' });
    next();
  };
}
const webhookLimiter        = createRateLimiter({ windowMs: 60_000, max: 30 });
const verifySubscriptionLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app       = express();
const PORT      = process.env.PORT || 3000;

// ── Firebase Admin ────────────────────────────────────────────────────────────
let db;
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  db = admin.firestore();
  console.log('✓ Firebase Admin connected');
} catch (err) {
  console.warn('⚠️  Firebase Admin not configured — webhook Firestore writes disabled:', err.message);
}

// ── PayPal helpers ────────────────────────────────────────────────────────────
const PAYPAL_BASE        = 'https://api-m.paypal.com';
const PAYPAL_CLIENT_ID   = process.env.PAYPAL_CLIENT_ID     || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_WEBHOOK_ID  = process.env.PAYPAL_WEBHOOK_ID    || '';

async function getPayPalToken() {
  const creds = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  return data.access_token;
}

async function verifyPayPalWebhook(headers, rawBody) {
  if (!PAYPAL_WEBHOOK_ID || !PAYPAL_CLIENT_ID) return true; // skip in dev
  const token = await getPayPalToken();
  const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo:         headers['paypal-auth-algo'],
      cert_url:          headers['paypal-cert-url'],
      transmission_id:   headers['paypal-transmission-id'],
      transmission_sig:  headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id:        PAYPAL_WEBHOOK_ID,
      webhook_event:     JSON.parse(rawBody),
    }),
  });
  const data = await res.json();
  return data.verification_status === 'SUCCESS';
}

// ── Firestore plan helpers ────────────────────────────────────────────────────
async function getProfileBySubscriptionId(subscriptionId) {
  if (!db) return null;
  const snap = await db.collection('profiles')
    .where('paypalSubscriptionId', '==', subscriptionId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function updateProfile(userId, patch) {
  if (!db) return;
  await db.collection('profiles').doc(userId).set(patch, { merge: true });
}

// ── Security headers ──────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  // HSTS — force HTTPS for 1 year (only effective once served over TLS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Disallow embedding in iframes (clickjacking protection)
  res.setHeader('X-Frame-Options', 'DENY');

  // Basic XSS filter for old browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Don't leak referrer to third parties
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict browser features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');

  // Content Security Policy
  // Allowlists: PayPal, AdSense/Google, Firebase, Google Fonts, self
  const csp = [
    "default-src 'self'",
    // Scripts: self, PayPal SDK, AdSense, Firebase, Google APIs
    "script-src 'self' 'unsafe-inline' https://www.paypal.com https://www.paypalobjects.com https://pagead2.googlesyndication.com https://www.googletagservices.com https://apis.google.com https://www.gstatic.com",
    // Styles: self + Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    // Fonts: self + Google Fonts
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
    // Images: self + data URIs + PayPal + Google + AdSense CDNs
    "img-src 'self' data: blob: https://*.paypal.com https://*.paypalobjects.com https://*.google.com https://*.gstatic.com https://*.googlesyndication.com",
    // Fetch/XHR: self + Firebase + PayPal API + Google APIs
    "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com https://api-m.paypal.com https://www.paypal.com https://pagead2.googlesyndication.com",
    // Frames: PayPal checkout
    "frame-src https://www.paypal.com https://www.sandbox.paypal.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
    // Workers (Firestore uses a service worker)
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);

  next();
});

// ── Subscription status check ─────────────────────────────────────────────────

// Called by the client on login when planCancelled:true — if PayPal says the
// subscription is still ACTIVE, the client restores the plan itself via updatePlan().
app.use('/api/verify-subscription', express.json({ limit: '4kb' }));

app.post('/api/verify-subscription', verifySubscriptionLimiter, async (req, res) => {
  const { subscriptionId } = req.body || {};
  if (!subscriptionId) return res.status(400).json({ error: 'Missing subscriptionId' });
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    return res.status(503).json({ error: 'PayPal not configured' });
  }
  try {
    const token = await getPayPalToken();
    const r = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const data = await r.json();
    const active = data.status === 'ACTIVE';
    console.log(`Subscription ${subscriptionId} status: ${data.status}`);
    res.json({ active, status: data.status });
  } catch (err) {
    console.error('verify-subscription error:', err.message);
    res.status(500).json({ error: 'Failed to check subscription' });
  }
});

// ── Webhook handler ───────────────────────────────────────────────────────────
app.use('/api/webhooks/paypal', express.raw({ type: 'application/json', limit: '64kb' }));

app.post('/api/webhooks/paypal', webhookLimiter, async (req, res) => {
  try {
    const rawBody = req.body.toString();
    const event   = JSON.parse(rawBody);

    // Verify signature
    const valid = await verifyPayPalWebhook(req.headers, rawBody);
    if (!valid) {
      console.warn('⚠️  PayPal webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const subscriptionId = event.resource?.id || event.resource?.billing_agreement_id;
    console.log(`PayPal webhook: ${event.event_type} — subscription: ${subscriptionId}`);

    const profile = subscriptionId ? await getProfileBySubscriptionId(subscriptionId) : null;
    if (!profile) {
      // Acknowledge but nothing to update
      return res.status(200).json({ received: true });
    }

    switch (event.event_type) {
      // User cancelled — keep Pro until planExpiresAt, mark as cancelled
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await updateProfile(profile.id, {
          planCancelled:   true,
          planCancelledAt: Date.now(),
          // plan stays 'pro' — app checks planExpiresAt on load
        });
        console.log(`✓ Marked subscription cancelled for user ${profile.id}`);
        break;

      // Subscription fully expired or suspended after failure — revoke Pro
      case 'BILLING.SUBSCRIPTION.EXPIRED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await updateProfile(profile.id, {
          plan:            'free',
          planCancelled:   true,
          planCancelledAt: Date.now(),
          planExpiresAt:   Date.now(),
        });
        console.log(`✓ Revoked Pro for user ${profile.id} (${event.event_type})`);
        break;

      // Subscription reactivated
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.RE-ACTIVATED':
        await updateProfile(profile.id, {
          plan:          'pro',
          planCancelled: false,
          planCancelledAt: null,
        });
        console.log(`✓ Reactivated Pro for user ${profile.id}`);
        break;

      // Payment failed — optionally notify; PayPal retries per payment_failure_threshold
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        console.log(`Payment failed for user ${profile.id} — PayPal will retry`);
        break;

      default:
        console.log(`Unhandled event type: ${event.event_type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ── Static SPA serving ────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback — all non-API routes return index.html
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✓ Olai Notes server running on port ${PORT}`);
});
