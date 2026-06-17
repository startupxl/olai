import React, { useEffect, useRef, useState, useCallback } from 'react';
import { wordCount, getBacklinks } from '../lib/store.js';
import './Editor.css';

export default function Editor({
  note, notes, onUpdate, onToggleStar,
  onAddTag, onRemoveTag,
}) {
  const editorRef = useRef(null);
  const titleRef = useRef(null);
  const saveTimer = useRef(null);
  const linkPopupRef = useRef(null);
  const wikiPopupRef = useRef(null);
  const linkRangeRef = useRef(null);

  const [wc, setWc] = useState(0);
  const [saveStatus, setSaveStatus] = useState('—');
  const [linkPopupOpen, setLinkPopupOpen] = useState(false);
  const [linkMode, setLinkMode] = useState('insert'); // 'insert' | 'edit'
  const [linkUrl, setLinkUrl] = useState('');
  const [linkPos, setLinkPos] = useState({ top: 0, left: 0 });
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [wikiOpen, setWikiOpen] = useState(false);
  const [wikiMatches, setWikiMatches] = useState([]);
  const [wikiPos, setWikiPos] = useState({ top: 0, left: 0 });
  const [wikiFocus, setWikiFocus] = useState(0);

  const backlinks = note ? getBacklinks(notes, note.id) : [];

  // Sync editor content when note changes
  useEffect(() => {
    if (!note || !editorRef.current) return;
    if (titleRef.current) titleRef.current.value = note.title;
    editorRef.current.innerHTML = note.html;
    // Bind wikilink clicks
    bindWikilinkClicks();
    updateWc();
    setSaveStatus('Saved');
  }, [note?.id]);

  function updateWc() {
    if (!editorRef.current) return;
    setWc(wordCount(editorRef.current.innerHTML));
  }

  function scheduleAutosave() {
    clearTimeout(saveTimer.current);
    setSaveStatus('Saving…');
    saveTimer.current = setTimeout(() => {
      if (!note || !editorRef.current) return;
      onUpdate(note.id, {
        title: titleRef.current?.value || '',
        html: editorRef.current.innerHTML,
      });
      setSaveStatus('Saved');
    }, 700);
  }

  function bindWikilinkClicks() {
    editorRef.current?.querySelectorAll('.wikilink').forEach(link => {
      link.onclick = () => {
        const targetId = +link.dataset.target;
        const target = notes.find(n => n.id === targetId);
        if (target) onUpdate(target.id, {}); // triggers open via parent
      };
    });
  }

  // ── Formatting ──
  function execFmt(cmd) {
    editorRef.current?.focus();
    if (cmd === 'bold')          document.execCommand('bold', false, null);
    else if (cmd === 'italic')   document.execCommand('italic', false, null);
    else if (cmd === 'strike')   document.execCommand('strikeThrough', false, null);
    else if (cmd === 'h1')       wrapBlock('H1');
    else if (cmd === 'h2')       wrapBlock('H2');
    else if (cmd === 'code')     document.execCommand('insertHTML', false, '<code>​</code>');
    else if (cmd === 'quote')    wrapBlock('BLOCKQUOTE');
    else if (cmd === 'ul')       document.execCommand('insertUnorderedList', false, null);
    else if (cmd === 'ol')       document.execCommand('insertOrderedList', false, null);
    else if (cmd === 'link')     openLinkPopup();
    else if (cmd === 'wikilink') { editorRef.current?.focus(); document.execCommand('insertText', false, '[['); }
    scheduleAutosave();
  }

  function wrapBlock(tag) {
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    const range = sel.getRangeAt(0);
    let block = range.startContainer;
    while (block && block.nodeType === 3) block = block.parentNode;
    while (block?.parentNode && block.parentNode !== editorRef.current) block = block.parentNode;
    if (!block || block === editorRef.current) return;
    if (block.tagName === tag) {
      const p = document.createElement('p'); p.innerHTML = block.innerHTML;
      block.parentNode.replaceChild(p, block);
    } else {
      const el = document.createElement(tag); el.innerHTML = block.innerHTML || '​';
      block.parentNode.replaceChild(el, block);
    }
  }

  // ── Link popup ──
  function openLinkPopup() {
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    const range = sel.getRangeAt(0);
    const parentA = sel.anchorNode?.parentElement?.closest('a');
    const rew = editorRef.current?.parentElement?.getBoundingClientRect();
    const r = range.getBoundingClientRect();
    const top = r.bottom - (rew?.top || 0) + 4;
    const left = Math.min(r.left - (rew?.left || 0), (rew?.width || 600) - 330);
    setLinkPos({ top, left });
    if (parentA) {
      setLinkMode('edit'); setLinkUrl(parentA.href); setLinkPopupOpen(true);
    } else {
      linkRangeRef.current = range.cloneRange();
      setLinkMode('insert'); setLinkUrl(''); setLinkPopupOpen(true);
    }
  }
  function applyLink() {
    if (!linkUrl) return;
    const href = linkUrl.startsWith('http') ? linkUrl : 'https://' + linkUrl;
    editorRef.current?.focus();
    if (linkRangeRef.current) {
      const sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(linkRangeRef.current);
    }
    document.execCommand('createLink', false, href);
    setLinkPopupOpen(false); scheduleAutosave();
  }

  // ── Wikilink autocomplete ──
  function handleEditorInput() {
    updateWc(); scheduleAutosave();
    const sel = window.getSelection();
    if (!sel?.rangeCount) { setWikiOpen(false); return; }
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== 3) { setWikiOpen(false); return; }
    const text = node.textContent.slice(0, range.startOffset);
    const idx = text.lastIndexOf('[[');
    if (idx >= 0 && !text.slice(idx).includes(']]')) {
      const q = text.slice(idx + 2).toLowerCase();
      const matches = notes.filter(n =>
        n.id !== note?.id && !n.deleted &&
        (!q || n.title.toLowerCase().includes(q))
      ).slice(0, 6);
      if (matches.length) {
        const rew = editorRef.current?.parentElement?.getBoundingClientRect();
        const r = range.getBoundingClientRect();
        setWikiMatches(matches);
        setWikiPos({ top: r.bottom - (rew?.top || 0) + 4, left: r.left - (rew?.left || 0) });
        setWikiOpen(true); setWikiFocus(0);
      } else setWikiOpen(false);
    } else setWikiOpen(false);
  }

  function insertWikilink(target) {
    setWikiOpen(false);
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType === 3) {
      const text = node.textContent;
      const idx = text.lastIndexOf('[[');
      if (idx >= 0) {
        const r2 = document.createRange();
        r2.setStart(node, idx); r2.setEnd(node, range.startOffset);
        r2.deleteContents();
      }
    }
    const link = document.createElement('span');
    link.className = 'wikilink'; link.dataset.target = target.id;
    link.textContent = `[[${target.title}]]`;
    const after = document.createTextNode('\u00a0');
    const cur = window.getSelection().getRangeAt(0);
    cur.insertNode(after); cur.insertNode(link);
    const r3 = document.createRange();
    r3.setStartAfter(after); r3.collapse(true);
    sel.removeAllRanges(); sel.addRange(r3);
    scheduleAutosave();
  }

  function handleEditorKeyDown(e) {
    if (wikiOpen) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setWikiFocus(f => Math.min(f + 1, wikiMatches.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setWikiFocus(f => Math.max(f - 1, 0)); return; }
      if (e.key === 'Enter')     { e.preventDefault(); if (wikiMatches[wikiFocus]) insertWikilink(wikiMatches[wikiFocus]); return; }
      if (e.key === 'Escape')    { setWikiOpen(false); return; }
    }
  }

  if (!note) {
    return (
      <section className="app-editor editor-empty" aria-label="Editor">
        <div className="editor-empty-state">
          <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>No note selected</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Select a note from the list or create a new one</div>
        </div>
      </section>
    );
  }

  return (
    <section className="app-editor" aria-label="Note editor">
      {/* Toolbar */}
      <div className="ed-toolbar" role="toolbar" aria-label="Text formatting">
        {[
          { cmd: 'bold',      label: <b>B</b>,           title: 'Bold (⌘B)' },
          { cmd: 'italic',    label: <em>I</em>,          title: 'Italic (⌘I)' },
          { cmd: 'strike',    label: <s>S</s>,            title: 'Strikethrough' },
          null,
          { cmd: 'h1',        label: 'H1',                title: 'Heading 1 (⌘⌥1)', style: { fontSize: 11 } },
          { cmd: 'h2',        label: 'H2',                title: 'Heading 2 (⌘⌥2)', style: { fontSize: 11 } },
          null,
          { cmd: 'code',      label: <code>`</code>,      title: 'Code' },
          { cmd: 'quote',     label: '"',                 title: 'Blockquote' },
          { cmd: 'ul',        label: <i className="ti ti-list" />,         title: 'Bullet list' },
          { cmd: 'ol',        label: <i className="ti ti-list-numbers" />, title: 'Numbered list' },
          null,
          { cmd: 'link',      label: <i className="ti ti-link" />,         title: 'Link (⌘K)', onMouseDown: (e) => { e.preventDefault(); openLinkPopup(); } },
          { cmd: 'wikilink',  label: <i className="ti ti-brackets" />,     title: 'Wikilink [[' },
        ].map((item, i) => {
          if (!item) return <div key={i} className="tb-sep" />;
          return (
            <button
              key={item.cmd}
              className="tb-btn"
              title={item.title}
              style={item.style}
              onMouseDown={item.onMouseDown || (e => { e.preventDefault(); execFmt(item.cmd); })}
            >
              {item.label}
            </button>
          );
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <button className="tb-text-btn" onMouseDown={e => { e.preventDefault(); execFmt('wikilink'); }}>⌘K</button>
        </div>
      </div>

      {/* Meta row */}
      <div className="ed-meta-row">
        <button
          className={`ed-star-btn${note.starred ? ' on' : ''}`}
          onClick={() => onToggleStar(note.id)}
          title={note.starred ? 'Unstar' : 'Star'}
          aria-label={note.starred ? 'Unstar note' : 'Star note'}
        >★</button>
        {note.tags.map(tag => (
          <span key={tag} className="ed-tag">
            {tag}
            <span className="ed-tag-x" onClick={() => onRemoveTag(note.id, tag)}>×</span>
          </span>
        ))}
        {showTagInput ? (
          <input
            className="ed-tag-input"
            autoFocus
            placeholder="tag…"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
                if (t) onAddTag(note.id, t);
                setTagInput(''); setShowTagInput(false);
              }
              if (e.key === 'Escape') { setTagInput(''); setShowTagInput(false); }
            }}
            onBlur={() => { if (tagInput.trim()) onAddTag(note.id, tagInput.trim().toLowerCase()); setTagInput(''); setShowTagInput(false); }}
          />
        ) : (
          <button className="ed-tag-add" onClick={() => setShowTagInput(true)}>+ tag</button>
        )}
      </div>

      {/* Title */}
      <div className="ed-title-wrap">
        <input
          ref={titleRef}
          className="ed-title"
          defaultValue={note.title}
          placeholder="Note title…"
          aria-label="Note title"
          onChange={scheduleAutosave}
        />
      </div>
      <div className="ed-rule" />

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div className="ed-backlinks">
          <span className="bl-label">Backlinks</span>
          {backlinks.map(bl => (
            <span key={bl.id} className="bl-chip">{bl.title || 'Untitled'}</span>
          ))}
        </div>
      )}

      {/* Editor canvas */}
      <div className="ed-canvas-wrap" ref={linkPopupRef}>

        {/* Wiki popup */}
        {wikiOpen && (
          <div className="wiki-popup" style={{ top: wikiPos.top, left: wikiPos.left }}>
            {wikiMatches.map((n, i) => (
              <div
                key={n.id}
                className={`wiki-item${i === wikiFocus ? ' focused' : ''}`}
                onMouseDown={e => { e.preventDefault(); insertWikilink(n); }}
              >
                <div className="wiki-item-title">{n.title || 'Untitled'}</div>
                <div className="wiki-item-sub">{n.html.replace(/<[^>]+>/g, ' ').trim().slice(0, 40)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Link popup */}
        {linkPopupOpen && (
          <div className="link-popup open" style={{ top: linkPos.top, left: linkPos.left }}>
            {linkMode === 'insert' ? (
              <div className="lp-input-row">
                <span className="lp-icon"><i className="ti ti-link" /></span>
                <input
                  className="lp-input"
                  autoFocus
                  placeholder="https://…"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') setLinkPopupOpen(false); }}
                />
                <button className="lp-apply" onClick={applyLink}>Apply</button>
              </div>
            ) : (
              <div className="lp-preview">
                <i className="ti ti-external-link" />
                <span className="lp-preview-url">{linkUrl}</span>
                <span className="lp-action" onClick={() => setLinkMode('insert')}>Edit</span>
                <span className="lp-action remove" onClick={() => { editorRef.current?.focus(); document.execCommand('unlink', false, null); setLinkPopupOpen(false); }}>Remove</span>
              </div>
            )}
          </div>
        )}

        <div
          ref={editorRef}
          className="rich-editor"
          contentEditable
          suppressContentEditableWarning
          spellCheck
          aria-label="Note content"
          role="textbox"
          aria-multiline="true"
          onInput={handleEditorInput}
          onKeyUp={() => {
            ['bold', 'italic'].forEach(cmd => {
              document.querySelector(`[data-cmd="${cmd}"]`)?.classList.toggle('on', document.queryCommandState(cmd));
            });
          }}
          onKeyDown={handleEditorKeyDown}
          onClick={() => setLinkPopupOpen(false)}
        />
      </div>

      {/* Footer */}
      <footer className="ed-footer">
        <span className="ed-meta">{wc} word{wc !== 1 ? 's' : ''}</span>
        <span className="ed-meta">·</span>
        <span className="ed-meta">~{Math.max(1, Math.ceil(wc / 200))} min read</span>
        <span className="ed-meta">·</span>
        <span className="ed-meta">{saveStatus}</span>
      </footer>
    </section>
  );
}
