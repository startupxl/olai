// ═══════════════════════════════════════
// Olai Notes — App Store (state + logic)
// ═══════════════════════════════════════

// ── Initial demo notes ──
export const INITIAL_NOTES = [
  {
    id: 1,
    title: 'Welcome to Olai Notes',
    html: `<h1>Welcome to Olai Notes ✦</h1>
<p>The tool thinks less so you can write more. Here's everything you can do right now:</p>
<h2>Core features</h2>
<ul>
  <li><strong>Right-click</strong> any note in the list for context actions</li>
  <li>Type <code>[[</code> to create wikilinks between notes</li>
  <li>Click the <strong>link icon</strong> in the toolbar to insert hyperlinks</li>
  <li>Drag a sketch in using the pencil icon in the header</li>
  <li>Use <strong>⌘K</strong> to open the command palette</li>
</ul>
<h2>Keyboard shortcuts</h2>
<ul>
  <li><strong>⌘N</strong> — new note</li>
  <li><strong>⌘K</strong> — command palette</li>
  <li><strong>⌘B / ⌘I</strong> — bold / italic</li>
  <li><strong>⌘\\</strong> — toggle sidebar</li>
  <li><strong>⌘D</strong> — star / unstar</li>
</ul>`,
    tags: ['welcome'],
    date: new Date(),
    starred: true,
    spaceId: null,
    deleted: false,
  },
  {
    id: 2,
    title: 'Knowledge graph & wikilinks',
    html: `<p>Olai Notes supports bidirectional links between notes. Type <code>[[</code> anywhere in the editor and an autocomplete picker appears.</p>
<h2>How it works</h2>
<ul>
  <li>Type <code>[[note name]]</code> to create a link</li>
  <li>Click any wikilink to jump to that note</li>
  <li>The <strong>backlinks bar</strong> shows which notes link to the current one</li>
  <li>Open the graph icon in the header to see the full knowledge graph</li>
</ul>`,
    tags: ['features', 'graph'],
    date: new Date(Date.now() - 3_600_000),
    starred: false,
    spaceId: 's1',
    deleted: false,
  },
  {
    id: 3,
    title: 'Research workflow',
    html: `<h2>Using Olai Notes for research</h2>
<p>Olai Notes is built for researchers, writers, and knowledge workers who think in connections, not folders.</p>
<ul>
  <li>Use <strong>Spaces</strong> to organise by project</li>
  <li>Use <strong>Tags</strong> for cross-cutting themes</li>
  <li>Use <strong>Wikilinks</strong> to build your knowledge graph</li>
</ul>`,
    tags: ['research', 'workflow'],
    date: new Date(Date.now() - 86_400_000),
    starred: true,
    spaceId: 's1',
    deleted: false,
  },
  {
    id: 4,
    title: 'Product roadmap notes',
    html: `<h2>Q3 priorities</h2>
<ul>
  <li>Real-time collaboration</li>
  <li>End-to-end encryption</li>
  <li>Mobile app — Android &amp; iOS</li>
  <li>Desktop app</li>
</ul>
<blockquote>MVP targets 500 beta users by August 15</blockquote>`,
    tags: ['planning', 'product'],
    date: new Date(Date.now() - 172_800_000),
    starred: false,
    spaceId: 's2',
    deleted: false,
  },
  {
    id: 5,
    title: 'Personal journal',
    html: `<p>A private note in the Personal space. Olai Notes supports End-to-end encryption via the 🔓 badge in the header — encrypt notes before they leave your device.</p>`,
    tags: ['personal'],
    date: new Date(Date.now() - 259_200_000),
    starred: false,
    spaceId: 's3',
    deleted: false,
  },
];

export const INITIAL_SPACES = [
  { id: 's1', name: 'Research',  icon: '🔬' },
  { id: 's2', name: 'Product',   icon: '📦' },
  { id: 's3', name: 'Personal',  icon: '🌿' },
];

export const INTEGRATIONS = [
  { id: 'slack',   name: 'Slack',           icon: '💬', desc: 'Send notes and snippets to Slack channels',      connected: false, comingSoon: true },
  { id: 'clipper', name: 'Web Clipper',      icon: '📎', desc: 'Clip web pages into notes from your browser',   connected: false, comingSoon: true },
  { id: 'gcal',    name: 'Google Calendar',  icon: '📅', desc: 'Attach calendar events to notes automatically', connected: false, comingSoon: true },
  { id: 'notion',  name: 'Notion Import',    icon: '🗂', desc: 'Import your existing Notion pages',             connected: false, comingSoon: true },
  { id: 'github',  name: 'GitHub',           icon: '🐙', desc: 'Link pull requests and issues to notes',         connected: false, comingSoon: true },
  { id: 'zapier',  name: 'Zapier',           icon: '⚡', desc: 'Automate note creation from 5,000+ apps',       connected: false, comingSoon: true },
];

export const BADGES = [
  { ic: '📝', name: 'First note',   earned: true  },
  { ic: '🔗', name: 'Wikilinker',   earned: true  },
  { ic: '🔥', name: '7-day streak', earned: true  },
  { ic: '⭐', name: 'Starred 5',    earned: true  },
  { ic: '🏷', name: 'Tag master',   earned: false },
  { ic: '🌙', name: 'Night owl',    earned: false },
  { ic: '📤', name: 'Sharer',       earned: false },
  { ic: '🔒', name: 'Encrypted',    earned: false },
];

