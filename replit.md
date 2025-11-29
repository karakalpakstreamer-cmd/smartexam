# SmartExam - University Examination Management System

## Overview

SmartExam is a comprehensive university examination management system designed to streamline the entire exam lifecycle—from user management and lecture uploads to AI-powered exam generation and grading. The system serves three primary user roles: Registrators (administrators), Teachers (O'qituvchi), and Students (Talaba), each with distinct workflows and permissions.

The application enables:
- Hierarchical university structure management (Faculties → Departments → Groups → Subjects)
- AI-powered question generation from uploaded lecture materials
- Secure exam administration with identity verification
- Automated grading using Google Gemini AI
- Results management and HEMIS export capabilities

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management

**UI Component System:**
- Shadcn/ui component library with Radix UI primitives
- Tailwind CSS for styling with custom design system
- Support for both light and dark themes
- Responsive design with mobile-first approach

**State Management:**
- React Context API for authentication state (`AuthProvider`)
- TanStack Query for server state caching and synchronization
- Local state management with React hooks
- Session-based authentication stored server-side

**Key Design Decisions:**
- **TypeScript paths:** Configured aliases (`@/`, `@shared/`) for clean imports across client and shared code
- **Component structure:** Separation of layout components (Sidebar, Topbar, StudentNavbar) from page components
- **Protected routes:** Custom `ProtectedRoute` component enforces role-based access control
- **Form handling:** React Hook Form with Zod validation for type-safe form management

### Backend Architecture

**Server Framework:**
- Node.js with Express.js
- TypeScript with ES modules
- Session-based authentication using express-session
- File upload handling via Multer

**Database Layer:**
- PostgreSQL as the primary database (Neon serverless)
- Drizzle ORM for type-safe database queries
- Schema-first design with Drizzle migrations
- Connection pooling for optimal performance

**Authentication & Authorization:**
- Session-based auth with secure HTTP-only cookies
- Role-based access control (registrator, oqituvchi, talaba)
- Password hashing with bcryptjs
- Middleware-based route protection (`requireAuth`, `requireRole`)

**API Design:**
- RESTful API structure with `/api` prefix
- Role-specific endpoints organized by user type
- Error handling middleware
- Request logging with timestamp formatting

**Key Architectural Patterns:**
- **Storage abstraction:** `IStorage` interface separates business logic from data access
- **Middleware composition:** Auth, role verification, and file upload middlewares are composable
- **Single responsibility:** Routes, storage, and database are cleanly separated
- **Type safety:** Shared schema types between client and server prevent runtime errors

### Data Model

**Core Entities:**
- **Users:** Multi-role user table (registrator, oqituvchi, talaba)
- **Faculties → Departments → Student Groups:** Hierarchical academic structure
- **Subjects:** Courses with teacher assignments
- **Lectures:** Uploaded study materials (PDF, DOC, DOCX)
- **Questions:** AI-generated questions from lecture content
- **Exams:** Exam configurations with group assignments
- **Exam Sessions:** Individual student exam instances
- **Student Answers:** Responses with AI-generated scores

**Design Rationale:**
- Normalized schema prevents data duplication
- Cascade deletions maintain referential integrity
- Temporal data (createdAt, lastLogin) enables audit trails
- JSONB fields store flexible metadata

### External Dependencies

**AI Services:**
- **Google Gemini 2.5 Flash API:** Used for AI question generation from lecture materials and automated answer grading
- API key stored in environment variables
- Configured via `@google/genai` package

**Database:**
- **Neon PostgreSQL:** Serverless PostgreSQL database
- Connection via `@neondatabase/serverless` with WebSocket support
- DATABASE_URL provided by Replit environment

**File Processing:**
- **pdf-parse:** Extract text from PDF lecture files
- **mammoth:** Convert DOCX files to text
- **multer:** Handle multipart file uploads with size limits (10MB max)

**Session Management:**
- **express-session:** Server-side session storage
- **connect-pg-simple:** PostgreSQL-backed session store for production
- SESSION_SECRET environment variable for encryption

**Development Tools:**
- **Replit plugins:** Runtime error overlay, cartographer, dev banner (development only)
- **Vite HMR:** Hot module replacement over WebSocket
- **esbuild:** Production server bundling with selective dependency inclusion

**Build Process:**
- Client: Vite builds React app to `dist/public`
- Server: esbuild bundles Express server to `dist/index.cjs`
- Allowlist strategy bundles specific dependencies to reduce cold start times
- Static file serving from built client assets

**Environment Configuration:**
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string (auto-provided by Replit)
- `SESSION_SECRET`: Session encryption key
- `GEMINI_API_KEY`: Google AI API key
- `MAX_FILE_SIZE`: Upload limit (default 10MB)
- `NODE_ENV`: Environment mode (development/production)

**Third-Party UI Libraries:**
- Radix UI primitives for accessible components
- Lucide React for icon library
- date-fns for date formatting and manipulation
- class-variance-authority and clsx for conditional styling

## Recent Changes (November 2025)

### Teacher Exam Monitoring
- Added real-time monitoring page at `/oqituvchi/imtihonlar/:id/monitoring`
- Statistics bar showing: total students, started, submitted, problematic
- Live countdown timer displaying remaining exam time
- Student status cards with color-coded badges (waiting/in_progress/submitted/disqualified)
- Activity feed with timestamped events
- Auto-refresh every 5 seconds using React Query's refetchInterval
- End exam and add time functionality

### Performance Optimizations
- **Background AI Grading:** Exam submission now returns immediately while AI grading runs asynchronously in the background
- **Batch Database Queries:** Monitoring page uses batch loading for student answers and tickets to avoid N+1 queries
- **Merged Student Sources:** Students are collected from both targetGroups assignments and active exam sessions

### Anti-Cheat Improvements
- **Tab-Switch Protection:** Added `isSubmittingRef` flag to prevent false tab-switch violations during legitimate submission
- Detection disabled when submit dialog is open or during auto-submit on timeout
- Warning count tracked per session with disqualification at 3+ violations