# Prodify AI

An AI-powered product management workspace. Write PRDs, plan roadmaps, prioritise features, and synthesise research — all in one place, with an AI co-pilot that writes directly into your documents.

---

## Features

**AI Workflows**
- **PRD** — generates complete product requirements documents with problem statement, metrics, user stories, scope, and open questions
- **User Stories** — Gherkin acceptance criteria, story points, edge cases, and definition of done
- **Roadmap** — Now / Next / Later planning with sequencing rationale and dependency mapping
- **Prioritization** — RICE scoring, MoSCoW classification, and trade-off analysis
- **Research** — synthesises interview notes and feedback into themes, quotes, and product opportunities
- **Data** — funnel analysis, anomaly detection, hypothesis generation, and experiment design
- **Free Chat** — general PM co-pilot with no document mode

**Editor**
- Rich text editing powered by Tiptap
- AI writes directly into the open document, preserving existing content
- Diff view — see exactly which lines were added or removed after each AI response
- Export to Markdown or plain text (copy or download)

**File Explorer**
- Cursor-style folder tree in the left sidebar
- Create, rename, and delete folders and documents inline
- Documents are automatically named based on their parent folder
- All changes persist to a local SQLite database

**Command Palette**
- `Cmd+K` — open workflows or create documents from anywhere
- `Cmd+N` — new note in the current folder
- `?` — keyboard shortcuts reference

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Rich Text | Tiptap |
| State | Zustand |
| Database | SQLite via Prisma 5 |
| AI | OpenAI GPT-4o (streaming) |
| Layout | react-resizable-panels |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/dscuietpu/pixel-nomads.git
cd pixel-nomads
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your keys:

```env
OPENAI_API_KEY=sk-...your-key-here...
DATABASE_URL="file:./prisma/dev.db"
```

### 3. Set up the database

```bash
# Apply migrations and generate the Prisma client
npx prisma migrate dev

# Seed with demo data (documents, features, research insights)
npx prisma db seed
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── ai/route.ts          # GPT-4o streaming endpoint
│   │   └── db/                  # REST routes for each entity
│   │       ├── documents/
│   │       ├── features/
│   │       ├── filenodes/
│   │       ├── insights/
│   │       └── messages/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── AppShell.tsx              # Three-panel layout shell
│   ├── editor/
│   │   ├── EditorPanel.tsx       # Title bar, toolbar, export
│   │   └── TiptapEditor.tsx      # Rich text editor instance
│   ├── sidebar/
│   │   ├── LeftSidebar.tsx       # File explorer + feature counts
│   │   ├── FileExplorer.tsx      # Folder tree with CRUD
│   │   ├── AIChatPanel.tsx       # AI workflows + chat
│   │   ├── RightPanel.tsx        # Tab container for right panel
│   │   ├── ResearchPanel.tsx     # Research insights view
│   │   └── DataPanel.tsx         # Data input + analysis
│   ├── roadmap/RoadmapBoard.tsx  # Kanban-style roadmap view
│   ├── prioritization/           # RICE + MoSCoW panel
│   ├── modals/
│   │   ├── CommandPalette.tsx    # Cmd+K palette
│   │   └── KeyboardShortcuts.tsx
│   └── ui/                       # shadcn/ui primitives
│
├── lib/
│   ├── types.ts                  # All TypeScript interfaces
│   ├── store.ts                  # Zustand store + DB sync
│   ├── prompts.ts                # System prompts per workflow
│   └── prisma.ts                 # Prisma client singleton
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                   # Demo data
│   └── migrations/
│
└── data/
    └── mock.ts                   # Research insight mock data
```

---

## Database

The app uses SQLite via Prisma. The database file lives at `prisma/dev.db` and is excluded from version control.

**Available scripts:**

```bash
# Push schema changes to the DB (no migration file)
npx prisma db push

# Create a migration file and apply it
npx prisma migrate dev --name <migration-name>

# Reset the DB and re-apply all migrations + seed
npm run db:reset

# Open Prisma Studio (visual DB browser)
npx prisma studio
```

---

## How the AI Works

1. User selects a workflow tab (PRD, Stories, Roadmap, etc.) and types a prompt
2. The frontend sends the prompt, conversation history, and optional document context to `/api/ai`
3. The API constructs a system prompt from `lib/prompts.ts` and streams the response from GPT-4o
4. For document-writing workflows, the response is converted from Markdown to Tiptap HTML and applied to the active document
5. A compact action card appears in chat showing which document was updated, with a **Diff** toggle to see exactly what changed

For **analytical** workflows (Prioritization, Data, Free Chat), responses are rendered as Markdown directly in the chat — no document is created or modified.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Open command palette |
| `Cmd+N` | New note in current folder |
| `Cmd+Enter` | Send AI message |
| `Cmd+/` | Cycle right panel tabs |
| `?` | Show all shortcuts |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `DATABASE_URL` | Yes | Prisma database connection string |

> Never commit `.env` or `.env.local`. They are excluded by `.gitignore`.

---

## Deployment

The app is designed for local use with a SQLite database. For production deployment:

1. Replace SQLite with a hosted database (PostgreSQL on Neon, Supabase, or PlanetScale)
2. Update `DATABASE_URL` in your hosting provider's environment variables
3. Update `prisma/schema.prisma` to use `postgresql` as the provider
4. Deploy to Vercel, Railway, or any Node.js host

```bash
# Build for production
npm run build
npm start
```
