import React, { useState, useEffect, useRef } from 'react';
import { updatePlan } from '../lib/firestoreService.js';

const PAYPAL_CLIENT_ID   = import.meta.env.VITE_PAYPAL_CLIENT_ID       || 'AW7e40ng8NMKkgeoyI1ggMc2YmOVp3puedlkjB-90qSouRCO7OeVc72RaGqifQMLllFjL9AcFjDV4sTX';
const PLAN_ID_MONTHLY    = import.meta.env.VITE_PAYPAL_PLAN_ID_MONTHLY  || 'P-3M279991U13357141NJBENDA';
const PLAN_ID_ANNUAL     = import.meta.env.VITE_PAYPAL_PLAN_ID_ANNUAL   || 'P-2MY17037UE460483RNJBENDI';

const PRO_FEATURES = [
  { icon: '🚫', text: 'No ads — clean, distraction-free writing' },
  { icon: '📝', text: 'Unlimited notes & spaces' },
  { icon: '🔗', text: 'Wikilinks & knowledge graph' },
  { icon: '⚡', text: 'Priority sync across web & mobile' },
  { icon: '🆕', text: 'Early access to new features' },
];

const FREE_FEATURES = [
  'Unlimited notes',
  'Wikilinks & knowledge graph',
  'Spaces, tags & search',
  'Cross-device sync',
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
  const [billing, setBilling]     = useState('annual'); // 'monthly' | 'annual'
  const [sdkReady, setSdkReady]   = useState(false);
  const [processing, setProcessing] = useState(false);
  const btnRef      = useRef(null);
  const btnMounted  = useRef({ monthly: false, annual: false });
  const configured  = PAYPAL_CLIENT_ID !== 'YOUR_PAYPAL_CLIENT_ID';

  useEffect(() => {
    if (!open || !configured) return;
    loadPayPalSDK(PAYPAL_CLIENT_ID, () => setSdkReady(true));
  }, [open]);

  // Re-render PayPal button whenever billing cycle changes
  useEffect(() => {
    if (!sdkReady || !btnRef.current || !window.paypal) return;
    if (btnMounted.current[billing]) return;
    btnMounted.current[billing] = true;

    const planId = billing === 'annual' ? PLAN_ID_ANNUAL : PLAN_ID_MONTHLY;

    btnRef.current.innerHTML = '';
    window.paypal.Buttons({
      // Render as a minimal, borderless button — it sits behind our custom button (opacity 0.01)
      style: { shape: 'rect', color: 'black', layout: 'vertical', label: 'subscribe', height: 50 },
      createSubscription: (_data, actions) =>
        actions.subscription.create({ plan_id: planId }),
      onApprove: async (data) => {
        setProcessing(true);
        try {
          await updatePlan(user.uid, 'pro', data.subscriptionID, billing, Date.now());
          onPlanUpdated('pro');
          toast(`You're now on Olai Pro — thank you! 🎉`);
          onClose();
        } catch {
          toast('Payment received but profile update failed — contact support@olainotes.com', 'warn');
        } finally {
          setProcessing(false);
        }
      },
      onError: (err) => {
        console.error('PayPal error', err);
        toast('Payment error — please try again or contact support', 'warn');
      },
    }).render(btnRef.current);
  }, [sdkReady, billing]);

  // When billing toggles, reset so button re-renders
  function switchBilling(b) {
    if (b === billing) return;
    btnMounted.current[b] = false;
    setBilling(b);
  }

  if (!open) return null;

  const isPro = currentPlan?.toLowerCase() === 'pro';

  const monthlyPrice = 7.99;
  const annualPrice  = 59.99;
  const annualPerMo  = (annualPrice / 12).toFixed(2);
  const annualSaving = Math.round((1 - annualPerMo / monthlyPrice) * 100);

  return (
    <div className="overlay-backdrop open" onClick={onClose}>
      <div className="panel panel-wide" onClick={e => e.stopPropagation()}
        style={{ maxWidth: 580, width: '100%' }}>
        <div className="panel-header">
          <span className="panel-title">Upgrade to Olai Pro</span>
          <button className="panel-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 60px)' }}>
          {isPro ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>⭐</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>You're on Olai Pro</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Enjoying ad-free notes and all Pro features.<br />Thank you for supporting independent software.</div>
            </div>
          ) : (
            <>
              {/* Billing toggle */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <div style={{ display: 'inline-flex', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 3 }}>
                  {['monthly', 'annual'].map(b => (
                    <button key={b} onClick={() => switchBilling(b)} style={{
                      padding: '6px 18px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                      background: billing === b ? 'var(--bg-primary)' : 'transparent',
                      color: billing === b ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      boxShadow: billing === b ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      {b === 'monthly' ? 'Monthly' : 'Annual'}
                      {b === 'annual' && (
                        <span style={{ background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 6px' }}>
                          SAVE {annualSaving}%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {/* Free */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 6 }}>Free</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>$0</div>
                  {FREE_FEATURES.map(f => (
                    <div key={f} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 7, marginBottom: 7, alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>✓</span> {f}
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 10, display: 'flex', gap: 7 }}>
                    <span style={{ flexShrink: 0 }}>✕</span> Includes ads
                  </div>
                </div>

                {/* Pro */}
                <div style={{ border: '2px solid var(--accent)', borderRadius: 10, padding: 16, background: 'color-mix(in srgb, var(--accent) 6%, transparent)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: -10, right: 14, background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '2px 10px' }}>
                    {billing === 'annual' ? 'BEST VALUE' : 'PRO'}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', marginBottom: 6 }}>Olai Pro</div>
                  <div style={{ marginBottom: 16 }}>
                    {billing === 'annual' ? (
                      <>
                        <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>${annualPerMo}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>/mo</span>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          <s style={{ color: 'var(--text-tertiary)' }}>${(monthlyPrice * 12).toFixed(2)}</s>
                          {' '}${annualPrice}/yr billed annually
                        </div>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>${monthlyPrice}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>/mo</span>
                      </>
                    )}
                  </div>
                  {PRO_FEATURES.map(f => (
                    <div key={f.text} style={{ fontSize: 12, color: 'var(--text-primary)', display: 'flex', gap: 7, marginBottom: 7, alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0 }}>{f.icon}</span> {f.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Subscribe CTA */}
              {processing ? (
                <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', letterSpacing: '0.01em' }}>
                  Activating Pro…
                </div>
              ) : !configured ? (
                <div style={{ border: '1px dashed var(--border)', borderRadius: 6, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Payment not configured — set env vars on server</div>
                </div>
              ) : (
                <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
                  {/* Visible custom button — pointer-events disabled so clicks pass through to PayPal */}
                  <button style={{
                    width: '100%', height: 50,
                    background: sdkReady ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: sdkReady ? '#fff' : 'var(--text-tertiary)',
                    border: 'none', borderRadius: 8, cursor: sdkReady ? 'pointer' : 'default',
                    fontSize: 14, fontWeight: 600, letterSpacing: '0.01em',
                    fontFamily: 'var(--font-ui)',
                    pointerEvents: 'none', // clicks fall through to PayPal iframe
                    transition: 'background 0.15s',
                  }}>
                    {sdkReady
                      ? billing === 'annual'
                        ? `Start Pro — $${annualPrice}/year`
                        : `Start Pro — $${monthlyPrice}/month`
                      : 'Loading…'}
                  </button>

                  {/* PayPal button overlaid — nearly invisible but receives all clicks */}
                  <div ref={btnRef} style={{
                    position: 'absolute', inset: 0,
                    opacity: 0.01,
                    zIndex: 10,
                    display: sdkReady ? 'block' : 'none',
                  }} />
                </div>
              )}

              {/* Policy notice */}
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Billing policy:</strong> You may cancel at any time from your PayPal account.
                  {' '}All payments are final — no refunds are issued.
                  {' '}Upon cancellation, your Pro access continues until the end of your current {billing === 'annual' ? '12-month' : 'monthly'} billing period.
                  {' '}Secure payment via PayPal. Subscription syncs instantly across web and mobile.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
