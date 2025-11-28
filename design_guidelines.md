# Design Guidelines: Mon Budget en Or

## Design Approach

**Selected Approach:** Design System (Material Design-inspired) with Educational Gamification
**Justification:** This is a utility-focused educational tool requiring clear information hierarchy, consistent interactions, and intuitive data display. While engagement is important for students, clarity and learnability take precedence.

**Key Design Principles:**
- Clear financial information hierarchy
- Immediate visual feedback for decisions
- Intuitive, game-like progression
- Scannable budget summaries
- Student-appropriate professionalism

---

## Typography

**Font Families:**
- Primary: Inter or Roboto (Google Fonts) - clean, modern readability
- Accent: Poppins or Montserrat for headings - friendly, approachable

**Hierarchy:**
- H1 (Page titles): 2.5rem, bold - "Mon Budget en Or"
- H2 (Section headers): 2rem, semibold - "Catalogue", "Budget Summary"
- H3 (Card titles): 1.5rem, medium - Item names, categories
- Body: 1rem, regular - Descriptions, instructions
- Small text: 0.875rem - Secondary info, hints
- Budget numbers: 1.75rem, bold - Income, expenses, remaining balance
- Feedback messages: 1.125rem, semibold - Decision alerts

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Consistent padding: p-4 for cards, p-6 for sections, p-8 for main containers
- Margins: mb-4 between elements, mb-8 between sections
- Gaps: gap-4 for grids, gap-6 for major separations

**Grid Structure:**
- Dashboard: 2-column layout (desktop) - Budget summary sidebar + main content area
- Catalog: 3-4 column grid for items (responsive to 2 cols tablet, 1 col mobile)
- Mobile: Single column stack with sticky budget header

---

## Component Library

### Core Dashboard Components

**Budget Header (Sticky)**
- Prominent monthly income display with icon
- Real-time remaining budget counter
- Expense breakdown bar (rent, food, clothing, leisure)
- Quick stats: Saved, Spent, Warnings count

**Decision Feedback Cards**
- Success card: "💸 Bravo ! Tu économises !" with savings amount
- Warning card: "⚠ Dépassement" with overspending details
- Toast-style notifications appearing top-right
- Dismissible with subtle slide-in animation

**Shopping Catalog Cards**
- Product image placeholder (food/clothing items)
- Item name and price prominently displayed
- "Acheter" (Buy) button
- Optional: "Nécessaire" or "Plaisir" badge to guide decisions
- Hover state: subtle elevation increase

**Budget Summary Panel**
- Fixed expenses section (rent) with paid/unpaid status
- Category spending breakdown with progress bars
- Decision history timeline (chronological list)
- Savings goal indicator (if applicable)

### Navigation

**Top Navigation Bar:**
- Logo/title "Mon Budget en Or" left-aligned
- Main navigation: Tableau de bord, Catalogue, Loisirs, Historique
- User/student name display right-aligned
- Month/period indicator

**Category Tabs (Catalog):**
- Horizontal tab navigation: Nourriture, Vêtements, Loisirs
- Active state with underline indicator
- Icon + label for clarity

### Forms & Interactions

**Purchase Flow:**
- Modal overlay for purchase confirmation
- Item details recap
- Impact on budget preview ("Il te restera X$")
- Confirm/Cancel buttons

**Rent Payment:**
- Dedicated prominent card
- Due date indicator
- One-click payment button
- Payment confirmation with celebration feedback

### Data Display

**Expense Breakdown:**
- Horizontal stacked bar chart showing category distribution
- Category labels with amounts
- Visual comparison against budget limits

**Decision History:**
- Timeline-style list with icons
- Each entry: timestamp, action, amount, feedback badge
- Color-coded borders (success/warning) without specifying actual colors

**Progress Indicators:**
- Circular progress for budget usage
- Linear bars for category limits
- Numerical displays alongside visuals

---

## Responsive Behavior

**Desktop (1024px+):**
- Sidebar budget summary (fixed, 300px width)
- 3-4 column catalog grid
- Side-by-side comparisons enabled

**Tablet (768px-1023px):**
- Collapsible budget sidebar or top panel
- 2 column catalog grid
- Stacked forms

**Mobile (<768px):**
- Sticky budget header (collapsed view, expandable)
- Single column everything
- Bottom navigation for main sections
- Full-width cards and buttons

---

## Images

**Hero Section:** None required - This is a functional dashboard application, not a marketing page

**Catalog Item Images:**
- Food items: Simple illustrations or icons representing groceries, meals
- Clothing items: Simple garment illustrations (shirt, pants, shoes)
- Leisure activities: Icons representing movies, sports, games
- Size: Square aspect ratio, 200x200px placeholders
- Placement: Top of each catalog card
- Style: Consistent illustration style, friendly and approachable

**Empty States:**
- Illustration for empty decision history
- Visual for completed month celebration

---

## Animation Guidelines

**Minimal, Purposeful Only:**
- Feedback cards: Slide-in from right (0.3s ease-out)
- Budget update: Number count-up animation (0.5s)
- Purchase confirmation: Modal fade + scale (0.2s)
- NO scroll animations, parallax, or decorative effects
- Button interactions: Standard hover/active states only

---

## Accessibility

- All monetary values have clear labels and context
- Form inputs with visible labels, not just placeholders
- Keyboard navigation for all purchase flows
- ARIA labels for budget indicators and progress bars
- High contrast between text and backgrounds throughout
- Focus states visible on all interactive elements