import React, { useState } from 'react';
import './Header.css';

export default function Header({
  dark, onToggleDark,
  sidebarCollapsed, onToggleSidebar,
  user, onSignOut,
  onOpenGraph, onOpenSketch, onOpenGamif,
  onOpenIntegrations, onOpenAdmin, onOpenGdpr, onOpenPalette,
  onOpenProfile, onOpenSubscription,
  searchQuery, onSearch,
}) {
  const [ddOpen, setDdOpen] = useState(false);

  return (
    <header className="app-header">
      <button className="hdr-sb-toggle" onClick={onToggleSidebar} title="Toggle sidebar (⌘\)">
        <i className="ti ti-layout-sidebar" />
      </button>

      <span className="app-wordmark">Olai Notes</span>

      <div className="hdr-search-wrap">
        <input
          className="hdr-search"
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search notes…"
          autoComplete="off"
          aria-label="Search notes"
        />
        <i className="ti ti-search hdr-search-ic" />
      </div>

      <div className="hdr-right">
        <span className="hdr-sync-dot" title="Synced" />

        <button className="hdr-icon-btn" onClick={onOpenSketch} title="Sketch canvas">
          <i className="ti ti-pencil" />
        </button>
        <button className="hdr-icon-btn" onClick={onOpenGamif} title="Achievements">
          <i className="ti ti-trophy" />
        </button>
        <button className="hdr-icon-btn" onClick={onOpenIntegrations} title="Integrations">
          <i className="ti ti-plug" />
        </button>
        <button className="hdr-icon-btn" onClick={onOpenAdmin} title="Admin panel">
          <i className="ti ti-shield" />
        </button>
        <button className="hdr-icon-btn" onClick={onOpenGdpr} title="Privacy & data">
          <i className="ti ti-lock" />
        </button>
        <button className="hdr-icon-btn" onClick={onOpenGraph} title="Knowledge graph">
          <i className="ti ti-topology-star" />
        </button>
        <button className="hdr-icon-btn" onClick={onToggleDark} title="Toggle dark mode">
          <i className={`ti ${dark ? 'ti-sun' : 'ti-moon'}`} />
        </button>

        <div className="hdr-avatar-wrap">
          <button
            className="hdr-avatar"
            onClick={() => setDdOpen(v => !v)}
            title="Account"
          >
            {user?.initials || 'AL'}
          </button>

          {ddOpen && (
            <>
              <div className="dd-backdrop" onClick={() => setDdOpen(false)} />
              <div className="profile-dropdown">
                <div className="pd-user">
                  <div className="pd-av" style={{ background: user?.color || '#2D6A4F' }}>
                    {user?.initials || 'AL'}
                  </div>
                  <div>
                    <div className="pd-name">{user?.name || 'Ada Lovelace'}</div>
                    <div className="pd-email">{user?.email || 'ada@example.com'}</div>
                    <span className="pd-plan">{user?.plan || 'Free'}</span>
                  </div>
                </div>
                <div className="pd-section">
                  <div className="pd-item" onClick={() => { setDdOpen(false); onOpenProfile?.(); }}>
                    <i className="ti ti-user-circle" /> Profile &amp; account
                  </div>
                  <div className="pd-item" onClick={() => { setDdOpen(false); onOpenAdmin(); }}>
                    <i className="ti ti-shield" /> Admin panel
                  </div>
                  <div className="pd-item" onClick={() => { setDdOpen(false); onOpenGdpr(); }}>
                    <i className="ti ti-lock" /> Privacy & data
                  </div>
                  <div className="pd-item" onClick={() => { setDdOpen(false); onOpenGamif(); }}>
                    <i className="ti ti-trophy" /> Achievements
                  </div>
                </div>
                {user?.plan?.toLowerCase() !== 'pro' && (
                  <div className="pd-section">
                    <div className="pd-item" style={{ color: 'var(--accent)', fontWeight: 500 }}
                      onClick={() => { setDdOpen(false); onOpenSubscription?.(); }}>
                      <i className="ti ti-star" /> Upgrade to Pro — $7.99/mo
                    </div>
                  </div>
                )}
                <div className="pd-signout">
                  <button className="pd-signout-btn" onClick={() => { setDdOpen(false); onSignOut?.(); }}>
                    <i className="ti ti-logout" /> Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
