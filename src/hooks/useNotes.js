import { useState, useCallback } from 'react';
import { INITIAL_NOTES, INITIAL_SPACES } from '../lib/store.js';

let _nextId = 10;

export function useNotes() {
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [spaces, setSpaces] = useState(INITIAL_SPACES);

  const createNote = useCallback((partial = {}) => {
    const note = {
      id: _nextId++,
      title: '',
      html: '<p></p>',
      tags: [],
      date: new Date(),
      starred: false,
      spaceId: null,
      deleted: false,
      ...partial,
    };
    setNotes(prev => [note, ...prev]);
    return note;
  }, []);

  const updateNote = useCallback((id, patch) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch, date: new Date() } : n));
  }, []);

  const softDelete = useCallback((id) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, deleted: true } : n));
  }, []);

  const restoreNote = useCallback((id) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, deleted: false } : n));
  }, []);

  const permanentDelete = useCallback((id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const duplicateNote = useCallback((id) => {
    const orig = notes.find(n => n.id === id);
    if (!orig) return null;
    const dupe = {
      ...orig,
      id: _nextId++,
      title: orig.title + ' (copy)',
      date: new Date(),
      starred: false,
    };
    setNotes(prev => [dupe, ...prev]);
    return dupe;
  }, [notes]);

  const toggleStar = useCallback((id) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, starred: !n.starred } : n));
  }, []);

  const addTag = useCallback((id, tag) => {
    setNotes(prev => prev.map(n => {
      if (n.id !== id || n.tags.includes(tag)) return n;
      return { ...n, tags: [...n.tags, tag] };
    }));
  }, []);

  const removeTag = useCallback((id, tag) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, tags: n.tags.filter(t => t !== tag) } : n));
  }, []);

  const moveToSpace = useCallback((id, spaceId) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, spaceId: spaceId || null } : n));
  }, []);

  const createSpace = useCallback((name) => {
    const icons = ['📁', '🗂', '📌', '💡', '🧪', '📝'];
    const sp = { id: `s${_nextId++}`, name, icon: icons[spaces.length % icons.length] };
    setSpaces(prev => [...prev, sp]);
    return sp;
  }, [spaces.length]);

  const deleteSpace = useCallback((id) => {
    setNotes(prev => prev.map(n => n.spaceId === id ? { ...n, spaceId: null } : n));
    setSpaces(prev => prev.filter(s => s.id !== id));
  }, []);

  return {
    notes, spaces,
    createNote, updateNote, softDelete, restoreNote, permanentDelete,
    duplicateNote, toggleStar, addTag, removeTag, moveToSpace,
    createSpace, deleteSpace,
  };
}
