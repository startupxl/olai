import React from 'react';

const s = {
  root:  { minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '60px 24px' },
  inner: { maxWidth: 720, margin: '0 auto' },
  back:  { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent)', textDecoration: 'none', marginBottom: 40 },
  logo:  { fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--text-tertiary)', marginBottom: 8 },
  h1:    { fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,5vw,42px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 8 },
  date:  { fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 48 },
  h2:    { fontSize: 18, fontWeight: 600, marginTop: 40, marginBottom: 12 },
  p:     { fontSize: 15, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 16 },
  ul:    { fontSize: 15, lineHeight: 1.7, color: 'var(--text-secondary)', paddingLeft: 20, marginBottom: 16 },
  hr:    { border: 'none', borderTop: '1px solid var(--border)', margin: '48px 0' },
  footer:{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 64 },
};

export default function TermsPage() {
  return (
    <div style={s.root}>
      <div style={s.inner}>
        <a href="/" style={s.back}>← Back to Olai Notes</a>
        <div style={s.logo}>Olai Notes</div>
        <h1 style={s.h1}>Terms of Service</h1>
        <p style={s.date}>Last updated: 29 June 2026</p>

        <p style={s.p}>These Terms of Service ("Terms") govern your use of Olai Notes, operated by Olai Notes Ltd. By creating an account or using the service, you agree to these Terms.</p>

        <h2 style={s.h2}>1. Acceptance</h2>
        <p style={s.p}>By accessing or using Olai Notes, you confirm that you are at least 16 years old and have the legal capacity to enter into this agreement. If you are using the service on behalf of an organisation, you represent that you have authority to bind that organisation.</p>

        <h2 style={s.h2}>2. Description of service</h2>
        <p style={s.p}>Olai Notes provides a web and mobile note-taking application with features including wikilinks, a knowledge graph, spaces, tags, and Firebase-powered sync. We reserve the right to modify or discontinue features at any time.</p>

        <h2 style={s.h2}>3. Your account</h2>
        <ul style={s.ul}>
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>You must provide accurate information when creating an account.</li>
          <li>You are responsible for all activity that occurs under your account.</li>
          <li>Notify us immediately of any unauthorised use at <a href="mailto:security@olainotes.com" style={{ color: 'var(--accent)' }}>security@olainotes.com</a>.</li>
        </ul>

        <h2 style={s.h2}>4. Acceptable use</h2>
        <p style={s.p}>You agree not to:</p>
        <ul style={s.ul}>
          <li>Use the service for any unlawful purpose or in violation of these Terms.</li>
          <li>Upload, store, or transmit any content that infringes intellectual property rights.</li>
          <li>Attempt to gain unauthorised access to any part of the service or other users' data.</li>
          <li>Use automated tools to scrape or extract data from the service.</li>
          <li>Transmit malware, spam, or any harmful content.</li>
        </ul>

        <h2 style={s.h2}>5. Your content</h2>
        <p style={s.p}>You retain ownership of all notes and content you create. By using Olai Notes, you grant us a limited, non-exclusive licence to store and transmit your content solely to provide the service. We do not claim ownership of your notes.</p>

        <h2 style={s.h2}>6. Free and paid plans</h2>
        <p style={s.p}>Olai Notes offers a free tier and paid plans. Paid plan pricing and features are described on the pricing page. We may change pricing with 30 days' notice. Refunds are provided in accordance with applicable consumer law.</p>

        <h2 style={s.h2}>7. Termination</h2>
        <p style={s.p}>You may delete your account at any time via the Privacy &amp; data settings. We may suspend or terminate accounts that violate these Terms, with or without notice. Upon termination, your data will be deleted within 30 days.</p>

        <h2 style={s.h2}>8. No warranty</h2>
        <p style={s.p}>The service is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that the service will be uninterrupted, error-free, or free of viruses.</p>

        <h2 style={s.h2}>9. Limitation of liability</h2>
        <p style={s.p}>To the maximum extent permitted by law, Olai Notes shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, arising from your use of the service. Our total liability to you shall not exceed the amount you paid us in the 12 months preceding the claim.</p>

        <h2 style={s.h2}>10. Governing law</h2>
        <p style={s.p}>These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>

        <h2 style={s.h2}>11. Changes to these Terms</h2>
        <p style={s.p}>We may update these Terms from time to time. We will notify you of material changes by email or in-app notice at least 14 days before they take effect. Continued use after changes constitutes acceptance.</p>

        <h2 style={s.h2}>12. Contact</h2>
        <p style={s.p}>Questions about these Terms? Email <a href="mailto:legal@olainotes.com" style={{ color: 'var(--accent)' }}>legal@olainotes.com</a>.</p>

        <hr style={s.hr} />
        <p style={s.footer}>© {new Date().getFullYear()} Olai Notes · <a href="/privacy" style={{ color: 'inherit' }}>Privacy Policy</a></p>
      </div>
    </div>
  );
}