export const MILESTONES = [
  { label: 'Notes written',     current: 5,  target: 10 },
  { label: 'Days active',       current: 7,  target: 30 },
  { label: 'Wikilinks created', current: 3,  target: 10 },
  { label: 'Friends invited',   current: 1,  target: 3  },
];

export const ONBOARDING_STEPS = [
  { ic: '📝', title: 'Write your first note',     sub: 'Click + or press ⌘N / Ctrl+N' },
  { ic: '[[', title: 'Create a wikilink',          sub: 'Type [[ in the editor' },
  { ic: '🏷', title: 'Add a tag',                 sub: 'Click "+ tag" below the title' },
  { ic: '🔍', title: 'Search your notes',         sub: 'Click the search bar or ⌘K / Ctrl+K' },
  { ic: '🌙', title: 'Try dark mode',             sub: 'Click the moon icon in the header' },
  { ic: '🔒', title: 'Review privacy settings',   sub: 'Click the lock icon in the header' },
];

// ── Utility helpers ──
export function formatDate(d) {
  const now = new Date();
  const diff = now - d;
  if (diff < 60_000)       return 'now';
  if (diff < 3_600_000)    return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000)   return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 172_800_000)  return '1d';
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if (d.getFullYear() === now.getFullYear()) return `${mo[d.getMonth()]} ${d.getDate()}`;
  return `${mo[d.getMonth()]} ${d.getFullYear()}`;
}

export function groupLabel(d) {
  const now = new Date();
  const diff = now - d;
  if (diff < 86_400_000)  return 'Today';
  if (diff < 172_800_000) return 'Yesterday';
  const mo = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  if (d.getFullYear() === now.getFullYear()) return `${mo[d.getMonth()]} ${d.getFullYear()}`;
  return String(d.getFullYear());
}

export function htmlToMarkdown(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  function walk(node) {
    if (node.nodeType === 3) return node.textContent;
    const tag = node.tagName?.toLowerCase();
    const inner = Array.from(node.childNodes).map(walk).join('');
    if (!tag) return inner;
    if (tag === 'h1') return `\n# ${inner}\n`;
    if (tag === 'h2') return `\n## ${inner}\n`;
    if (tag === 'h3') return `\n### ${inner}\n`;
    if (tag === 'strong' || tag === 'b') return `**${inner}**`;
    if (tag === 'em' || tag === 'i') return `*${inner}*`;
    if (tag === 's') return `~~${inner}~~`;
    if (tag === 'code') return `\`${inner}\``;
    if (tag === 'pre') return `\n\`\`\`\n${node.textContent.trim()}\n\`\`\`\n`;
    if (tag === 'blockquote') return `\n> ${inner.trim()}\n`;
    if (tag === 'ul') return '\n' + Array.from(node.querySelectorAll(':scope > li')).map(li => `- ${li.innerText.trim()}`).join('\n') + '\n';
    if (tag === 'ol') return '\n' + Array.from(node.querySelectorAll(':scope > li')).map((li,i) => `${i+1}. ${li.innerText.trim()}`).join('\n') + '\n';
    if (tag === 'li') return inner;
    if (tag === 'hr') return '\n---\n';
    if (tag === 'p') return `\n${inner}\n`;
    if (tag === 'a') return `[${inner}](${node.href})`;
    return inner;
  }
  return Array.from(div.childNodes).map(walk).join('').replace(/\n{3,}/g, '\n\n').trim();
}

export function getBacklinks(notes, noteId) {
  return notes.filter(n => n.id !== noteId && getLinks(n.html).includes(noteId));
}

export function getLinks(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return [...div.querySelectorAll('.wikilink')].map(el => +el.dataset.target).filter(Boolean);
}

// Convert markdown (stored in Firestore) → HTML (used by the web editor)
export function markdownToHtml(md) {
  if (!md) return '<p></p>';
  let html = md
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Strikethrough
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Wikilinks — rendered as clickable spans the editor can recognise
    .replace(/\[\[(.+?)\]\]/g, '<span class="wikilink" data-title="$1">[[$1]]</span>')
    // Markdown links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Unordered lists (wrap consecutive - lines)
    .replace(/((?:^- .+\n?)+)/gm, (block) => {
      const items = block.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('');
      return `<ul>${items}</ul>`;
    })
    // Ordered lists
    .replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
      const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
      return `<ol>${items}</ol>`;
    })
    // HR
    .replace(/^---$/gm, '<hr />')
    // Paragraphs — wrap remaining non-tagged lines
    .split('\n\n')
    .map(para => {
      para = para.trim();
      if (!para) return '';
      if (/^<(h[1-6]|ul|ol|blockquote|hr|pre)/.test(para)) return para;
      return `<p>${para.replace(/\n/g, '<br />')}</p>`;
    })
    .join('');
  return html || '<p></p>';
}

export function wordCount(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(/\s+/).length : 0;
}

export function downloadFile(content, filename, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
