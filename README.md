# Olai Notes

> *The tool thinks less so you can write more.*

A full-featured cloud notes app — Editorial Minimal design, built with React + Vite.

---

## Features

- **Rich text editor** — bold, italic, headings, code, blockquotes, lists, links
- **Wikilinks** — type `[[` to link notes, with backlinks bar and knowledge graph
- **Knowledge graph** — interactive node map of all note connections
- **Spaces & folders** — organise notes into spaces with sidebar tree
- **Tag management** — add/remove tags, filter by tag
- **Context menus** — right-click any note for full action menu
- **Inline link editor** — insert and edit hyperlinks with a popup
- **Command palette** — ⌘K to jump to anything
- **Search** — live search with highlighted matches
- **Version history** — autosave snapshots
- **Sketch canvas** — freehand drawing, insert into notes
- **Voice to text** — simulated transcription stream
- **OCR** — image text extraction
- **Export** — Markdown, HTML download
- **Dark mode** — full token swap, system preference respected
- **Onboarding** — step-by-step setup checklist
- **Auth** — sign in / sign up / magic link / forgot password
- **Integrations panel** — Slack, Web Clipper, Google Calendar, GitHub, Zapier
- **Admin panel** — members, SSO/SAML, audit log
- **GDPR controls** — data export, tracking toggles, account deletion
- **Gamification** — streaks, badges, milestones, referral system
- **Mobile responsive** — stack layout + bottom nav at <640px
- **Keyboard shortcuts** — ⌘N, ⌘K, ⌘B/I, ⌘D, ⌘\\ and more

---

## Getting started

### Prerequisites
- Node.js 18+
- npm 9+

### Install & run

```bash
# Install dependencies
npm install

# Start dev server (localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
npm run build
# Drag the dist/ folder to netlify.com/drop
```

---

## Project structure

```
olai-notes/
├── index.html
├── vite.config.js
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx              # Entry point
    ├── App.jsx               # Root component, wires everything
    ├── styles/
    │   ├── tokens.css        # Design tokens (colors, spacing, fonts)
    │   └── globals.css       # Global styles, shared components
    ├── lib/
    │   └── store.js          # Data, utilities, markdown converter
    ├── hooks/
    │   ├── useNotes.js       # Note CRUD state
    │   └── useToast.js       # Toast notification hook
    └── components/
        ├── Header.jsx / .css
        ├── Sidebar.jsx / .css
        ├── NoteList.jsx / .css
        ├── Editor.jsx / .css
        ├── CommandPalette.jsx / .css
        └── Panels.jsx / .css  # All overlay panels
```

---

## Firebase integration (production)

The app is built for Firebase. To connect:

1. Create a Firebase project at console.firebase.google.com
2. Enable **Firestore**, **Authentication**, **Realtime Database**, **Storage**
3. Copy your config to `src/lib/firebase.js`:

```js
import { initializeApp } from 'firebase/app';
import { getFirestore }  from 'firebase/firestore';
import { getAuth }       from 'firebase/auth';
import { getDatabase }   from 'firebase/database';

const app = initializeApp({
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
});

export const db      = getFirestore(app);
export const auth    = getAuth(app);
export const rtdb    = getDatabase(app);
```

4. Replace the in-memory `useNotes` hook with Firestore listeners
5. Replace the `AuthScreen` with Firebase Auth (`signInWithPopup`, `createUserWithEmailAndPassword`)

---

## Design system

Built on the **Editorial Minimal** design language:

| Token | Light | Dark |
|---|---|---|
| `--bg-primary` | `#F5F4F1` | `#18181A` |
| `--accent` | `#2D6A4F` | `#4ADE80` |
| `--font-ui` | Inter | Inter |
| `--font-serif` | Playfair Display | Playfair Display |
| `--font-mono` | JetBrains Mono | JetBrains Mono |

---

## Roadmap

- [ ] AI summarisation (Anthropic API)
- [ ] Real-time collaboration (Firebase Realtime DB + Yjs CRDTs)
- [ ] PDF annotation
- [ ] Note templates
- [ ] Desktop app (Tauri)
- [ ] Mobile app (Expo)

---

*Built with React + Vite · Designed for researchers, writers, and thinkers*
