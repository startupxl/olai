import React, { useState } from 'react';
import { updateDisplayName, sendPasswordReset, signOut } from '../lib/firebaseAuth.js';

export default function ProfilePanel({ open, onClose, user, toast, onSignOut, onUserUpdate }) {
  const [name, setName]       = useState(user?.name || '');
  const [saving, setSaving]   = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (!open) return null;

  async function saveName() {
    if (!name.trim() || name.trim() === user?.name) return;
    setSaving(true);
    try {
      await updateDisplayName(name.trim());
      toast('Display name updated');
      if (onUserUpdate) onUserUpdate({ ...user, name: name.trim() });
    } catch (err) {
      toast('Failed to update name', 'warn');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordReset() {
    if (!user?.email) return;
    try {
      await sendPasswordReset(user.email);
      setResetSent(true);
      toast('Password reset email sent');
    } catch {
      toast('Failed to send reset email', 'warn');
    }
  }

  return (
    <div className="overlay-backdrop open" onClick={onClose}>
      <div className="panel" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <span className="panel-title">Profile &amp; account</span>
          <button className="panel-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Avatar + plan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: user?.color || '#2D6A4F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {user?.initials || '?'}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || 'Writer'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{user?.email}</div>
              <span style={{ fontSize: 11, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '2px 8px', color: 'var(--text-secondary)', marginTop: 4, display: 'inline-block', textTransform: 'capitalize' }}>
                {user?.plan || 'Free'} plan
              </span>
            </div>
          </div>

          {/* Display name */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Display name</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="field-input"
                style={{ flex: 1 }}
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                placeholder="Your name"
              />
              <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={saveName} disabled={saving || name.trim() === user?.name}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email address</label>
            <input className="field-input" value={user?.email || ''} readOnly style={{ color: 'var(--text-tertiary)', cursor: 'default' }} />
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>Email cannot be changed. Contact support if needed.</div>
          </div>

          {/* Password reset */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>Password</div>
            {resetSent ? (
              <div style={{ fontSize: 12, color: 'var(--accent)' }}>✓ Reset link sent to {user?.email}</div>
            ) : (
              <button className="btn-secondary" style={{ fontSize: 12 }} onClick={handlePasswordReset}>
                Send password reset email
              </button>
            )}
          </div>

          {/* Sign out */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <button className="btn-danger" style={{ fontSize: 12 }} onClick={() => { onClose(); onSignOut?.(); }}>
              <i className="ti ti-logout" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
