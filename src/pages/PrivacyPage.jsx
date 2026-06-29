import React from 'react';

const s = {
  root:    { minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '60px 24px' },
  inner:   { maxWidth: 720, margin: '0 auto' },
  back:    { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent)', textDecoration: 'none', marginBottom: 40 },
  logo:    { fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--text-tertiary)', marginBottom: 8 },
  h1:      { fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,5vw,42px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 8 },
  date:    { fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 48 },
  h2:      { fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 12 },
  p:       { fontSize: 15, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 16 },
  ul:      { fontSize: 15, lineHeight: 1.7, color: 'var(--text-secondary)', paddingLeft: 20, marginBottom: 16 },
  hr:      { border: 'none', borderTop: '1px solid var(--border)', margin: '48px 0' },
  footer:  { fontSize: 12, color: 'var(--text-tertiary)', marginTop: 64 },
};

export default function PrivacyPage() {
  return (
    <div style={s.root}>
      <div style={s.inner}>
        <a href="/" style={s.back}>← Back to Olai Notes</a>
        <div style={s.logo}>Olai Notes</div>
        <h1 style={s.h1}>Privacy Policy</h1>
        <p style={s.date}>Last updated: 29 June 2026</p>

        <p style={s.p}>Olai Notes ("we", "us", "our") is committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights.</p>

        <h2 style={s.h2}>1. What we collect</h2>
        <ul style={s.ul}>
          <li><strong>Account data</strong> — your name and email address when you sign up.</li>
          <li><strong>Notes content</strong> — the text, titles, and metadata of notes you create. Stored in Firebase Firestore.</li>
          <li><strong>Usage data</strong> — basic product analytics (feature usage, session length) to improve the product. No keystroke logging.</li>
          <li><strong>Crash reports</strong> — error stack traces when the app crashes, to fix bugs.</li>
        </ul>

        <h2 style={s.h2}>2. How we use your data</h2>
        <ul style={s.ul}>
          <li>To provide, maintain, and improve the Olai Notes service.</li>
          <li>To authenticate you and sync your notes across devices.</li>
          <li>To send essential service emails (password reset, security alerts).</li>
          <li>We do <strong>not</strong> sell your data to third parties.</li>
          <li>We do <strong>not</strong> use your note content to train AI models without your explicit consent.</li>
        </ul>

        <h2 style={s.h2}>3. Data storage & security</h2>
        <p style={s.p}>Your data is stored on Google Firebase infrastructure (Firestore and Firebase Auth), hosted in the EU. We use Firebase Security Rules to ensure only you can access your notes. Data is encrypted in transit (TLS 1.3) and at rest.</p>

        <h2 id="cookies" style={s.h2}>4. Cookies</h2>
        <p style={s.p}>We use a small number of cookies and similar storage mechanisms:</p>
        <ul style={s.ul}>
          <li><strong>Authentication</strong> — Firebase Auth stores a session token in IndexedDB / localStorage to keep you signed in.</li>
          <li><strong>Preferences</strong> — dark mode and sidebar state are stored in localStorage.</li>
          <li><strong>Analytics</strong> — if you opt in, we use anonymised analytics events (no personal identifiers).</li>
        </ul>
        <p style={s.p}>You can clear these at any time via your browser settings.</p>

        <h2 id="gdpr" style={s.h2}>5. Your rights (GDPR / CCPA)</h2>
        <p style={s.p}>If you are located in the EU, UK, or California, you have the right to:</p>
        <ul style={s.ul}>
          <li><strong>Access</strong> — request a copy of your personal data.</li>
          <li><strong>Rectification</strong> — correct inaccurate data.</li>
          <li><strong>Erasure</strong> — delete your account and all associated data (available in Privacy & data settings).</li>
          <li><strong>Portability</strong> — export your notes in JSON or HTML format.</li>
          <li><strong>Objection</strong> — opt out of analytics and marketing communications.</li>
        </ul>
        <p style={s.p}>To exercise any right, email <a href="mailto:privacy@olainotes.com" style={{ color: 'var(--accent)' }}>privacy@olainotes.com</a> or use the Privacy &amp; data panel in the app.</p>

        <h2 style={s.h2}>6. Data retention</h2>
        <p style={s.p}>We retain your data for as long as your account is active. When you delete your account, your notes and personal data are permanently removed within 30 days.</p>

        <h2 style={s.h2}>7. Third-party services</h2>
        <p style={s.p}>We use Google Firebase (authentication and database). Firebase is subject to Google's Privacy Policy. We do not share your data with any other third parties.</p>

        <h2 style={s.h2}>8. Changes to this policy</h2>
        <p style={s.p}>We may update this policy from time to time. Material changes will be communicated via email or an in-app notice. Continued use after changes constitutes acceptance.</p>

        <h2 style={s.h2}>9. Contact</h2>
        <p style={s.p}>Questions about this policy? Email <a href="mailto:privacy@olainotes.com" style={{ color: 'var(--accent)' }}>privacy@olainotes.com</a>.</p>

        <hr style={s.hr} />
        <p style={s.footer}>© {new Date().getFullYear()} Olai Notes · <a href="/terms" style={{ color: 'inherit' }}>Terms of Service</a></p>
      </div>
    </div>
  );
}
