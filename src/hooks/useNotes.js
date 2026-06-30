import { useState, useEffect, useCallback, useRef } from 'react';
import {
  subscribeNotes, subscribeSpaces,
  createNote as fsCreateNote,
  updateNote as fsUpdateNote,
  deleteNote as fsDeleteNote,
  createSpace as fsCreateSpace,
  deleteSpace as fsDeleteSpace,
  seedDemoNotes, seedDefaultSpaces,
} from '../lib/firestoreService.js';
import { htmlToMarkdown, markdownToHtml } from '../lib/store.js';

let _nextId = 100; // fallback for optimistic local IDs before Firestore resolves

// Convert a raw Firestore note doc → web note shape (html field added for editor)
function fromFirestore(doc) {
  return {
    id: doc._docId,
    _docId: doc._docId,
    title: doc.title || '',
    html: markdownToHtml(doc.body || ''),
    body: doc.body || '',
    tags: doc.tags || [],
    date: new Date(doc.updatedAt || Date.now()),
    starred: doc.starred || false,
    spaceId: doc.spaceId || null,
    deleted: doc.deleted || false,
  };
}

export function useNotes(userId) {
  const [notes,  setNotes]  = useState([]);
  const [spaces, setSpaces] = useState([]);
  const seededRef = useRef(false);

  // Real-time Firestore listeners
  useEffect(() => {
    if (!userId) { setNotes([]); setSpaces([]); return; }

    const unsubNotes  = subscribeNotes(userId, docs => {
      const mapped = docs.map(fromFirestore);
      setNotes(mapped);

      // Seed demo content for brand-new users (no notes yet)
      if (!seededRef.current && mapped.length === 0) {
        seededRef.current = true;
        seedDemoNotes(userId).catch(console.error);
        seedDefaultSpaces(userId).catch(console.error);
      }
    });

    const unsubSpaces = subscribeSpaces(userId, docs => {
      setSpaces(docs.map(d => ({ id: d._docId, name: d.name, icon: d.icon })));
    });

    return () => { unsubNotes(); unsubSpaces(); };
  }, [userId]);

  // ── Note mutations ──

  const createNote = useCallback(async (partial = {}) => {
    const body = partial.body || '';
    const note = {
      title: partial.title || '',
      body,
      tags: partial.tags || [],
      starred: false,
      spaceId: partial.spaceId || null,
      deleted: false,
    };
    const created = await fsCreateNote(note, userId);
    return fromFirestore(created);
  }, [userId]);

  const updateNote = useCallback(async (id, patch) => {
    // patch arrives with `html` from the editor — convert to `body` for Firestore
    const firestorePatch = { ...patch };
    if (patch.html !== undefined) {
      firestorePatch.body = htmlToMarkdown(patch.html);
      delete firestorePatch.html;
    }
    // Update local state optimistically
    setNotes(prev => prev.map(n => {
      if (n.id !== id) return n;
      return { ...n, ...patch, date: new Date() };
    }));
    await fsUpdateNote(id, firestorePatch);
  }, []);

  const softDelete = useCallback(async (id) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, deleted: true } : n));
    await fsUpdateNote(id, { deleted: true });
  }, []);

  const restoreNote = useCallback(async (id) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, deleted: false } : n));
    await fsUpdateNote(id, { deleted: false });
  }, []);

  const permanentDelete = useCallback(async (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    await fsDeleteNote(id);
  }, []);

  const duplicateNote = useCallback(async (id) => {
    const orig = notes.find(n => n.id === id);
    if (!orig) return null;
    return createNote({ title: orig.title + ' (copy)', body: orig.body, tags: orig.tags, spaceId: orig.spaceId });
  }, [notes, createNote]);

  const toggleStar = useCallback(async (id) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const starred = !note.starred;
    setNotes(prev => prev.map(n => n.id === id ? { ...n, starred } : n));
    await fsUpdateNote(id, { starred });
  }, [notes]);

  const addTag = useCallback(async (id, tag) => {
    const note = notes.find(n => n.id === id);
    if (!note || note.tags.includes(tag)) return;
    const tags = [...note.tags, tag];
    setNotes(prev => prev.map(n => n.id === id ? { ...n, tags } : n));
    await fsUpdateNote(id, { tags });
  }, [notes]);

  const removeTag = useCallback(async (id, tag) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const tags = note.tags.filter(t => t !== tag);
    setNotes(prev => prev.map(n => n.id === id ? { ...n, tags } : n));
    await fsUpdateNote(id, { tags });
  }, [notes]);

  const moveToSpace = useCallback(async (id, spaceId) => {
    const sid = spaceId || null;
    setNotes(prev => prev.map(n => n.id === id ? { ...n, spaceId: sid } : n));
    await fsUpdateNote(id, { spaceId: sid });
  }, []);

  // ── Space mutations ──

  const createSpace = useCallback(async (name) => {
    const icons = ['📁', '🗂', '📌', '💡', '🧪', '📝'];
    const sp = { id: `s${_nextId++}_${userId}`, name, icon: icons[spaces.length % icons.length] };
    await fsCreateSpace(sp, userId);
    return sp;
  }, [spaces.length, userId]);

  const deleteSpace = useCallback(async (id) => {
    // Un-assign notes in Firestore first — only delete space if all writes succeed
    const affected = notes.filter(n => n.spaceId === id);
    await Promise.all(affected.map(n => fsUpdateNote(n.id, { spaceId: null })));
    await fsDeleteSpace(id);
    // Update local state after successful Firestore writes
    setNotes(prev => prev.map(n => n.spaceId === id ? { ...n, spaceId: null } : n));
    setSpaces(prev => prev.filter(s => s.id !== id));
  }, [notes]);

  return {
    notes, spaces,
    createNote, updateNote, softDelete, restoreNote, permanentDelete,
    duplicateNote, toggleStar, addTag, removeTag, moveToSpace,
    createSpace, deleteSpace,
  };
}
