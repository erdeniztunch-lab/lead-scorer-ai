

# LeadScorer.ai — Dashboard & Landing Page

## Color Scheme
- **Primary:** Deep blue (`hsl(220, 60%, 20%)`) — trust, focus
- **Accent:** Green (`hsl(150, 60%, 45%)`) — action, success
- **Destructive/Hot:** Orange-red for high-priority leads
- **Neutral grays** for backgrounds, borders, muted text
- **White cards** on light gray background — clean, scannable

---

## Landing Page (`/`)

### Above the Fold
- **Nav:** Logo left, "Log In" + "Get Started Free" CTA right
- **Hero Section:**
  - H1: *"Rank your inbound leads. Contact the highest-value opportunities first."*
  - Subheadline: *"LeadScorer.ai uses AI to score and prioritize your e-commerce leads so your sales team closes more, faster."*
  - Primary CTA button: **"Upload your CSV and see top leads now →"**
  - Secondary link: "See how it works ↓"

### How It Works (3 steps, icon + short copy)
1. **Upload** — "Drop your CSV of leads or connect your CRM."
2. **Score** — "AI ranks leads by purchase intent, engagement, and fit."
3. **Act** — "Contact top leads first with one-click outreach."

### Dashboard Preview Section
- Static mockup/screenshot of dashboard with 3 annotated callouts:
  - "See why each lead ranks high"
  - "One-click email, call, or LinkedIn"
  - "Track team speed with KPIs"

### Social Proof
- 3 placeholder testimonial cards (avatar, name, company, quote)
- Trust badges: "Used by 200+ SMB stores"

### Final CTA
- Repeat hero CTA: "Start scoring leads — free"

### Footer
- Minimal: links to Privacy, Terms, Contact

---

## Dashboard (`/dashboard`)

### Layout: Sidebar + Main Content

**Sidebar (collapsible):**
- Logo
- Nav: Leads, Analytics, Settings
- User avatar + logout at bottom

**Main Content — Top Bar:**
- Page title: "Lead Queue"
- Filter bar: Source dropdown, Priority tier (Hot/Warm/Cold toggle), Engagement score slider, Date range picker
- Search input

**KPI Summary Row (4 cards):**
1. **Total Leads** — count
2. **Time to First Contact** — avg duration
3. **Precision@10** — percentage
4. **Lift** — multiplier value

**Lead Table (primary content):**
- Columns: Rank, Name, Company, Score (color-coded badge), Top 2 Reasons (pill badges), Source, Last Activity, Actions
- Each row shows:
  - Score as colored badge (green/yellow/red)
  - Two reason pills (e.g., "High engagement", "Recent purchase intent")
  - Action buttons: Email icon, Phone icon, LinkedIn icon
- Expandable row: Gemini AI explanation paragraph + full lead details

**Pagination** at bottom

---

## Component List
- `LandingPage` — hero, how-it-works, preview, social proof, footer
- `Dashboard` — layout wrapper with sidebar
- `LeadTable` — sortable, filterable table with expandable rows
- `KPICard` — reusable stat card
- `FilterBar` — dropdowns, slider, date picker
- `LeadActionButtons` — email/call/LinkedIn quick actions
- `ReasonBadge` — pill showing score reason
- `ScoreBadge` — color-coded score indicator
- `TestimonialCard` — avatar + quote placeholder
- `HowItWorksStep` — icon + title + description

---

## Pages & Routes
- `/` — Landing page
- `/dashboard` — Main dashboard with lead queue

All data will be mock/hardcoded for MVP. No backend required initially.

