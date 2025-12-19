# Bolt.new Clone

## Overview

This is an AI-powered code generation platform that allows users to create and manage full-stack React applications through natural language prompts. The application provides a complete IDE-like experience with a file explorer, Monaco code editor, live preview, and AI chat interface for generating code.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Code Editor**: Monaco Editor (@monaco-editor/react)
- **Animations**: Framer Motion for smooth UI transitions
- **Layout**: react-resizable-panels for split-pane IDE interface

The frontend follows a page-based architecture with:
- Home page for project listing and creation
- ProjectView page with three-panel layout (file tree, editor, preview/chat)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Build Tool**: Vite for development, esbuild for production bundling
- **API Pattern**: REST endpoints with Zod schema validation
- **Database ORM**: Drizzle ORM with PostgreSQL

The server implements a storage pattern abstraction (`IStorage` interface) for database operations, making it easy to swap implementations if needed.

### Data Models
- **Projects**: Container for files and chat messages
- **Files**: Store code files with path, content, and language metadata
- **FileVersions**: Track historical versions of files
- **Messages**: Chat history between user and AI
- **Templates**: Pre-built project templates
- **Uploads**: File upload tracking

### AI Integration
- Uses Replicate API to access Claude 4.5 Sonnet for code generation
- System prompt instructs the model to output structured JSON with file modifications
- Chat interface allows users to describe features in natural language

### Key Design Decisions

1. **Monorepo Structure**: Client, server, and shared code in one repository with path aliases (@/, @shared/)
2. **Schema-First API**: Routes and schemas defined in shared/routes.ts with Zod for type safety across frontend and backend
3. **Dark Theme Default**: IDE-optimized dark color scheme with CSS custom properties for theming
4. **Serverless-Ready Database**: Uses @neondatabase/serverless for PostgreSQL connections

## External Dependencies

### Database
- **PostgreSQL** via Neon serverless driver (@neondatabase/serverless)
- Database URL configured via `DATABASE_URL` environment variable
- Drizzle Kit for schema migrations (`npm run db:push`)

### AI Service
- **Replicate API** for Claude 4.5 Sonnet model access
- API token stored in server/routes.ts (should be moved to environment variable)

### Third-Party UI Libraries
- Full shadcn/ui component suite (40+ Radix UI primitives)
- Monaco Editor for code editing
- react-day-picker for calendar components
- embla-carousel for carousel functionality
- vaul for drawer components

### Fonts
- Inter (body text)
- Outfit (display/headings)
- JetBrains Mono (code/monospace)
- Loaded via Google Fonts CDN