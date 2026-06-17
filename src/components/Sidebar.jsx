import React, { useState } from 'react';
import './Sidebar.css';

export default function Sidebar({
  collapsed, notes, spaces, filter, onSetFilter,
  activeNoteId, onOpenNote, onOpenSpaceManager,
}) {
  const [activeSpace, setActiveSpace] = useState(null);
  const allTags = [...new Set(notes.filter(n => !n.deleted).flatMap(n => n.tags))].sort();
  const alive = notes.filter(n => !n.deleted);

  function handleSpaceClick(sid) {
    if (activeSpace === sid) {
      setActiveSpace(null);
      onSetFilter('all');
    } else {
      setActiveSpace(sid);
      onSetFilter(sid);
    }
  }

  return (
    <nav className={`app-sidebar${collapsed ? ' collapsed' : ''}`} aria-label="Sidebar">
      <div className="sb-scroll">
        {/* Library */}
        <div className="sb-section">
          <span className="sb-label">Library</span>
          <SbItem icon="ti-notes" label="All Notes" count={alive.length}
            active={filter === 'all'} onClick={() => { setActiveSpace(null); onSetFilter('all'); }} />
          <SbItem icon="ti-star" label="Starred" count={alive.filter(n => n.starred).length}
            active={filter === 'starred'} onClick={() => { setActiveSpace(null); onSetFilter('starred'); }} />
          <SbItem icon="ti-link" label="Linked" count={alive.filter(n => n.tags.includes('graph') || n.html.includes('wikilink')).length}
            active={filter === 'linked'} onClick={() => { setActiveSpace(null); onSetFilter('linked'); }} />
          <SbItem icon="ti-trash" label="Trash" count={notes.filter(n => n.deleted).length}
            active={filter === 'trash'} onClick={() => { setActiveSpace(null); onSetFilter('trash'); }} />
        </div>

        <div className="sb-divider" />

        {/* Spaces */}
        <div className="sb-section">
          <span className="sb-label">
            Spaces
            <span className="sb-label-add" onClick={onOpenSpaceManager} title="Manage spaces">+</span>
          </span>
          {spaces.map(sp => {
            const spNotes = alive.filter(n => n.spaceId === sp.id);
            const isOpen = activeSpace === sp.id;
            return (
              <div key={sp.id}>
                <div className={`sp-row${isOpen ? ' active' : ''}`} onClick={() => handleSpaceClick(sp.id)}>
                  <span className="sp-icon">{sp.icon}</span>
                  <span className="sp-name">{sp.name}</span>
                  <span className="sb-count">{spNotes.length}</span>
                  <span className="sp-chevron">{isOpen ? '▾' : '▸'}</span>
                </div>
                {isOpen && (
                  <div className="sp-children">
                    {spNotes.slice(0, 6).map(n => (
                      <div key={n.id} className={`sp-note-item${n.id === activeNoteId ? ' active' : ''}`}
                        onClick={() => onOpenNote(n.id)}>
                        <i className="ti ti-file-text" />
                        {n.title || 'Untitled'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="sb-divider" />

        {/* Tags */}
        <div className="sb-section">
          <span className="sb-label">Tags</span>
          <div className="sb-tags">
            {allTags.map(tag => (
              <span key={tag} className="tag-pill" onClick={() => onSetFilter(`tag:${tag}`)}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

function SbItem({ icon, label, count, active, onClick }) {
  return (
    <div className={`sb-nav-item${active ? ' active' : ''}`} onClick={onClick}>
      <span className="sb-nav-left">
        <i className={`ti ${icon}`} />
        <span>{label}</span>
      </span>
      <span className="sb-count">{count}</span>
    </div>
  );
}
