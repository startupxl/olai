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

// ── Webhook handler ───────────────────────────────────────────────────────────
app.use('/api/webhooks/paypal', express.raw({ type: 'application/json' }));

app.post('/api/webhooks/paypal', async (req, res) => {
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
