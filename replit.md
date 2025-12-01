# Mon Budget en Or

## Overview

Mon Budget en Or is an educational budgeting game designed for students to learn financial literacy through interactive gameplay. Students join classes using unique codes, manage monthly budgets, pay fixed expenses, make purchasing decisions, and learn to distinguish between essential and non-essential spending. Teachers create classes, monitor student progress, and can create bonus expenses or challenges to enhance the learning experience.

The application is a full-stack web application with French-language UI, providing both teacher and student interfaces for managing budgets and tracking financial decisions in an educational context.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript running on Vite for fast development and builds.

**UI Component Library**: shadcn/ui components built on Radix UI primitives, providing accessible and customizable UI elements. The design system uses Tailwind CSS with custom color schemes and spacing based on a "New York" style variant.

**Routing**: wouter for lightweight client-side routing, with routes for landing, authentication, teacher setup/admin, student join/setup/dashboard, and catalog views.

**State Management**: TanStack Query (React Query) for server state management with custom query client configured for API requests. No global state management needed as data flows through React Query cache.

**Styling**: Tailwind CSS with custom design tokens for colors, spacing, and shadows. Uses CSS variables for theming and includes hover/active elevation effects for interactive elements.

**Form Handling**: React Hook Form with Zod validation via @hookform/resolvers for type-safe form validation.

**Data Visualization**: Recharts library for rendering budget charts, expense breakdowns, and financial progress visualizations on student dashboards.

### Backend Architecture

**Runtime**: Node.js with Express.js framework for HTTP server.

**Language**: TypeScript with ES modules enabled throughout the project.

**API Design**: RESTful API with endpoints organized by resource (classes, students, expenses, catalog items, challenges). Routes are registered in `server/routes.ts` and mounted on the Express app.

**Data Storage Strategy**: Pluggable storage interface (`IStorage`) with two implementations:
- `MemStorage`: In-memory storage using Map objects for development/testing
- `FileStorage`: JSON file-based persistence to `data.json` for simple deployment without database setup

This abstraction allows future migration to database storage (Drizzle ORM is configured for PostgreSQL via `@neondatabase/serverless`) without changing API routes.

**Session Management**: Configured to use either in-memory sessions (memorystore) or PostgreSQL-backed sessions (connect-pg-simple) based on environment.

**Build Process**: Custom build script (`script/build.ts`) that:
1. Bundles server code with esbuild, bundling specific dependencies to reduce cold start times
2. Builds client with Vite for optimized production assets
3. Outputs to `dist/` directory with static files in `dist/public/`

### Data Models

**Core Entities** (defined in `shared/schema.ts`):

1. **Class**: Classroom with unique code, teacher name, configurable expense amounts, and mode (predefined/custom/scenario)
2. **Student**: Student profile with name, budget, spent amount, savings, and reference to class
3. **CatalogItem**: Purchasable items with categories (food/clothing/leisure), prices, and essential/non-essential flags
4. **Expense**: Transaction records linking students to catalog items with feedback messages
5. **FixedExpense**: Recurring monthly expenses (rent, utilities, insurance) that students must pay
6. **BonusExpense**: Teacher-created surprise expenses to challenge students
7. **Challenge**: Class-level challenges created by teachers with participation tracking
8. **Badge**: Tiered achievement badges (bronze/silver/gold/platinum) awarded automatically based on performance
9. **SavingsGoal**: Student-defined savings targets with progress tracking

### Gamification System

**Badge Types & Tier Thresholds**:
- `first_purchase`: Awarded on first catalog purchase (always bronze)
- `saver`: Based on savings amount - bronze ($50), silver ($100), gold ($250), platinum ($500)
- `essential_master`: Based on essential purchase ratio - bronze (50%), silver (70%), gold (85%), platinum (95%)
- `budget_hero`: Based on remaining budget percentage - bronze (5%), silver (10%), gold (15%), platinum (25%)
- `challenge_complete`: Based on challenges completed - bronze (1), silver (3), gold (5), platinum (10)
- `monthly_survivor`: Based on months survived - bronze (1), silver (3), gold (6), platinum (12)

**Badge Checking**: POST `/api/students/:id/check-badges` evaluates all badge criteria and awards/upgrades badges automatically

**Class Challenges**: Teachers can create challenges with goals and rewards; students participate and track progress

**Leaderboard**: Teacher dashboard includes a leaderboard ranking students by savings, badges earned, and budget efficiency

**Validation**: Zod schemas (e.g., `insertStudentSchema`, `createClassSchema`) provide runtime type validation for API inputs, with drizzle-zod integration for potential database schema generation.

### External Dependencies

**UI Component Libraries**:
- Radix UI primitives (@radix-ui/*) for accessible, unstyled components
- shadcn/ui configuration for styled component patterns
- Recharts for data visualization
- Embla Carousel for image carousels
- Lucide React for consistent iconography

**Database/ORM** (configured but not currently active):
- Drizzle ORM with PostgreSQL dialect
- @neondatabase/serverless for Neon database connectivity
- drizzle-kit for migrations
- Schema defined in `shared/schema.ts` with migration output to `./migrations`

**Development Tools**:
- Vite with plugins for React, error overlay, and Replit integrations
- TypeScript with strict mode enabled
- ESBuild for server bundling in production

**Utilities**:
- date-fns for date manipulation
- nanoid/uuid for ID generation
- class-variance-authority and clsx for conditional CSS class management
- zod for schema validation
- wouter for routing

**Asset Management**: Static assets served from `attached_assets` directory, aliased as `@assets` in Vite config.

### Deployment Considerations

The application is designed to run on Replit with:
- Single-file JSON persistence (no external database required initially)
- Environment variable `DATABASE_URL` expected but optional (falls back to file storage)
- Build process creates self-contained `dist/` directory
- Production mode serves pre-built static assets from Express
- Development mode uses Vite middleware for HMR

Future database migration path exists through Drizzle ORM configuration, allowing transition from file-based to PostgreSQL storage by implementing database-backed storage class and running migrations.