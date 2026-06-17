import React, { useState, useEffect, useRef } from 'react';
import './CommandPalette.css';

const COMMANDS = [
  { icon: 'ti-plus',           label: 'New note',              kbd: '⌘N',  id: 'new' },
  { icon: 'ti-topology-star',  label: 'Knowledge graph',       kbd: '',    id: 'graph' },
  { icon: 'ti-pencil',         label: 'Sketch canvas',         kbd: '',    id: 'sketch' },
  { icon: 'ti-trophy',         label: 'Achievements',          kbd: '',    id: 'gamif' },
  { icon: 'ti-plug',           label: 'Integrations',          kbd: '',    id: 'integrations' },
  { icon: 'ti-shield',         label: 'Admin panel',           kbd: '',    id: 'admin' },
  { icon: 'ti-lock',           label: 'Privacy & data (GDPR)', kbd: '',    id: 'gdpr' },
  { icon: 'ti-star',           label: 'Star / unstar note',    kbd: '⌘D',  id: 'star' },
  { icon: 'ti-moon',           label: 'Toggle dark mode',      kbd: '',    id: 'dark' },
  { icon: 'ti-layout-sidebar', label: 'Toggle sidebar',        kbd: '⌘\\', id: 'sidebar' },
  { icon: 'ti-download',       label: 'Export note',           kbd: '',    id: 'export' },
];

export default function CommandPalette({ open, notes, onClose, onCommand }) {
  const [query, setQuery]   = useState('');
  const [focus, setFocus]   = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) { setQuery(''); setFocus(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);

  const filteredCmds  = COMMANDS.filter(c => !query || c.label.toLowerCase().includes(query.toLowerCase()));
  const filteredNotes = notes
    .filter(n => !n.deleted && (!query || n.title.toLowerCase().includes(query.toLowerCase()) || n.html.replace(/<[^>]+>/g,'').toLowerCase().includes(query.toLowerCase())))
    .slice(0, 5);

  const allItems = [
    ...filteredCmds.map(c  => ({ type: 'cmd',  ...c })),
    ...filteredNotes.map(n => ({ type: 'note', id: n.id, label: n.title || 'Untitled', sub: n.html.replace(/<[^>]+>/g,' ').trim().slice(0,55), starred: n.starred })),
  ];

  function handleSelect(item) {
    if (item.type === 'cmd')  onCommand(item.id);
    if (item.type === 'note') onCommand('open-note', item.id);
    onClose();
  }

  function handleKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocus(f => Math.min(f + 1, allItems.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocus(f => Math.max(f - 1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); if (allItems[focus]) handleSelect(allItems[focus]); }
    if (e.key === 'Escape')    onClose();
  }

  if (!open) return null;

  return (
    <div className="overlay-backdrop open" onClick={onClose}>
      <div className="panel palette-panel" onClick={e => e.stopPropagation()}>
        <div className="pal-input-row">
          <i className="ti ti-search pal-search-ic" />
          <input
            ref={inputRef}
            className="pal-input"
            value={query}
            onChange={e => { setQuery(e.target.value); setFocus(0); }}
            onKeyDown={handleKey}
            placeholder="Search or jump to…"
            autoComplete="off"
          />
          <span className="pal-esc" onClick={onClose}>esc</span>
        </div>

        <div className="pal-results">
          {allItems.length === 0 && (
            <div className="pal-empty">No results for "{query}"</div>
          )}

          {filteredCmds.length > 0 && (
            <>
              <div className="pal-section-label">Actions</div>
              {filteredCmds.map((cmd, i) => {
                const idx = i;
                return (
                  <div
                    key={cmd.id}
                    className={`pal-item${idx === focus ? ' focused' : ''}`}
                    onClick={() => handleSelect({ type: 'cmd', ...cmd })}
                    onMouseEnter={() => setFocus(idx)}
                  >
                    <div className="pal-item-left">
                      <i className={`ti ${cmd.icon} pal-item-icon`} />
                      <span className="pal-item-label">{cmd.label}</span>
                    </div>
                    {cmd.kbd && <span className="pal-item-kbd">{cmd.kbd}</span>}
                  </div>
                );
              })}
            </>
          )}

          {filteredNotes.length > 0 && (
            <>
              <div className="pal-section-label">Notes</div>
              {filteredNotes.map((n, i) => {
                const idx = filteredCmds.length + i;
                const preview = n.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 55);
                return (
                  <div
                    key={n.id}
                    className={`pal-item${idx === focus ? ' focused' : ''}`}
                    onClick={() => handleSelect({ type: 'note', id: n.id })}
                    onMouseEnter={() => setFocus(idx)}
                  >
                    <div className="pal-item-left">
                      <i className="ti ti-file-text pal-item-icon" />
                      <div>
                        <div className="pal-item-label">{n.title || 'Untitled'}</div>
                        <div className="pal-item-sub">{preview || '—'}</div>
                      </div>
                    </div>
                    {n.starred && <span style={{ color: '#D4A017', fontSize: 12 }}>★</span>}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
