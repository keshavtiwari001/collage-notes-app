# Academica

A modern, full-stack academic notes management application built for students. Organize your study notes in a clean hierarchy: **Semester → Subject → Chapter → Part → Notes**, with a built-in Q&A section for each subject.

---

## Features

- **Hierarchical organization** — Semesters/Years → Subjects → Chapters → Parts
- **Rich note editor** — TipTap-powered editor with headings, lists, code blocks, blockquotes, text alignment, and more
- **Auto-save** — Notes save automatically as you type (1.5s debounce)
- **Q&A section** — Per-subject question and answer cards for exam prep
- **Search** — Real-time search across subjects, chapters, and parts
- **Export** — Download notes as PDF or plain text
- **3 Themes** — Light, Dark, and Paper texture themes
- **Responsive** — Works on mobile, tablet, and desktop
- **Collapsible sidebar** — More writing space when you need it

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Framework  | Next.js 15 (App Router)           |
| Language   | JavaScript (no TypeScript)        |
| Styling    | Tailwind CSS v4                   |
| Database   | MongoDB + Mongoose                |
| Editor     | TipTap                            |
| Storage    | Cloudinary (images)               |
| Icons      | Lucide React                      |

---

## Setup

### 1. Clone & install

```bash
git clone <your-repo-url>
cd academica
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials (see sections below).

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## MongoDB Setup

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user with read/write access
3. Whitelist your IP address (or `0.0.0.0/0` for development)
4. Get your connection string from **Connect → Drivers**
5. Add to `.env.local`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/academica?retryWrites=true&w=majority
```

The database and collections are created automatically on first use.

---

## Cloudinary Setup

Cloudinary is used for image uploads inside notes (Phase 6+).

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier is sufficient)
2. From your dashboard, copy your **Cloud name**, **API Key**, and **API Secret**
3. Add to `.env.local`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Environment Variables

| Variable                  | Required | Description                    |
|---------------------------|----------|--------------------------------|
| `MONGODB_URI`             | ✅ Yes   | MongoDB connection string      |
| `CLOUDINARY_CLOUD_NAME`   | ✅ Yes   | Cloudinary cloud name          |
| `CLOUDINARY_API_KEY`      | ✅ Yes   | Cloudinary API key             |
| `CLOUDINARY_API_SECRET`   | ✅ Yes   | Cloudinary API secret          |
| `NEXT_PUBLIC_APP_URL`     | Optional | App URL (default: localhost)   |

---

## Available Scripts

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Project Structure

```
academica/
├── app/
│   ├── api/                  # API routes (periods, subjects, chapters, parts, qa, search, stats)
│   ├── periods/              # Period & subject pages
│   └── search/               # Search page
├── components/
│   ├── ui/                   # Base components (Button, Card, Modal, etc.)
│   ├── layout/               # AppShell, Sidebar, Header, BottomNav
│   ├── editor/               # TipTap NoteEditor + EditorToolbar
│   ├── periods/              # PeriodForm
│   ├── subjects/             # SubjectForm
│   ├── chapters/             # ChapterForm
│   ├── parts/                # PartForm
│   └── qa/                   # QAForm
├── context/                  # ThemeContext, ToastContext
├── lib/                      # mongodb, cloudinary, utils, validate, rateLimit, exportUtils
├── models/                   # Mongoose models (AcademicPeriod, Subject, Chapter, Part, QA)
└── public/
```

---

## Data Hierarchy

```
AcademicPeriod (Semester / Year)
  └── Subject
        ├── Chapter
        │     └── Part  ←  TipTap JSON content stored here
        └── QA           ←  Question + TipTap JSON answer
```

---

## License

MIT — for personal academic use.
