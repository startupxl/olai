import React, { useState, useEffect, useRef } from 'react';
import { updatePlan } from '../lib/firestoreService.js';

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'YOUR_PAYPAL_CLIENT_ID';
const PAYPAL_PLAN_ID   = import.meta.env.VITE_PAYPAL_PLAN_ID   || 'YOUR_PAYPAL_PLAN_ID';

const PRO_FEATURES = [
  'No ads — clean, distraction-free writing',
  'Unlimited notes & spaces',
  'Priority sync across all devices',
  'Early access to new features',
  'Support independent development',
];

const FREE_FEATURES = [
  'Unlimited notes',
  'Wikilinks & knowledge graph',
  'Spaces, tags & search',
  'Firestore sync across devices',
];

function loadPayPalSDK(clientId, onLoad) {
  const existing = document.getElementById('paypal-sdk');
  if (existing) { onLoad(); return; }
  const s = document.createElement('script');
  s.id  = 'paypal-sdk';
  s.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
  s.onload = onLoad;
  document.head.appendChild(s);
}

export default function SubscriptionPanel({ open, onClose, user, currentPlan, toast, onPlanUpdated }) {
  const [sdkReady, setSdkReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const btnRef = useRef(null);
  const btnMounted = useRef(false);

  useEffect(() => {
    if (!open || PAYPAL_CLIENT_ID === 'YOUR_PAYPAL_CLIENT_ID') return;
    loadPayPalSDK(PAYPAL_CLIENT_ID, () => setSdkReady(true));
  }, [open]);

  useEffect(() => {
    if (!sdkReady || !btnRef.current || btnMounted.current || !window.paypal) return;
    btnMounted.current = true;

    window.paypal.Buttons({
      style: { shape: 'rect', color: 'gold', layout: 'vertical', label: 'subscribe' },
      createSubscription: (_data, actions) =>
        actions.subscription.create({ plan_id: PAYPAL_PLAN_ID }),
      onApprove: async (data) => {
        setProcessing(true);
        try {
          await updatePlan(user.uid, 'pro', data.subscriptionID);
          onPlanUpdated('pro');
          toast('Upgraded to Pro! Ads removed. Thank you 🎉');
          onClose();
        } catch {
          toast('Subscription approved but profile update failed — contact support', 'warn');
        } finally {
          setProcessing(false);
        }
      },
      onError: (err) => {
        console.error('PayPal error', err);
        toast('Payment error — please try again', 'warn');
      },
    }).render(btnRef.current);
  }, [sdkReady]);

  if (!open) return null;

  const isPro = currentPlan?.toLowerCase() === 'pro';

  return (
    <div className="overlay-backdrop open" onClick={onClose}>
      <div className="panel panel-wide" onClick={e => e.stopPropagation()}
        style={{ maxWidth: 560, width: '100%' }}>
        <div className="panel-header">
          <span className="panel-title">Upgrade to Pro</span>
          <button className="panel-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div style={{ padding: '24px', overflow: 'auto', maxHeight: 'calc(90vh - 60px)' }}>
          {isPro ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>You're on Pro</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Enjoying ad-free notes and all Pro features. Thank you for supporting Olai Notes.</div>
            </div>
          ) : (
            <>
              {/* Plan comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
                {/* Free */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 6 }}>Free</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>$0</div>
                  {FREE_FEATURES.map(f => (
                    <div key={f} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 6, marginBottom: 6 }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                {/* Pro */}
                <div style={{ border: '2px solid var(--accent)', borderRadius: 8, padding: 16, background: 'color-mix(in srgb, var(--accent) 5%, transparent)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', marginBottom: 6 }}>Pro</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>$7.99<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-tertiary)' }}>/mo</span></div>
                  {PRO_FEATURES.map(f => (
                    <div key={f} style={{ fontSize: 12, color: 'var(--text-primary)', display: 'flex', gap: 6, marginBottom: 6 }}>
                      <span style={{ color: 'var(--accent)' }}>✓</span> {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* PayPal button or placeholder */}
              {processing ? (
                <div style={{ textAlign: 'center', padding: '16px', fontSize: 13, color: 'var(--text-tertiary)' }}>Activating Pro…</div>
              ) : PAYPAL_CLIENT_ID === 'YOUR_PAYPAL_CLIENT_ID' ? (
                <div style={{ border: '1px dashed var(--border)', borderRadius: 6, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>PayPal not configured yet</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                    Add <code>VITE_PAYPAL_CLIENT_ID</code> and <code>VITE_PAYPAL_PLAN_ID</code> to your <code>.env</code> file.
                  </div>
                </div>
              ) : (
                <>
                  {!sdkReady && <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', padding: '12px 0' }}>Loading PayPal…</div>}
                  <div ref={btnRef} style={{ display: sdkReady ? 'block' : 'none' }} />
                </>
              )}

              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
                Secure payment via PayPal · Cancel anytime · Subscription synced across web and mobile
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
