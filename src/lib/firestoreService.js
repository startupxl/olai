// Firestore data layer — mirrors Android FirestoreService.kt
// Notes are stored with a `body` field (markdown) so web and Android share the same schema.
// The web editor works with HTML; conversion happens in useNotes.js via htmlToMarkdown / markdownToHtml.

import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, where,
} from 'firebase/firestore';
import { db } from './firebase.js';

// ── Notes ──

export function subscribeNotes(userId, callback) {
  const q = query(collection(db, 'notes'), where('userId', '==', userId));
  return onSnapshot(q, snapshot => {
    const notes = snapshot.docs.map(d => ({ _docId: d.id, ...d.data() }));
    callback(notes);
  });
}

export async function createNote(note, userId) {
  const payload = {
    title:     note.title,
    body:      note.body,
    tags:      note.tags,
    updatedAt: Date.now(),
    starred:   note.starred,
    spaceId:   note.spaceId || null,
    deleted:   note.deleted,
    userId,
  };
  const ref = await addDoc(collection(db, 'notes'), payload);
  return { ...payload, _docId: ref.id };
}

export async function updateNote(docId, patch) {
  await updateDoc(doc(db, 'notes', docId), { ...patch, updatedAt: Date.now() });
}

export async function deleteNote(docId) {
  await deleteDoc(doc(db, 'notes', docId));
}

// ── Spaces ──

export function subscribeSpaces(userId, callback) {
  const q = query(collection(db, 'spaces'), where('userId', '==', userId));
  return onSnapshot(q, snapshot => {
    const spaces = snapshot.docs.map(d => ({ _docId: d.id, ...d.data() }));
    callback(spaces);
  });
}

export async function createSpace(space, userId) {
  const payload = { id: space.id, name: space.name, icon: space.icon, userId };
  await setDoc(doc(db, 'spaces', space.id), payload);
  return { ...payload, _docId: space.id };
}

export async function deleteSpace(spaceId) {
  await deleteDoc(doc(db, 'spaces', spaceId));
}

// ── Profiles (GDPR consent etc.) ──

export async function saveGdprConsent(userId, consented) {
  await setDoc(
    doc(db, 'profiles', userId),
    { userId, gdprConsented: consented },
    { merge: true }
  );
}

// ── Seed demo notes for new users ──

export async function seedDemoNotes(userId) {
  const now = Date.now();
  const demos = [
    {
      title: 'Welcome to Olai Notes',
      body: `# Welcome to Olai Notes ✦\n\nThe tool thinks less so you can write more. Here's everything you can do right now:\n\n## Core features\n- **Right-click** any note in the list for context actions\n- Type \`[[\` to create wikilinks between notes\n- Click the **link icon** in the toolbar to insert hyperlinks\n- Use **⌘K** to open the command palette\n\n## Keyboard shortcuts\n- **⌘N** — new note\n- **⌘K** — command palette\n- **⌘B / ⌘I** — bold / italic\n- **⌘\\** — toggle sidebar\n- **⌘D** — star / unstar`,
      tags: ['welcome'], updatedAt: now, starred: true, spaceId: null, deleted: false,
    },
    {
      title: 'Knowledge graph & wikilinks',
      body: `Olai Notes supports bidirectional links between notes. Type \`[[\` anywhere in the editor.\n\n## How it works\n- Type \`[[Note name]]\` to create a link\n- Click any wikilink to jump to that note\n- Open the graph icon in the header to see your full knowledge graph\n\nSee also [[Welcome to Olai Notes]].`,
      tags: ['features', 'graph'], updatedAt: now - 3_600_000, starred: false, spaceId: null, deleted: false,
    },
    {
      title: 'Research workflow',
      body: `## Using Olai Notes for research\n\nOlai Notes is built for researchers, writers, and knowledge workers.\n\n- Use **Spaces** to organise by project\n- Use **Tags** for cross-cutting themes\n- Use **Wikilinks** to build your knowledge graph\n\nSee also [[Knowledge graph & wikilinks]].`,
      tags: ['research', 'workflow'], updatedAt: now - 86_400_000, starred: true, spaceId: null, deleted: false,
    },
  ];
  const created = [];
  for (const demo of demos) {
    const note = await createNote(demo, userId);
    created.push(note);
  }
  return created;
}

export async function seedDefaultSpaces(userId) {
  const defaults = [
    { id: `research_${userId}`, name: 'Research', icon: '🔬' },
    { id: `product_${userId}`,  name: 'Product',  icon: '📦' },
    { id: `personal_${userId}`, name: 'Personal', icon: '🌿' },
  ];
  for (const s of defaults) await createSpace(s, userId);
  return defaults;
}
