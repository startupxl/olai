import React, { useState, useEffect, useCallback } from 'react';
import Header        from './components/Header.jsx';
import Sidebar       from './components/Sidebar.jsx';
import NoteList      from './components/NoteList.jsx';
import Editor        from './components/Editor.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import {
  GraphPanel, SketchPanel, GamificationPanel,
  IntegrationsPanel, AdminPanel, GdprPanel,
  OnboardingPanel, AuthScreen,
} from './components/Panels.jsx';
import { useNotes }  from './hooks/useNotes.js';
import { useToast }  from './hooks/useToast.js';
import { onAuthChanged, signOut } from './lib/firebaseAuth.js';
import { htmlToMarkdown, downloadFile } from './lib/store.js';
import './styles/globals.css';

export default function App() {
  const toast = useToast();

  // ── Auth — driven by Firebase onAuthStateChanged ──
  const [user,       setUser]       = useState(null);
  const [authed,     setAuthed]     = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChanged(u => {
      setUser(u);
      setAuthed(!!u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // ── Theme — persisted to localStorage ──
  const [dark, setDark] = useState(() => localStorage.getItem('olai-dark') === 'true');

  // ── Layout ──
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'sidebar' | 'list' | 'editor'

  // ── Notes state — Firestore-backed, keyed to current user ──
  const {
    notes, spaces,
    createNote, updateNote, softDelete, restoreNote, duplicateNote,
    toggleStar, addTag, removeTag, moveToSpace,
    createSpace, deleteSpace,
  } = useNotes(user?.uid);

  const [activeNoteId, setActiveNoteId] = useState(notes[0]?.id || null);
  const [filter,       setFilter]       = useState('all');
  const [searchQuery,  setSearchQuery]  = useState('');

  // ── Panels ──
  const [panels, setPanels] = useState({
    palette: false, graph: false, sketch: false,
    gamif: false, integrations: false, admin: false,
    gdpr: false, onboarding: false,
  });

  function openPanel(k)  { setPanels(p => ({ ...p, [k]: true })); }
  function closePanel(k) { setPanels(p => ({ ...p, [k]: false })); }

  // ── Dark mode — sync to DOM + localStorage ──
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : '';
    localStorage.setItem('olai-dark', dark);
  }, [dark]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    function handler(e) {
      const mod = e.metaKey || e.ctrlKey;
      const inInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
      const inEditor = document.activeElement?.getAttribute('contenteditable') === 'true';

      if (mod && e.key === 'k') { e.preventDefault(); openPanel('palette'); }
      if (mod && e.key === 'n' && !inInput && !inEditor) { e.preventDefault(); handleNewNote(); }
      if (mod && e.key === 'd') { e.preventDefault(); if (activeNoteId) toggleStar(activeNoteId); }
      if (mod && e.key === '\\') { e.preventDefault(); setSidebarCollapsed(v => !v); }
      if (e.key === 'Escape') { setPanels(p => Object.fromEntries(Object.keys(p).map(k => [k, false]))); }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeNoteId]);

  // ── Actions ──
  function handleNewNote() {
    const n = createNote();
    setActiveNoteId(n.id);
    if (window.innerWidth <= 640) setMobileView('editor');
  }

  function handleOpenNote(id) {
    setActiveNoteId(id);
    if (window.innerWidth <= 640) setMobileView('editor');
  }

  function handleDelete(id, action) {
    if (action === 'soft') {
      softDelete(id);
      toast('Note moved to Trash', 'warn');
      const alive = notes.filter(n => !n.deleted && n.id !== id);
      if (activeNoteId === id && alive.length) setActiveNoteId(alive[0].id);
    } else if (action === 'restore') {
      restoreNote(id);
      toast('Note restored');
    }
  }

  function handleDuplicate(id) {
    const dup = duplicateNote(id);
    if (dup) { setActiveNoteId(dup.id); toast('Note duplicated'); }
  }

  function handlePaletteCommand(cmd, noteId) {
    switch (cmd) {
      case 'new':          handleNewNote(); break;
      case 'graph':        openPanel('graph'); break;
      case 'sketch':       openPanel('sketch'); break;
      case 'gamif':        openPanel('gamif'); break;
      case 'integrations': openPanel('integrations'); break;
      case 'admin':        openPanel('admin'); break;
      case 'gdpr':         openPanel('gdpr'); break;
      case 'dark':         setDark(d => !d); break;
      case 'sidebar':      setSidebarCollapsed(v => !v); break;
      case 'star':         if (activeNoteId) toggleStar(activeNoteId); break;
      case 'export':       handleExport(); break;
      case 'open-note':    if (noteId) handleOpenNote(noteId); break;
    }
  }

  function handleExport() {
    const n = notes.find(x => x.id === activeNoteId);
    if (!n) return;
    const md = `# ${n.title}\n\n${htmlToMarkdown(n.html)}`;
    downloadFile(md, `${(n.title || 'note').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`, 'text/markdown');
    toast('Note exported as Markdown');
  }

  function handleSketchInsert(dataUrl) {
    const n = notes.find(x => x.id === activeNoteId);
    if (!n) return;
    const img = `<figure style="margin:12px 0;"><img src="${dataUrl}" style="max-width:100%;border-radius:4px;border:1px solid var(--border);" alt="Sketch" /></figure>`;
    updateNote(n.id, { html: n.html + img });
    toast('Sketch inserted into note');
  }

  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  // ── Auth ──
  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-tertiary)', fontSize: 13 }}>
        Loading…
      </div>
    );
  }
  if (!authed) {
    return (
      <AuthScreen
        onAuth={u => {
          setUser(u);
          setAuthed(true);
          openPanel('onboarding');
          toast(`Welcome, ${u.name.split(' ')[0]}! 👋`);
        }}
      />
    );
  }

  return (
    <div className="app-root">
      <Header
        dark={dark}
        onToggleDark={() => setDark(d => !d)}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(v => !v)}
        user={user}
        onSignOut={() => signOut()}
        onOpenGraph={() => openPanel('graph')}
        onOpenSketch={() => openPanel('sketch')}
        onOpenGamif={() => openPanel('gamif')}
        onOpenIntegrations={() => openPanel('integrations')}
        onOpenAdmin={() => openPanel('admin')}
        onOpenGdpr={() => openPanel('gdpr')}
        onOpenPalette={() => openPanel('palette')}
        searchQuery={searchQuery}
        onSearch={q => { setSearchQuery(q); setFilter('all'); }}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileActive={mobileView === 'sidebar'}
          notes={notes}
          spaces={spaces}
          filter={filter}
          onSetFilter={f => { setFilter(f); setSearchQuery(''); setMobileView('list'); }}
          activeNoteId={activeNoteId}
          onOpenNote={handleOpenNote}
          onOpenSpaceManager={() => {/* handled in sidebar */}}
        />

        <NoteList
          notes={notes}
          spaces={spaces}
          filter={filter}
          searchQuery={searchQuery}
          activeNoteId={activeNoteId}
          mobileActive={mobileView === 'list'}
          onOpenNote={handleOpenNote}
          onNewNote={handleNewNote}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onToggleStar={toggleStar}
          onMoveToSpace={moveToSpace}
        />

        <Editor
          note={activeNote}
          notes={notes}
          mobileActive={mobileView === 'editor'}
          onUpdate={updateNote}
          onToggleStar={toggleStar}
          onAddTag={addTag}
          onRemoveTag={removeTag}
        />
      </div>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {[
          { view: 'sidebar', icon: 'ti-layout-sidebar', label: 'Spaces' },
          { view: 'list',    icon: 'ti-notes',          label: 'Notes'  },
          { view: 'editor',  icon: 'ti-edit',           label: 'Editor' },
        ].map(({ view, icon, label }) => (
          <button key={view} className={`mobile-nav-btn${mobileView === view ? ' active' : ''}`}
            onClick={() => setMobileView(view)}>
            <i className={`ti ${icon}`} />
            {label}
          </button>
        ))}
        <button className="mobile-nav-btn" onClick={handleNewNote}>
          <i className="ti ti-plus" />New
        </button>
        <button className="mobile-nav-btn" onClick={() => openPanel('palette')}>
          <i className="ti ti-search" />Search
        </button>
      </nav>

      {/* All panels */}
      <CommandPalette
        open={panels.palette}
        notes={notes}
        onClose={() => closePanel('palette')}
        onCommand={handlePaletteCommand}
      />
      <GraphPanel
        open={panels.graph}
        onClose={() => closePanel('graph')}
        notes={notes.filter(n => !n.deleted)}
        activeNoteId={activeNoteId}
        onOpenNote={handleOpenNote}
      />
      <SketchPanel
        open={panels.sketch}
        onClose={() => closePanel('sketch')}
        onInsert={handleSketchInsert}
      />
      <GamificationPanel
        open={panels.gamif}
        onClose={() => closePanel('gamif')}
        noteCount={notes.filter(n => !n.deleted).length}
        toast={toast}
        user={user}
      />
      <IntegrationsPanel
        open={panels.integrations}
        onClose={() => closePanel('integrations')}
        toast={toast}
      />
      <AdminPanel
        open={panels.admin}
        onClose={() => closePanel('admin')}
        notes={notes}
        toast={toast}
      />
      <GdprPanel
        open={panels.gdpr}
        onClose={() => closePanel('gdpr')}
        notes={notes}
        toast={toast}
      />
      <OnboardingPanel
        open={panels.onboarding}
        onClose={() => closePanel('onboarding')}
        toast={toast}
      />
    </div>
  );
}
