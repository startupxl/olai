import React from 'react';

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(80px,15vw,140px)', fontWeight: 700, lineHeight: 1, color: 'var(--border)', marginBottom: 24 }}>404</div>
      <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 12 }}>Olai Notes</div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Page not found</h1>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32 }}>The page you're looking for doesn't exist or has been moved.</p>
      <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--accent)', textDecoration: 'none', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 20px' }}>
        ← Back to Olai Notes
      </a>
    </div>
  );
}
