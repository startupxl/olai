import React, { useState, useEffect, useRef } from 'react';
import { INTEGRATIONS, BADGES, MILESTONES, ONBOARDING_STEPS, htmlToMarkdown, downloadFile } from '../lib/store.js';
import { getReferralCount, REFERRAL_TIERS } from '../lib/firestoreService.js';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, sendMagicLink, sendPasswordReset } from '../lib/firebaseAuth.js';
import './Panels.css';

/* ═══════════════════════════ SHARED ═══════════════════════════ */
function Overlay({ open, onClose, children, wide }) {
  if (!open) return null;
  return (
    <div className="overlay-backdrop open" onClick={onClose}>
      <div className={`panel${wide ? ' panel-wide' : ''}`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
function PanelHeader({ title, onClose }) {
  return (
    <div className="panel-header">
      <span className="panel-title">{title}</span>
      <button className="panel-close" onClick={onClose} aria-label="Close">×</button>
    </div>
  );
}

/* ═══════════════════════════ KNOWLEDGE GRAPH ═══════════════════════════ */
export function GraphPanel({ open, onClose, notes, activeNoteId, onOpenNote }) {
  const canvasRef = useRef(null);
  const svgRef    = useRef(null);
  const [positions, setPositions] = useState({});

  // Parse [[Title]] wikilinks from markdown body, resolve to note IDs by title
  function getLinkedIds(note) {
    const matches = [...(note.body || '').matchAll(/\[\[([^\]]+)\]\]/g)].map(m => m[1].toLowerCase());
    return notes
      .filter(n => n.id !== note.id && matches.includes((n.title || '').toLowerCase()))
      .map(n => n.id);
  }
  function getBacklinks(id) {
    return notes.filter(n => n.id !== id && getLinkedIds(n).includes(id));
  }

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const W = canvasRef.current.clientWidth || 480;
    const H = canvasRef.current.clientHeight || 300;
    const pos = {};
    const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.36;
    notes.forEach((n, i) => {
      const a = (2 * Math.PI * i) / notes.length - Math.PI / 2;
      pos[n.id] = { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    });
    setPositions(pos);
  }, [open, notes]);

  const colors = ['#6366F1','#2D6A4F','#D4A017','#C0392B','#0891B2','#7C3AED','#B45309'];
  const aliveNotes = notes.filter(n => !n.deleted);
  const drawn = new Set();
  const edges = [];
  aliveNotes.forEach(n => {
    getLinkedIds(n).forEach(tid => {
      const ids = [n.id, tid].sort();
      const key = ids.join('-');
      if (drawn.has(key)) return; drawn.add(key);
      const f = positions[n.id], t = positions[tid];
      if (f && t) edges.push({ x1: f.x, y1: f.y, x2: t.x, y2: t.y });
    });
  });

  return (
    <Overlay open={open} onClose={onClose} wide>
      <PanelHeader title="Knowledge graph" onClose={onClose} />
      <div className="graph-canvas" ref={canvasRef}>
        <svg ref={svgRef} className="graph-svg">
          {edges.map((e, i) => (
            <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke="var(--border)" strokeWidth="1.5" />
          ))}
        </svg>
        {aliveNotes.map((n, i) => {
          const pos = positions[n.id];
          if (!pos) return null;
          const lc = getLinkedIds(n).length + getBacklinks(n.id).length;
          const sz = Math.max(26, Math.min(42, 22 + lc * 4));
          const col = colors[i % colors.length];
          return (
            <React.Fragment key={n.id}>
              <div
                className={`graph-node${n.id === activeNoteId ? ' active' : ''}`}
                style={{ width: sz, height: sz, background: col, left: pos.x - sz/2, top: pos.y - sz/2, fontSize: Math.max(9, sz/3.5) }}
                title={n.title}
                onClick={() => { onOpenNote(n.id); onClose(); }}
              >
                {(n.title || '?').slice(0, 2).toUpperCase()}
              </div>
              <div className="graph-label" style={{ left: pos.x, top: pos.y + sz/2 + 3 }}>
                {(n.title || 'Untitled').slice(0, 16)}{n.title?.length > 16 ? '…' : ''}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div className="graph-footer">
        <span>{aliveNotes.length} notes · {edges.length} connections · Click a node to open</span>
      </div>
    </Overlay>
  );
}

/* ═══════════════════════════ SKETCH CANVAS ═══════════════════════════ */
export function SketchPanel({ open, onClose, onInsert }) {
  const canvasRef = useRef(null);
  const [tool,    setTool]    = useState('pen');
  const [color,   setColor]   = useState('#1A1A18');
  const [size,    setSize]    = useState(3);
  const [history, setHistory] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const strokeRef = useRef([]);
  const ctxRef    = useRef(null);

  const COLORS = ['#1A1A18','#2D6A4F','#C0392B','#6366F1','#D4A017','#0891B2','#ffffff'];

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width  = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight || 280;
    ctxRef.current = canvas.getContext('2d');
    ctxRef.current.lineCap = 'round';
    ctxRef.current.lineJoin = 'round';
    setHistory([]); render([]);
  }, [open]);

  function render(hist) {
    const canvas = canvasRef.current; if (!canvas || !ctxRef.current) return;
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hist.forEach(stroke => {
      if (!stroke.length) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke[0].color;
      ctx.lineWidth   = stroke[0].size;
      ctx.globalAlpha = stroke[0].tool === 'marker' ? 0.4 : 1;
      ctx.globalCompositeOperation = stroke[0].tool === 'eraser' ? 'destination-out' : 'source-over';
      stroke.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function getPos(e) {
    const r = canvasRef.current.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  }
  function onStart(e) { setDrawing(true); strokeRef.current = [{ ...getPos(e), color, size, tool }]; }
  function onMove(e)  {
    if (!drawing) return; e.preventDefault();
    strokeRef.current.push({ ...getPos(e), color, size, tool });
    const h = [...history, strokeRef.current];
    render(h);
  }
  function onEnd()    {
    if (!drawing) return; setDrawing(false);
    if (strokeRef.current.length > 1) {
      const h = [...history, [...strokeRef.current]];
      setHistory(h); render(h);
    }
    strokeRef.current = [];
  }

  return (
    <Overlay open={open} onClose={onClose} wide>
      <PanelHeader title="Sketch canvas" onClose={onClose} />
      <div className="sketch-toolbar">
        {['pen','marker','eraser'].map(t => (
          <button key={t} className={`sk-btn${tool === t ? ' active' : ''}`} onClick={() => setTool(t)} title={t}>
            <i className={`ti ti-${t === 'pen' ? 'pencil' : t === 'marker' ? 'highlight' : 'eraser'}`} />
          </button>
        ))}
        <div className="sk-sep" />
        <div className="sk-size-wrap">
          <span>Size</span>
          <input type="range" min="1" max="20" value={size}
            onChange={e => setSize(+e.target.value)} className="sk-range" />
          <span>{size}px</span>
        </div>
        <div className="sk-sep" />
        <div className="sk-colors">
          {COLORS.map(c => (
            <div key={c} className={`sk-color${color === c ? ' active' : ''}`}
              style={{ background: c, border: c === '#ffffff' ? '1px solid #D8D7D2' : 'none' }}
              onClick={() => setColor(c)} />
          ))}
        </div>
        <div className="sk-sep" />
        <button className="sk-btn" onClick={() => { const h = [...history]; h.pop(); setHistory(h); render(h); }} title="Undo">
          <i className="ti ti-arrow-back-up" />
        </button>
        <button className="sk-btn" onClick={() => { setHistory([]); render([]); }} title="Clear">
          <i className="ti ti-trash" />
        </button>
      </div>
      <div className="sketch-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="sketch-canvas"
          onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
          onTouchStart={e => { e.preventDefault(); onStart(e); }}
          onTouchMove={e  => { e.preventDefault(); onMove(e);  }}
          onTouchEnd={onEnd}
        />
      </div>
      <div className="sketch-footer">
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Draw freely — click and drag</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => {
            if (!canvasRef.current) return;
            onInsert(canvasRef.current.toDataURL('image/png'));
            onClose();
          }}>Insert into note</button>
        </div>
      </div>
    </Overlay>
  );
}

/* ═══════════════════════════ GAMIFICATION ═══════════════════════════ */
const REWARD_LABELS = {
  1: '1 month Pro free',
  3: '3 months Pro free',
  5: '6 months Pro free',
};

export function GamificationPanel({ open, onClose, noteCount, toast, user }) {
  const [copied,    setCopied]    = useState(false);
  const [refCount,  setRefCount]  = useState(null); // null = loading

  const refUrl = user?.uid ? `https://olainotes.com/r/${user.uid}` : '';

  useEffect(() => {
    if (!open || !user?.uid) return;
    getReferralCount(user.uid).then(setRefCount).catch(() => setRefCount(0));
  }, [open, user?.uid]);

  function copyRef() {
    if (!refUrl) return;
    navigator.clipboard.writeText(refUrl).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast('Referral link copied!');
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <PanelHeader title="Achievements & referrals" onClose={onClose} />
      <div className="gamif-body">
        {/* Stats */}
        <div className="streak-row">
          <div className="streak-icon">🔥</div>
          <div>
            <div className="streak-val">{noteCount}</div>
            <div className="streak-lbl">total notes</div>
            <div className="streak-sub">Keep writing — your knowledge graph grows with you.</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div className="streak-val">{refCount ?? '—'}</div>
            <div className="streak-lbl">referrals</div>
          </div>
        </div>
        {/* Badges */}
        <div className="gamif-section-label">Badges</div>
        <div className="badges-grid">
          {BADGES.map((b, i) => (
            <div key={i} className={`badge-item${b.earned ? ' earned' : ' locked'}`}>
              <div className="badge-ic">{b.ic}</div>
              <div className="badge-name">{b.name}</div>
            </div>
          ))}
        </div>
        {/* Milestones */}
        <div className="gamif-section-label">Milestones</div>
        {MILESTONES.map((m, i) => (
          <div key={i} className="ms-row">
            <span className="ms-label">{m.label}</span>
            <div className="ms-bar"><div className="ms-fill" style={{ width: `${Math.min(100, m.current/m.target*100)}%` }} /></div>
            <span className="ms-count">{m.current}/{m.target}</span>
          </div>
        ))}
        {/* Referral */}
        <div className="referral-box">
          <div className="referral-title">Invite friends, earn Pro free</div>
          <div className="referral-sub">Share your link. When a friend signs up, you both benefit.</div>
          <div className="referral-link-row">
            <input className="referral-input" value={refUrl} readOnly />
            <button className="btn-primary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={copyRef}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="referral-rewards">
            {REFERRAL_TIERS.map(tier => {
              const achieved = (refCount ?? 0) >= tier.count;
              const needed   = tier.count - (refCount ?? 0);
              return (
                <div key={tier.count} className="reward-row">
                  <span style={{ color: achieved ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                    {achieved ? '✓' : '○'}
                  </span>
                  {' '}{tier.count} {tier.count === 1 ? 'referral' : 'referrals'} — {REWARD_LABELS[tier.count]}
                  {!achieved && refCount !== null && needed > 0 && (
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}> (need {needed} more)</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Overlay>
  );
}

/* ═══════════════════════════ INTEGRATIONS ═══════════════════════════ */
export function IntegrationsPanel({ open, onClose, toast }) {
  return (
    <Overlay open={open} onClose={onClose} wide>
      <PanelHeader title="Integrations & connected apps" onClose={onClose} />
      <div className="int-list">
        {INTEGRATIONS.map(int => (
          <div key={int.id} className="int-item">
            <div className="int-logo">{int.icon}</div>
            <div className="int-info">
              <div className="int-name">{int.name}</div>
              <div className="int-desc">{int.desc}</div>
            </div>
            <div className="int-status">
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '2px 8px', whiteSpace: 'nowrap' }}>Coming soon</span>
            </div>
          </div>
        ))}
      </div>
    </Overlay>
  );
}

/* ═══════════════════════════ GDPR PANEL ═══════════════════════════ */
export function GdprPanel({ open, onClose, notes, toast }) {
  const [toggs, setToggs] = useState({ analytics: true, crash: true, marketing: false });
  const [sections, setSections] = useState({ export: true, tracking: false, deletion: false, legal: false });

  function toggleSection(k) { setSections(prev => ({ ...prev, [k]: !prev[k] })); }
  function toggleTogg(k)    { setToggs(prev    => ({ ...prev, [k]: !prev[k] })); toast(toggs[k] ? 'Disabled' : 'Enabled'); }

  function exportJson() {
    const data = notes.filter(n => !n.deleted).map(n => ({
      id: n.id, title: n.title,
      body: n.html.replace(/<[^>]+>/g, ' ').trim(),
      tags: n.tags, date: n.date, starred: n.starred,
    }));
    downloadFile(JSON.stringify(data, null, 2), 'olai-notes-export.json', 'application/json');
    toast('JSON exported');
  }

  function exportHtml() {
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Olai Notes Export</title>
<style>body{font-family:system-ui;max-width:720px;margin:40px auto;padding:0 24px;line-height:1.65;font-size:15px;}
h1{font-size:26px;font-weight:600;margin-bottom:4px;}h2{font-size:20px;margin-top:28px;}
code{background:#f0f0ee;padding:1px 5px;border-radius:3px;}hr{border:none;border-top:1px solid #ddd;margin:40px 0;}</style>
</head><body>${notes.filter(n => !n.deleted).map(n => `<h1>${n.title || 'Untitled'}</h1>${n.html}<hr>`).join('')}</body></html>`;
    downloadFile(html, 'olai-notes-export.html', 'text/html');
    toast('HTML exported');
  }

  return (
    <Overlay open={open} onClose={onClose} wide>
      <PanelHeader title="Privacy & data controls" onClose={onClose} />
      <div className="gdpr-body">
        {[
          { key: 'export', label: 'Export your data', icon: 'ti-download' },
          { key: 'tracking', label: 'Tracking & analytics', icon: 'ti-eye' },
          { key: 'deletion', label: 'Account deletion', icon: 'ti-user-x' },
          { key: 'legal', label: 'Legal documents', icon: 'ti-file-description' },
        ].map(({ key, label, icon }) => (
          <div key={key} className="gdpr-section">
            <div className="gdpr-section-hdr" onClick={() => toggleSection(key)}>
              <span className="gdpr-section-title"><i className={`ti ${icon}`} /> {label}</span>
              <i className={`ti ti-chevron-${sections[key] ? 'up' : 'down'}`} style={{ color: 'var(--text-tertiary)', fontSize: 12 }} />
            </div>
            {sections[key] && (
              <div className="gdpr-section-body">
                {key === 'export' && (
                  <>
                    <p className="gdpr-desc">Download a complete copy of your notes in open formats.</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn-secondary" style={{ fontSize: 12 }} onClick={exportJson}>
                        <i className="ti ti-file-code" /> Export as JSON
                      </button>
                      <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => toast('ZIP download started')}>
                        <i className="ti ti-file-zip" /> Export as ZIP
                      </button>
                      <button className="btn-secondary" style={{ fontSize: 12 }} onClick={exportHtml}>
                        <i className="ti ti-file-text" /> Export as HTML
                      </button>
                    </div>
                  </>
                )}
                {key === 'tracking' && (
                  <>
                    {[['analytics','Product analytics'],['crash','Crash reporting'],['marketing','Email marketing (Do Not Sell)']].map(([k,lbl]) => (
                      <div key={k} className="gdpr-toggle-row">
                        <span style={{ fontSize: 12 }}>{lbl}</span>
                        <button className={`toggle${toggs[k] ? ' on' : ''}`} onClick={() => toggleTogg(k)} />
                      </div>
                    ))}
                  </>
                )}
                {key === 'deletion' && (
                  <>
                    <p className="gdpr-desc">Permanently delete your account and all data. Export first — this cannot be undone.</p>
                    <button className="btn-danger" style={{ fontSize: 12 }} onClick={() => toast('Account deletion requested — check email to confirm', 'warn')}>
                      <i className="ti ti-trash" /> Delete my account
                    </button>
                  </>
                )}
                {key === 'legal' && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Privacy Policy',    href: '/privacy' },
                      { label: 'Terms of Service',  href: '/terms' },
                      { label: 'Cookie Policy',     href: '/privacy#cookies' },
                      { label: 'GDPR / CCPA Rights',href: '/privacy#gdpr' },
                    ].map(({ label, href }) => (
                      <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: 12, textDecoration: 'none' }}>{label}</a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Overlay>
  );
}

/* ═══════════════════════════ ONBOARDING ═══════════════════════════ */
const OB_KEY = 'olai-onboarding';
function loadObDone() {
  try { return JSON.parse(localStorage.getItem(OB_KEY)) || []; } catch { return []; }
}
function saveObDone(indices) {
  localStorage.setItem(OB_KEY, JSON.stringify(indices));
}

export function OnboardingPanel({ open, onClose, toast }) {
  const [steps, setSteps] = useState(() => {
    const done = loadObDone();
    return ONBOARDING_STEPS.map((s, i) => ({ ...s, done: done.includes(i) }));
  });

  const done = steps.filter(s => s.done).length;
  const pct  = (done / steps.length) * 100;

  function toggleStep(i) {
    const next = steps.map((s, j) => j === i ? { ...s, done: !s.done } : s);
    setSteps(next);
    saveObDone(next.map((s, j) => s.done ? j : -1).filter(j => j >= 0));
    if (!steps[i].done) toast('Step completed!');
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <PanelHeader title="Getting started" onClose={onClose} />
      <div className="ob-body">
        <div className="ob-welcome">
          <div style={{ fontSize: 36, marginBottom: 10 }}>✦</div>
          <div className="ob-title">Welcome to Olai Notes</div>
          <div className="ob-sub">Complete these steps to discover the core features.</div>
        </div>
        <div className="ob-progress"><div className="ob-prog-fill" style={{ width: `${pct}%` }} /></div>
        {steps.map((s, i) => (
          <div key={i} className={`ob-step${s.done ? ' done' : ''}`} onClick={() => toggleStep(i)}>
            <div className="ob-step-icon">{s.done ? '✓' : s.ic}</div>
            <div>
              <div className="ob-step-title">{s.title}</div>
              <div className="ob-step-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="ob-footer">
        <button className="btn-secondary" style={{ fontSize: 12 }} onClick={onClose}>Skip for now</button>
        <button className="btn-primary"   style={{ fontSize: 12 }} onClick={() => {
          const next = steps.map(s => ({ ...s, done: true }));
          setSteps(next);
          saveObDone(next.map((_, i) => i));
          setTimeout(() => { onClose(); toast('Setup complete! 🎉'); }, 300);
        }}>Finish setup</button>
      </div>
    </Overlay>
  );
}

/* ═══════════════════════════ AUTH ═══════════════════════════ */
export function AuthScreen({ onAuth }) {
  const [screen, setScreen] = useState('signin'); // signin | signup | magic | magicsent | forgot | resetsent
  const [email,  setEmail]  = useState('');
  const [pass,   setPass]   = useState('');
  const [name,   setName]   = useState('');
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [pwStrength, setPwStrength] = useState(0);
  const [magicEmail, setMagicEmail] = useState('');

  function validate() {
    const e = {};
    if (!email || !/\S+@\S+\.\S+/.test(email)) e.email = 'Valid email required';
    if (screen === 'signup' && !name.trim()) e.name = 'Name is required';
    if (pass.length < 6) e.pass = screen === 'signup' ? 'Min 8 characters' : 'Password required';
    setErrors(e); return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      let user;
      if (screen === 'signup') {
        user = await signUpWithEmail(name, email, pass);
      } else {
        user = await signInWithEmail(email, pass);
      }
      onAuth(user);
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Incorrect email or password'
        : err.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists'
        : err.message || 'Something went wrong';
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth() {
    setLoading(true);
    setErrors({});
    try {
      const user = await signInWithGoogle();
      onAuth(user);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrors({ form: err.message || 'Google sign-in failed' });
      }
    } finally {
      setLoading(false);
    }
  }

  async function sendMagic() {
    if (!/\S+@\S+\.\S+/.test(magicEmail)) { setErrors({ magic: 'Valid email required' }); return; }
    setLoading(true);
    setErrors({});
    try {
      await sendMagicLink(magicEmail);
      setScreen('magicsent');
    } catch (err) {
      setErrors({ magic: err.message || 'Failed to send magic link' });
    } finally {
      setLoading(false);
    }
  }

  async function sendReset() {
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setErrors({ email: 'Valid email required' }); return; }
    setLoading(true);
    setErrors({});
    try {
      await sendPasswordReset(email);
      setScreen('resetsent');
    } catch (err) {
      setErrors({ email: err.message || 'Failed to send reset email' });
    } finally {
      setLoading(false);
    }
  }

  const googleSvg = (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  return (
    <div className="auth-root">
      <div className="auth-left">
        <div>
          <div className="auth-wordmark">Olai Notes</div>
          <div className="auth-tagline">Capture what matters.</div>
        </div>
        <div className="auth-timeline">
          {[['Wikilinks + knowledge graph','New'],['End-to-end encryption','2026'],['Real-time collaboration','2026'],['Offline-first sync','2025']].map(([txt,yr]) => (
            <div key={yr+txt} className="auth-tl-item">
              <div className="auth-tl-dot" />
              <div><div className="auth-tl-text">{txt}</div><div className="auth-tl-year">{yr}</div></div>
            </div>
          ))}
        </div>
        <div className="auth-footer-text">© {new Date().getFullYear()} Olai Notes · <a href="/privacy" style={{ color: 'inherit' }}>Privacy</a> · <a href="/terms" style={{ color: 'inherit' }}>Terms</a></div>
      </div>

      <div className="auth-right">
        {/* SIGN IN */}
        {screen === 'signin' && (
          <div className="auth-form">
            <div className="auth-form-title">Welcome back</div>
            <div className="auth-form-sub">Sign in to your Olai Notes account</div>
            <button className="btn-oauth" onClick={handleOAuth} disabled={loading}>{googleSvg} Continue with Google</button>
            <div className="auth-divider"><div className="auth-div-line"/><span>or sign in with email</span><div className="auth-div-line"/></div>
            {errors.form && <div className="field-error" style={{ marginBottom: 8 }}>{errors.form}</div>}
            <div className="auth-field">
              <label>Email</label>
              <input className={`field-input${errors.email ? ' error' : ''}`} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>
            <div className="auth-field">
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                Password
                <button className="auth-link-btn" onClick={() => setScreen('forgot')}>Forgot password?</button>
              </label>
              <input className={`field-input${errors.pass ? ' error' : ''}`} type="password" placeholder="Your password" value={pass} onChange={e => setPass(e.target.value)} autoComplete="current-password" onKeyDown={e => e.key === 'Enter' && submit()} />
              {errors.pass && <div className="field-error">{errors.pass}</div>}
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: 10, marginTop: 4 }} onClick={submit} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <div className="auth-switch">Don't have an account? <button className="auth-link-btn" onClick={() => setScreen('signup')}>Create one free</button></div>
            <div className="auth-switch"><button className="auth-link-btn" onClick={() => setScreen('magic')}>Sign in with magic link →</button></div>
          </div>
        )}

        {/* SIGN UP */}
        {screen === 'signup' && (
          <div className="auth-form">
            <div className="auth-form-title">Create your account</div>
            <div className="auth-form-sub">Free forever — no credit card required</div>
            <button className="btn-oauth" onClick={handleOAuth} disabled={loading}>{googleSvg} Sign up with Google</button>
            <div className="auth-divider"><div className="auth-div-line"/><span>or with email</span><div className="auth-div-line"/></div>
            {errors.form && <div className="field-error" style={{ marginBottom: 8 }}>{errors.form}</div>}
            <div className="auth-field">
              <label>Full name</label>
              <input className={`field-input${errors.name ? ' error' : ''}`} type="text" placeholder="Ada Lovelace" value={name} onChange={e => setName(e.target.value)} />
              {errors.name && <div className="field-error">{errors.name}</div>}
            </div>
            <div className="auth-field">
              <label>Email</label>
              <input className={`field-input${errors.email ? ' error' : ''}`} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input className={`field-input${errors.pass ? ' error' : ''}`} type="password" placeholder="At least 8 characters" value={pass} onChange={e => { setPass(e.target.value); const l = e.target.value.length; setPwStrength(l === 0 ? 0 : l < 6 ? 20 : l < 10 ? 50 : l < 14 ? 75 : 100); }} onKeyDown={e => e.key === 'Enter' && submit()} />
              {pass.length > 0 && (
                <div className="pw-bar"><div className="pw-fill" style={{ width: `${pwStrength}%`, background: pwStrength < 40 ? 'var(--destructive)' : pwStrength < 70 ? 'var(--warn)' : 'var(--accent)' }} /></div>
              )}
              {errors.pass && <div className="field-error">{errors.pass}</div>}
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: 10, marginTop: 4 }} onClick={submit} disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
            <div className="auth-switch">Already have an account? <button className="auth-link-btn" onClick={() => setScreen('signin')}>Sign in</button></div>
          </div>
        )}

        {/* MAGIC LINK */}
        {screen === 'magic' && (
          <div className="auth-form">
            <div className="auth-form-title">Magic link</div>
            <div className="auth-form-sub">We'll email you a one-click sign-in link — no password needed.</div>
            <div className="auth-field">
              <label>Email</label>
              <input className={`field-input${errors.magic ? ' error' : ''}`} type="email" placeholder="you@example.com" value={magicEmail} onChange={e => setMagicEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMagic()} />
              {errors.magic && <div className="field-error">{errors.magic}</div>}
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: 10 }} onClick={sendMagic} disabled={loading}>{loading ? 'Sending…' : 'Send magic link'}</button>
            <div className="auth-switch"><button className="auth-link-btn" onClick={() => setScreen('signin')}>← Back to sign in</button></div>
          </div>
        )}

        {/* MAGIC SENT */}
        {screen === 'magicsent' && (
          <div className="auth-form" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>✉️</div>
            <div className="auth-form-title">Check your inbox</div>
            <div className="auth-form-sub">We sent a sign-in link to<br /><strong>{magicEmail}</strong><br />It expires in 15 minutes.</div>
            <button className="btn-secondary" style={{ width: '100%', marginTop: 16 }} onClick={() => setScreen('magic')}>← Use a different email</button>
          </div>
        )}

        {/* FORGOT */}
        {screen === 'forgot' && (
          <div className="auth-form">
            <div className="auth-form-title">Reset password</div>
            <div className="auth-form-sub">Enter your email and we'll send a reset link.</div>
            <div className="auth-field">
              <label>Email</label>
              <input className={`field-input${errors.email ? ' error' : ''}`} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendReset()} />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: 10 }} onClick={sendReset} disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</button>
            <div className="auth-switch"><button className="auth-link-btn" onClick={() => setScreen('signin')}>← Back to sign in</button></div>
          </div>
        )}

        {/* RESET SENT */}
        {screen === 'resetsent' && (
          <div className="auth-form" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🔑</div>
            <div className="auth-form-title">Reset link sent</div>
            <div className="auth-form-sub">Check your email. If it doesn't appear within a few minutes, check your spam folder.</div>
            <button className="btn-secondary" style={{ width: '100%', marginTop: 16 }} onClick={() => setScreen('signin')}>← Back to sign in</button>
          </div>
        )}
      </div>
    </div>
  );
}
