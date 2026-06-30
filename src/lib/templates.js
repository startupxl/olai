// Template definitions — each maps directly to a createNote() call
// body is Markdown; title and tags are pre-filled

export const TEMPLATES = [
  // ── Personal ──────────────────────────────────────────────────────────────

  {
    id: 'daily-journal',
    category: 'personal',
    emoji: '📔',
    name: 'Daily Journal',
    description: 'Reflect on your day with structured prompts for gratitude, wins, and learnings.',
    tags: ['journal', 'daily'],
    title: () => `Journal — ${fmtDate()}`,
    body: () => `# Journal — ${fmtDate()}

## Morning intention
> What is the one thing that would make today a success?

_Write your intention here…_

---

## Gratitude
1.
2.
3.

---

## Today's focus
- [ ]
- [ ]
- [ ]

---

## Evening reflection

**Wins today:**
-

**What I learned:**
-

**What I'd do differently:**
-

---

**Mood:** 😊 / 😐 / 😔
**Energy:** ⚡⚡⚡ / ⚡⚡ / ⚡`,
  },

  {
    id: 'daily-planner',
    category: 'personal',
    emoji: '📅',
    name: 'Daily Planner',
    description: 'Structure your day with time blocks, priorities, and end-of-day check-in.',
    tags: ['planner', 'daily', 'productivity'],
    title: () => `Daily Plan — ${fmtDate()}`,
    body: () => `# Daily Plan — ${fmtDate()}

## Top 3 priorities (MITs)
1.
2.
3.

---

## Time blocks

| Time | Task | Done |
|------|------|------|
| 07:00 – 09:00 | | ☐ |
| 09:00 – 11:00 | | ☐ |
| 11:00 – 13:00 | | ☐ |
| 14:00 – 16:00 | | ☐ |
| 16:00 – 18:00 | | ☐ |

---

## Meetings & calls
-

## Notes & ideas
-

---

## End of day ✓
- [ ] Top 3 priorities completed?
- [ ] Inbox zero?
- [ ] Tomorrow's MITs planned?`,
  },

  {
    id: 'habit-tracker',
    category: 'personal',
    emoji: '🔁',
    name: 'Habit Tracker',
    description: 'Track daily habits for the week. Build streaks, spot patterns, stay consistent.',
    tags: ['habits', 'tracker', 'weekly'],
    title: () => `Habits — Week of ${fmtWeekStart()}`,
    body: () => `# Habits — Week of ${fmtWeekStart()}

## Weekly habit grid

| Habit | Mon | Tue | Wed | Thu | Fri | Sat | Sun | ✓ |
|-------|-----|-----|-----|-----|-----|-----|-----|---|
| Morning pages | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | 0/7 |
| Exercise 30 min | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | 0/7 |
| Read 20 pages | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | 0/7 |
| No screens after 9pm | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | 0/7 |
| Drink 8 glasses water | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | 0/7 |
| _Add your habit_ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | 0/7 |

---

## Weekly reflection
**What went well:**

**What to improve next week:**

**Streak record:**`,
  },

  {
    id: 'goal-planner',
    category: 'personal',
    emoji: '🎯',
    name: 'Goal Planner',
    description: 'Set goals using the SMART framework. Break them into milestones and weekly actions.',
    tags: ['goals', 'planning', 'quarterly'],
    title: () => `Goal Planner — Q${fmtQuarter()} ${new Date().getFullYear()}`,
    body: () => `# Goal Planner — Q${fmtQuarter()} ${new Date().getFullYear()}

## Goal statement
> _Be specific: What exactly do you want to achieve?_

**Goal:**

---

## SMART check
- **Specific** — Is it clear and precise?
- **Measurable** — How will you know you've achieved it?
- **Achievable** — Is it realistic given your current resources?
- **Relevant** — Why does this matter to you right now?
- **Time-bound** — Deadline:

---

## Milestones

| # | Milestone | Target date | Done |
|---|-----------|-------------|------|
| 1 | | | ☐ |
| 2 | | | ☐ |
| 3 | | | ☐ |
| 4 | | | ☐ |

---

## Weekly actions
**This week I will:**
- [ ]
- [ ]
- [ ]

---

## Potential obstacles & solutions
| Obstacle | Solution |
|----------|----------|
| | |

---

## Why this matters to me
_Write your personal "why" — return to this when motivation dips._`,
  },

  {
    id: 'shopping-list',
    category: 'personal',
    emoji: '🛒',
    name: 'Shopping List',
    description: 'Organised grocery and shopping list by category. Never forget an item again.',
    tags: ['shopping', 'grocery'],
    title: () => `Shopping List — ${fmtDate()}`,
    body: () => `# Shopping List — ${fmtDate()}

## 🥦 Produce
- [ ]
- [ ]

## 🥩 Meat & Protein
- [ ]
- [ ]

## 🥛 Dairy & Eggs
- [ ]
- [ ]

## 🍞 Bakery & Pantry
- [ ]
- [ ]

## 🧊 Frozen
- [ ]

## 🧴 Household & Personal
- [ ]
- [ ]

## 🍷 Beverages
- [ ]

---

**Store:** &nbsp;&nbsp;&nbsp; **Budget:** $&nbsp;&nbsp;&nbsp; **Spent:** $`,
  },

  // ── Business ──────────────────────────────────────────────────────────────

  {
    id: 'meeting-notes',
    category: 'business',
    emoji: '📋',
    name: 'Meeting Notes',
    description: 'Capture agenda, attendees, decisions, and action items in one structured note.',
    tags: ['meeting', 'work'],
    title: () => `Meeting Notes — ${fmtDate()}`,
    body: () => `# Meeting Notes — ${fmtDate()}

**Meeting:** _Title / Topic_
**Date:** ${fmtDate()}
**Time:** :00 – :00
**Location / Link:**

---

## Attendees
-
-

---

## Agenda
1.
2.
3.

---

## Discussion notes

### Topic 1


### Topic 2


---

## Decisions made
-

## Action items

| Action | Owner | Due |
|--------|-------|-----|
| | | |
| | | |
| | | |

---

## Next meeting
**Date:** &nbsp;&nbsp;&nbsp; **Goal:**`,
  },

  {
    id: 'project-planner',
    category: 'business',
    emoji: '🗂',
    name: 'Project Planner',
    description: 'Define goals, scope, milestones, and risks. Keep every project on track.',
    tags: ['project', 'planning', 'work'],
    title: () => `Project — `,
    body: () => `# Project — _Project name_

**Owner:**
**Start date:** ${fmtDate()}
**Target launch:**
**Status:** 🟡 Planning

---

## Objective
> _One sentence: what does success look like?_

---

## Scope

**In scope:**
-
-

**Out of scope:**
-
-

---

## Milestones

| # | Milestone | Owner | Target | Status |
|---|-----------|-------|--------|--------|
| 1 | Kickoff & planning | | | ⬜ |
| 2 | Design & spec | | | ⬜ |
| 3 | Build | | | ⬜ |
| 4 | Review & testing | | | ⬜ |
| 5 | Launch | | | ⬜ |

---

## Resources & links
-
-

---

## Risks & mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| | Medium | High | |

---

## Progress log
**${fmtDate()}** — Project started.`,
  },

  {
    id: 'task-list',
    category: 'business',
    emoji: '✅',
    name: 'Task List',
    description: 'Prioritised task list using the Eisenhower matrix. Focus on what moves the needle.',
    tags: ['tasks', 'todo', 'productivity'],
    title: () => `Tasks — ${fmtDate()}`,
    body: () => `# Tasks — ${fmtDate()}

## 🔴 Urgent & Important (Do now)
- [ ]
- [ ]

## 🟡 Important, not urgent (Schedule)
- [ ]
- [ ]
- [ ]

## 🔵 Urgent, not important (Delegate if possible)
- [ ]
- [ ]

## ⚪ Neither (Eliminate or defer)
- [ ]

---

## In progress
- [ ]

## Completed today ✓
- [x] `,
  },

  {
    id: 'client-meeting',
    category: 'business',
    emoji: '🤝',
    name: 'Client Meeting',
    description: 'Prepare questions, capture notes, and track follow-ups from client calls.',
    tags: ['client', 'meeting', 'work'],
    title: () => `Client Meeting — `,
    body: () => `# Client Meeting — _Client name_

**Date:** ${fmtDate()}
**Client:**
**Contact:**
**Our attendees:**

---

## Objective
> _What's the goal of this meeting?_

---

## Pre-meeting preparation

**Background:**

**Key questions to ask:**
1.
2.
3.

---

## Meeting notes

### Key points raised


### Client concerns / pain points


### Opportunities identified


---

## Decisions & agreements
-

## Follow-up actions

| Action | Owner | Due |
|--------|-------|-----|
| Send proposal | | |
| | | |

---

## Next steps
**Next meeting:**
**Proposal / quote due:**

---

_Reference: [[Project Planner]]_`,
  },

  {
    id: 'weekly-team-update',
    category: 'business',
    emoji: '📊',
    name: 'Weekly Team Update',
    description: "Share wins, blockers, and next week's plan. Keep the team aligned asynchronously.",
    tags: ['team', 'weekly', 'update', 'work'],
    title: () => `Team Update — Week of ${fmtWeekStart()}`,
    body: () => `# Team Update — Week of ${fmtWeekStart()}

**Team:**
**Prepared by:**
**Date:** ${fmtDate()}

---

## ✅ Wins this week
-
-
-

---

## 🔄 In progress
| Item | Owner | Status | ETA |
|------|-------|--------|-----|
| | | On track | |
| | | At risk | |

---

## 🚧 Blockers & risks
| Blocker | Impact | Who can help |
|---------|--------|-------------|
| | | |

---

## 📈 Key metrics this week
| Metric | Target | Actual | Δ |
|--------|--------|--------|---|
| | | | |

---

## 🗓 Next week priorities
1.
2.
3.

---

## 💬 Shoutouts
_Celebrate a teammate:_

---

**Next team sync:** &nbsp;&nbsp; **Agenda item for all-hands:**`,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function fmtDate() {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const mon = new Date(d.setDate(diff));
  return mon.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtQuarter() {
  return Math.ceil((new Date().getMonth() + 1) / 3);
}
