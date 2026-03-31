# Polaris

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-1.31-6366f1?logo=convex)](https://convex.dev/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?logo=clerk)](https://clerk.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

Polaris is a cutting-edge, AI-first code editor and development environment that runs entirely in your browser. Inspired by modern AI IDEs like Cursor, Polaris combines a powerful code editor, real-time preview, and an integrated AI assistant to transform your development workflow.

## 🚀 Key Features

- **AI-Native Coding:** Deeply integrated AI assistant powered by Anthropic's Claude and Google's Gemini models. Use natural language to generate code, refactor, and debug.
- **In-Browser Runtime:** Execute your code directly in the browser using the **WebContainer API**. No local setup required for Node.js environments.
- **Full-Featured Editor:** Professional-grade editing experience powered by **CodeMirror 6**, featuring syntax highlighting, code folding, and smart indentation.
- **Live Preview:** Instant feedback with an integrated live preview pane for web applications.
- **Integrated Terminal:** A full-featured terminal powered by **xterm.js** to interact with your WebContainer environment.
- **GitHub Integration:** Seamlessly import and export projects from/to GitHub repositories.
- **Real-time Persistence:** Built on **Convex**, ensuring your projects, files, and conversations are always synced and persisted.
- **Agentic Workflows:** Complex background tasks and long-running AI operations managed by **Inngest**.

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **UI Components:** [Shadcn UI](https://ui.shadcn.com/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)

### Backend & AI
- **Database/Real-time:** [Convex](https://convex.dev/)
- **Authentication & billing:** [Clerk](https://clerk.com/)
- **AI SDK:** [Vercel AI SDK](https://sdk.vercel.ai/)
- **LLM Providers:** Anthropic (Claude), Google (Gemini)
- **Workflow Orchestration:** [Inngest](https://www.inngest.com/) & [Inngest AgentKit](https://agentkit.inngest.com/overview)
- **Web Scraping:** [Firecrawl](https://www.firecrawl.dev/)

### Development Tools
- **Editor Core:** [CodeMirror 6](https://codemirror.net/)
- **Web Runtime:** [WebContainer API](https://webcontainers.io/)
- **Terminal:** [xterm.js](https://xtermjs.org/)
- **Syntax Highlighting:** [Shiki](https://shiki.style/)
- **Monitoring:** [Sentry](https://sentry.io/)

## 🏁 Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- A Clerk account (for authentication & billing)
- A Convex account (for the database)
- API Keys for AI providers (Anthropic, Google)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/polaris.git
   cd polaris
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add the following:
   ```env
   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
   CLERK_SECRET_KEY=...
   CLERK_JWT_ISSUER_DOMAIN =...

   # Convex
   CONVEX_DEPLOYMENT=...
   NEXT_PUBLIC_CONVEX_URL=...
   POLARIS_CONVEX_INTERNAL_KEY=...

   # AI Providers (Google)
   GOOGLE_GENERATIVE_AI_API_KEY  =...
   GOOGLE_API_KEY =...

   # Firecrawl
   FIRECRAWL_API_KEY=...

   # Sentry
   SENTRY_AUTH_TOKEN=...

4. **Initialize Convex:**
   ```bash
   npx convex dev
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Start Inngest Dev Server (Optional):**
   ```bash
   npx inngest-cli@latest dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see Polaris in action.

## 📁 Project Structure

```text
polaris/
├── convex/          # Convex backend schema and functions
├── src/
│   ├── app/         # Next.js App Router (pages and layouts)
│   ├── components/  # Reusable UI components
│   ├── features/    # Feature-specific logic (editor, projects, auth,...)
│   ├── hooks/       # Custom React hooks
│   ├── lib/         # Utility functions and library wrappers
│   └── inngest/     # Inngest functions and clients
├── public/          # Static assets
└── ...
```


