import React, { useState, useCallback, useEffect } from 'react';
import { formatDate, groupLabel } from '../lib/store.js';
import './NoteList.css';

export default function NoteList({
  notes, spaces, filter, searchQuery, activeNoteId, mobileActive,
  onOpenNote, onNewNote, onDuplicate, onDelete, onToggleStar, onMoveToSpace,
}) {
  const [ctx, setCtx] = useState({ open: false, x: 0, y: 0, noteId: null });

  const filtered = filteredNotes(notes, filter, searchQuery);

  // Close context menu on click outside
  useEffect(() => {
    function close() { setCtx(c => ({ ...c, open: false })); }
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  function openCtx(e, noteId) {
    e.preventDefault();
    e.stopPropagation();
    setCtx({ open: true, x: e.clientX, y: e.clientY, noteId });
  }

  const ctxNote = notes.find(n => n.id === ctx.noteId);

  function hl(text) {
    if (!searchQuery) return text;
    const re = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(re, '<mark>$1</mark>');
  }

  const title =
    filter === 'trash' ? 'Trash' :
    filter === 'starred' ? 'Starred' :
    filter === 'linked' ? 'Linked' :
    filter.startsWith('tag:') ? `#${filter.slice(4)}` :
    spaces.find(s => s.id === filter)?.name || 'All Notes';

  return (
    <>
      <section className={`app-notelist${mobileActive ? ' mobile-active' : ''}`} aria-label="Note list">
        <div className="nl-header">
          <span className="nl-title">{title}</span>
          <button className="nl-new-btn" onClick={onNewNote} title="New note (⌘N)" aria-label="New note">
            <i className="ti ti-plus" />
          </button>
        </div>

        <div className="nl-scroll">
          {filtered.length === 0 ? (
            <EmptyState filter={filter} searchQuery={searchQuery} onNewNote={onNewNote} />
          ) : (
            renderGrouped(filtered, activeNoteId, openCtx, onOpenNote, onToggleStar, hl)
          )}
        </div>
      </section>

      {/* Context menu */}
      {ctx.open && ctxNote && (
        <div
          className="context-menu open"
          style={{ left: ctx.x, top: ctx.y }}
          onClick={e => e.stopPropagation()}
        >
          <div className="ctx-section-label">Note actions</div>
          <div className="ctx-item" onClick={() => { onOpenNote(ctx.noteId); setCtx(c => ({ ...c, open: false })); }}>
            <i className="ti ti-arrow-right" /> Open
          </div>
          {!ctxNote.deleted && <>
            <div className="ctx-item" onClick={() => { onDuplicate(ctx.noteId); setCtx(c => ({ ...c, open: false })); }}>
              <i className="ti ti-copy" /> Duplicate
            </div>
            <div className="ctx-item" onClick={() => { onToggleStar(ctx.noteId); setCtx(c => ({ ...c, open: false })); }}>
              <i className="ti ti-star" /> {ctxNote.starred ? 'Unstar' : 'Star'}
            </div>
            <div className="ctx-separator" />
            <div className="ctx-section-label">Move to space</div>
            {spaces.map(sp => (
              <div key={sp.id} className="ctx-item"
                onClick={() => { onMoveToSpace(ctx.noteId, sp.id); setCtx(c => ({ ...c, open: false })); }}>
                <i className="ti ti-folder" /> {sp.name}
              </div>
            ))}
            <div className="ctx-item"
              onClick={() => { onMoveToSpace(ctx.noteId, null); setCtx(c => ({ ...c, open: false })); }}>
              <i className="ti ti-folder-off" /> No space
            </div>
            <div className="ctx-separator" />
          </>}
          {ctxNote.deleted ? (
            <div className="ctx-item" onClick={() => { onDelete(ctx.noteId, 'restore'); setCtx(c => ({ ...c, open: false })); }}>
              <i className="ti ti-arrow-back-up" /> Restore
            </div>
          ) : (
            <div className="ctx-item danger" onClick={() => { onDelete(ctx.noteId, 'soft'); setCtx(c => ({ ...c, open: false })); }}>
              <i className="ti ti-trash" /> Delete
            </div>
          )}
        </div>
      )}
    </>
  );
}

function renderGrouped(notes, activeId, openCtx, onOpenNote, onToggleStar, hl) {
  const rows = [];
  let lastGroup = '';
  notes.forEach(n => {
    const g = groupLabel(n.date);
    if (g !== lastGroup) {
      rows.push(<div key={`g-${g}`} className="nl-group">{g}</div>);
      lastGroup = g;
    }
    const preview = n.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 70);
    rows.push(
      <div
        key={n.id}
        className={`note-row${n.id === activeId ? ' active' : ''}`}
        onClick={() => onOpenNote(n.id)}
        onContextMenu={e => openCtx(e, n.id)}
        role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onOpenNote(n.id)}
      >
        <div className="nr-top">
          <span className="nr-title" dangerouslySetInnerHTML={{ __html: hl(n.title || 'Untitled') }} />
          <button
            className={`nr-star${n.starred ? ' on' : ''}`}
            onClick={e => { e.stopPropagation(); onToggleStar(n.id); }}
            aria-label={n.starred ? 'Unstar' : 'Star'}
          >★</button>
          <span className="nr-date">{formatDate(n.date)}</span>
        </div>
        <div className="nr-preview" dangerouslySetInnerHTML={{ __html: n.deleted ? '<em>In Trash</em>' : hl(preview) || '—' }} />
        {n.tags.length > 0 && !n.deleted && (
          <div className="nr-tags">
            {n.tags.map(t => <span key={t} className="nr-tag">{t}</span>)}
          </div>
        )}
      </div>
    );
  });
  return rows;
}

function EmptyState({ filter, searchQuery, onNewNote }) {
  const inTrash = filter === 'trash';
  return (
    <div className="nl-empty">
      <div className="nl-empty-icon">{inTrash ? '🗑' : searchQuery ? '🔍' : '📄'}</div>
      <div className="nl-empty-title">
        {inTrash ? 'Trash is empty' : searchQuery ? `No results for "${searchQuery}"` : 'No notes yet'}
      </div>
      <div className="nl-empty-sub">
        {inTrash ? 'Deleted notes appear here' : searchQuery ? 'Try a different search term' : 'Click + to create your first note'}
      </div>
      {!inTrash && !searchQuery && (
        <button className="btn-primary" style={{ marginTop: 14 }} onClick={onNewNote}>
          Create first note
        </button>
      )}
    </div>
  );
}

function filteredNotes(notes, filter, search) {
  let list = [...notes].sort((a, b) => b.date - a.date);
  if (filter === 'trash') return list.filter(n => n.deleted);
  list = list.filter(n => !n.deleted);
  if (filter === 'starred') list = list.filter(n => n.starred);
  else if (filter === 'linked') list = list.filter(n => n.html.includes('wikilink'));
  else if (filter.startsWith('tag:')) { const t = filter.slice(4); list = list.filter(n => n.tags.includes(t)); }
  else if (filter !== 'all') list = list.filter(n => n.spaceId === filter);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.html.replace(/<[^>]+>/g, '').toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  return list;
}
