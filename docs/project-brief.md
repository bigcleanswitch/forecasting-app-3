Project Brief: Forecasting Tool Web App for Startup Founders
---
This document uses standard Markdown heading levels to indicate hierarchy.

# for top-level sections
## for second-level
### for third-level, and so on
This enables clear navigation in Cursor, supports AI parsing and section folding, and avoids Markdown blockquote formatting issues.

---
# Overview
We are transforming a robust internal Google Sheets forecasting tool into a standalone web-based marketing and forecasting application targeted at startup founders. The goal is to provide an intuitive, guided platform that helps founders build financial forecasts (P&L, user growth, CAC, etc.) with minimal financial modeling knowledge.
The project will start by migrating the core logic from Google Sheets and Apps Script into a React/Next.js web app with a clean, founder-friendly interface, built for scale and extensibility.

---
# Goals
* Make complex forecasting logic accessible to non-technical, non-financial startup founders.
* Create a productised SaaS experience from an internal expert spreadsheet model.
* Replace manual spreadsheet workflows with automated, guided interactions.
* Establish a scalable architecture to later support:
    * Team collaboration
    * AI-powered guidance
    * Client-specific white-labelling
* Support team-based user accounts, allowing up to 5 users per team under a single license, with collaborative access and management.
* Ensure robust, scalable authentication and authorization for both founders and internal administrators.

---
# Phase 1 Scope (MVP)

## User Accounts & Team Management

This section outlines the functionality for user authentication and team-based collaboration, which is a core component of the MVP.

### Frontend UI for User & Team Management

#### Authentication Flows
* **Sign-Up Form Requirements:**
    * The sign-up form collects first name, last name, and email address as separate fields.
    * Users must provide a company or team name when creating a new team.
    * Password entry is separated from personal data fields and includes:
        * Password requirements: minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character.
        * Real-time validation feedback for password strength and requirements.
        * A "Confirm password" field that must match the original password.
        * Show/hide toggles for password fields to improve usability.
    * The form is grouped into logical blocks for personal info, team info, and password, to enhance clarity and user experience.
    * Users can sign up and log in with email/password.
    * Integration with OAuth providers (e.g., Google, GitHub) for simplified sign-in.
    * Support for magic link sign-in for passwordless access.
#### Team Creation & Joining
    * During sign-up, users can create a new team (becoming the owner) or join an existing team via an invite.
#### Team Dashboard
    * Display team name, current members, and license status.
    * Enable team owners to invite up to 4 additional users (maximum of 5 users per team).
    * Provide functionality to manage pending invitations (resend/revoke).
    * Allow team owners to remove users or transfer team ownership.
#### License & Limit Warnings
Clearly display license status and provide visual warnings when approaching or exceeding the user limit.

#### Role-Based UI Adaptations
The UI will adapt based on the user's role, showing administrative features (e.g., team management options) only to authorized users (team owners or internal administrators).

### Backend Logic for User & Team Management

* **User Model:** Stores user details, their associated team, and their role within that team (e.g., `owner`, `member`).
* **Team Model:** Stores team details, the team owner's ID, current license status, and a list of associated user IDs.
* **Authentication & Session Management:** Securely handles user sign-up, login, and session persistence.
* **Authorization Enforcement:**
    * Ensures only authenticated team members can access their team's data.
    * Restricts team management functions (e.g., inviting/removing users, changing ownership) to team owners.
* **Invitation System:** Generates unique invite links or codes for users to join teams. Tracks pending invitations and enforces the maximum user limit per team.
* **License Enforcement:** Programmatically enforces the maximum of 5 users per team. License status is checked during login and when new users are invited.

### Technical Implementation for User & Team Management

We will leverage **Supabase** for robust and scalable authentication and authorization:

* **Supabase Auth:** Manages all user authentication flows (signup, login, password reset, session tokens). It handles the underlying JWT generation and validation.
* **PostgreSQL `profiles` Table:** A dedicated `profiles` table in our Supabase PostgreSQL database will store extended user metadata, including their assigned `role` (e.g., `'paying_user'`, `'admin'`) and a foreign key link to Supabase Auth's `auth.users` table. This table will also store team associations.
* **JWT Custom Claims:** User roles will be embedded as custom claims within the JWTs issued by Supabase Auth. These claims (`auth.jwt()->>'role'`) will be accessible on both the frontend (for UI rendering) and backend (for authorization checks).
* **PostgreSQL Row Level Security (RLS):** RLS policies will be extensively used to enforce fine-grained access control directly at the database level.
    * `paying_user` policies will restrict data access to only their own forecasts and team data (e.g., `auth.uid() = user_id` and `user_id IN (SELECT user_id FROM team_members WHERE team_id = current_team_id)`).
    * `admin` policies will grant broader read/write permissions for administrative tasks, as appropriate.
* **Service Role Key:** For highly privileged administrative operations (e.g., programmatically assigning admin roles, overriding limits for testing), the Supabase `service_role` key will be used exclusively in secure, server-side environments (e.g., Next.js API routes, Supabase Edge Functions), **never exposed client-side.**
* **Server-Side Validation:** All sensitive backend operations will perform explicit validation of user roles and permissions based on the JWT, providing a crucial "defense in depth" beyond RLS.

- **RLS Policy for Team Creation:**
  - The insert policy for the teams table now applies to the 'authenticated' role, not just 'public'.
  - This ensures only authenticated users can create teams, as required by Supabase RLS.

## Core Forecasting Functionality

This section details the primary workflow for founders to build and manage their financial forecasts.

### Frontend UI
* **Step-by-step flow for founders to input assumptions:**
    * Business type, launch date, user acquisition strategy
    * Pricing assumptions (B2B/B2C/B2B2C, SaaS vs service vs product, etc revenue)
    * User growth assumptions (clients vs consumers, S-curve vs linear)
    * Key cost drivers (team, acquisition, infrastructure)
* **Interactive tables or cards for:**
    * Revenue forecast
    * Headcount and cost growth
    * Optional inputs: funding rounds, margins, CAC/LTV
* **Instant feedback or visualisation** as inputs change

### Backend Logic
* **Rebuild key logic from Apps Script:**
    * S-curve generation (logistic curves)
    * Tiered revenue and cost modeling
    * Referral, partner, and infrastructure costs
* **Store user sessions and inputs:** Persist all founder-provided data (e.g., forecast assumptions, results) in the database (PostgreSQL via Supabase).
* **Support draft saving and resumable sessions:** Allow users to save incomplete forecasts and return to them seamlessly.

## Output and Export
* **Export full forecast as:**
    * Monthly P&L CSV or XLSX
    * Key metrics summary (MRR, user growth, burn)
* **Optional:** PDF summary deck generation for investors

---
# Technical Considerations
## Technology Stack Decision
This section outlines the rationale behind the selected technologies for the web application.

### Frontend: TypeScript + React (Next.js)
* Type safety with TypeScript reduces runtime bugs and improves developer productivity.
* React (via Next.js) provides:
    * Component-based UI
    * Server-side rendering and static generation
    * Optimised routing for a step-by-step assumption flow

### Backend Options
* **Option A: TypeScript (Node.js + Express or tRPC)**
    * Unified language across frontend and backend
    * Reduces friction in API design and shared types
    * Serverless-friendly and fast to develop
* **Option B: Python (FastAPI)**
    * Ideal for complex forecasting logic and numerical processing
    * Supports scientific packages like NumPy and Pandas
    * Better suited if porting logic from existing spreadsheet scripts
* Decision between A and B depends on complexity of forecast calculations. Start with Node.js for tighter integration; move to Python if number crunching grows in sophistication.

### Database: PostgreSQL (via Supabase or Prisma)
* Relational model suits assumptions, timelines, forecast versions.
* **Supabase** offers built-in authentication, RLS, and admin tools, making it a strong choice.
* Prisma (if using Node.js) offers elegant ORM for Postgres.

### Hosting and Deployment
* Vercel or Render for fast CI/CD and simple hosting.
* GitHub for version control and integration with Cursor workflows.

---
# Summary

| Layer         | Technology                  | Rationale                                    |
| :------------ | :-------------------------- | :------------------------------------------- |
| Frontend      | TypeScript + React + Next.js | Modern, robust UI with step-based flows      |
| Backend       | Node.js (TypeScript) or Python (FastAPI) | Depends on forecasting complexity            |
| Database      | PostgreSQL (Supabase/Prisma) | Structured data, scalable and developer-friendly |
| Hosting       | Vercel or Render            | Seamless deployment for full stack           |
| CI/CD         | GitHub + Cursor             | Auto-deploy + collaborative dev              |

* **Stack Preference:** Next.js and Tailwind for UI, Python or Node.js for logic
* **State Management:** React Context or Zustand (lightweight)
* **Deployment:** Vercel or Render for MVP
* **Storage:** Supabase or Postgres for auth, inputs, and forecast storage
* **CI/CD:** GitHub and Cursor workflows

---
# Step-by-Step Assumptions Input Flow

This section outlines the structured workflow for startup founders to input the foundational assumptions that drive their financial forecast. The app guides users through each step interactively, making it accessible for non-finance users while preserving the sophistication needed for serious forecasting. Inputs are then dynamically translated into structured outputs (e.g. user growth, revenue streams, and P&L forecasts).

Critically, the information provided by the founder in this section determines both the structure of the user interface (i.e. what questions they are shown) and the underlying logic used in the forecast model. For example, a B2C business will not be prompted to enter client acquisition assumptions, while a B2B2C business will be required to model both client numbers and user onboarding patterns.

## 1. Business Type, Launch Date, and Go-to-Market Strategy

Founders begin by defining the core identity and timeline of their business. These inputs shape how the forecasting model interprets user acquisition, monetisation logic, and cost timelines.

### Business model category
Choose one of the following mutually exclusive and collectively exhaustive (MECE) business types:

-   **B2C (Business-to-Consumer):** Direct sales to individual users or households.
-   **B2B (Business-to-Business):** Sales to other businesses that are the end users of the product/service.
-   **B2B2C (Business-to-Business-to-Consumer):** Partnering with a business to reach and serve end consumers (e.g. via employers, councils, housing providers).
-   **Marketplace:** Connecting multiple buyer and seller types with a transaction or matchmaking mechanism.
-   **API/Platform:** Providing backend services, data infrastructure, or integration capabilities consumed by other developers or businesses.
-   **Hybrid:** Combining two or more of the above (e.g. a B2B2C platform with optional direct B2C upsell).

### Launch timeline
-   Input actual or intended product launch date (e.g. MVP live, soft launch, or full commercial rollout).
-   Option to specify pre-revenue ramp period (e.g. pilot phase, sales cycle length).

### Go-to-market channels
-   Select one or more: direct sales, partnerships, retail, platform integrations, employer rollouts, etc.
-   Optional: specify per-channel effectiveness (e.g. estimated lead time, cost per acquisition, conversion rates).

### Client tiering by audience size
Founders with B2B or B2B2C models are prompted to define tiers of clients based on their typical audience reach. These tiers help structure revenue forecasts, onboarding assumptions, and infrastructure load.

By default, the app provides a standard tier set:

| Tier bottom | Tier top      |
| :---------- | :------------ |
| 100         | 1,000         |
| 1,001       | 5,000         |
| 5,001       | 10,000        |
| 10,001      | 25,000        |
| 25,001      | 50,000        |
| 50,001      | 100,000       |
| 100,001     | 250,000       |
| 250,001     | 500,000       |
| 500,001     | 1,000,000     |
| 1,000,001   | 5,000,000     |
| 5,000,001   | Unlimited     |

Users may customise tiers if they prefer, but the interface validates the input to ensure there are no overlaps or gaps (e.g. it won't allow one tier to end at 1,000 and the next to start at 1,050).

The final tier is defined programmatically using a high upper limit (e.g. 99,999,999) rather than literal "infinity" to maintain compatibility with numeric comparison logic.

## 2. Pricing Assumptions

Many businesses – including complex models like Energy Helper – generate revenue through multiple streams. The app supports the definition of multiple revenue streams, each of which can be configured independently using the appropriate revenue model. Founders are guided through the setup of each stream in turn, with forecasts rolled up automatically into the overall financial model.

Revenue forecasts are shaped by how the product is monetised – whether through subscriptions, one-off fees, tiered pricing, or commission-based structures.

### Revenue model type and tiering logic
For each revenue stream, select the most appropriate monetisation structure. These are defined by the underlying pricing logic, not by modifiers like "tiered" which can apply across categories:

-   **Recurring pricing:** Subscription-like charges paid regularly (monthly or annually), commonly used in SaaS and services.
-   **One-off pricing:** Single, non-recurring charges for discrete services or products (e.g. audits, installations).
-   **Per-unit or volume-based sales:** Revenue linked to the number of items sold, most often used in retail and commerce (e.g. grocery store sales).
-   **Commission-based or revenue share:** Earnings generated as a percentage or fixed fee from third-party sales, referrals, or usage.
-   **Freemium or pay-as-you-go:** Free tier with monetised usage-based limits or feature access (e.g. API credits, unlocks).

Modifiers such as tiered pricing, minimum guarantees, and uplift/indexation can be applied across any of the above structures. These modifiers are configured per revenue stream.

Founders can define multiple revenue streams and assign a different model type to each, enabling hybrid or layered business models.

-   **B2B example:** employers in tier X pay £X/user/year up to X users, when they pay £Y/user/year, with a minimum guarantee
-   **B2C example:** users pay £X/month, with optional upgrades
-   **Option to split revenue lines across different models** (e.g. platform fee + transaction revenue)

### Tiered pricing logic
-   Founders can choose to apply tiered pricing to any revenue stream (e.g. user-based fees, product unit sales, or commission bands).
-   In B2B2C contexts, the interface allows the user to either:
    -   Apply a single user-based pricing model across all client tiers
    -   Define separate user-based pricing structures for each client tier
-   Tier configurations support:
    -   Tier thresholds (min/max volume per band)
    -   Per-unit or per-user price per tier
    -   Optional annualisation of pricing (e.g. £X per user per year vs £Y per month)
-   Validation ensures tiers are mutually exclusive and collectively exhaustive

### Minimum guarantees
-   Founders can define minimums that apply to each client or revenue stream
-   The interface supports the following mutually exclusive guarantee structures:
    -   Fixed monetary amount per month (e.g. £1,000/month baseline)
    -   Minimum number of users per month, charged at the applicable per-user rate
    -   Minimum number of users per year, with billing pro-rated monthly
    -   Annual revenue floor, with monthly tracking and top-up logic
-   Founders can specify whether guarantees are:
    -   Offset against usage (i.e. usage charges count toward meeting the guarantee)
    -   Top-up only (i.e. additional payment is made if actual usage falls short)
-   Input fixed monthly or annual minimums (e.g. £7.5k/year baseline fee per enterprise client)
-   Specify how minimums interact with usage (e.g. offset vs additive)

### Uplifts & indexing
-   Include expected annual price increases or indexation clauses
-   Model different uplift assumptions for core pricing vs add-on services

## 3. User Growth Assumptions

User growth is one of the most critical drivers of both revenue and cost forecasts. The app supports nuanced, tiered modelling that captures the realities of client acquisition, user adoption, and churn.

Before detailing client and user-level growth structures, the app prompts the founder to define key curve-shaping parameters that govern the dynamics of user and client adoption. These include:

-   **Curve steepness** – Determines the rate of acceleration and deceleration in the growth pattern (i.e. how 'sharp' the S curve is)
-   **Curve offset** – Delays the onset of meaningful growth by a defined number of months, simulating realistic lags (e.g. onboarding, sales cycles)
-   **Curve length** – The total duration over which adoption occurs. This may be:
    -   Defined by the client acquisition period (e.g. Sept 2024 to Dec 2028)
    -   Or defined by the assumed user rollout period within each client (e.g. 6-month or 12-month onboarding)

These inputs enable flexible modelling of both macro and micro user growth patterns across different business types.

To begin with, we will allow site users to configure S curve growth patterns, though we might add other growth shapes in future.

### Client growth (for B2B/B2B2C models)
-   Define target number of clients by key dates (e.g. 50 employers by Dec 2028)
-   Set growth start date and cap date (e.g. acquisitions cease Dec 2028 but users keep growing)
-   Choose S-curve logic for realistic ramp-up (e.g. slow early growth, steep middle, plateauing)
-   Allow different assumptions for each client type/tier (e.g. corporate, enterprise, councils)

### User adoption per client
-   Define how users onboard over time within each client (e.g. 12-month rollout curves)
-   Use client-type-specific S-curves or linear models
-   Support for retention/churn assumptions and contract renewal logic

### Direct user acquisition
For B2C or hybrid models, users define the number of customers acquired per month at a defined starting point in time for each acquisition channel.

Supported acquisition channels include:
-   Organic (e.g. SEO, content marketing)
-   Paid media (e.g. paid social, PPC)
-   Referral-driven (e.g. user invites, viral loops)
-   Partnership-driven (e.g. employers, landlords)

These input points form the basis for an S-curve adoption trajectory, shaped by the previously defined curve steepness, offset, and length.

-   Acquisition volume can vary by channel, and the system interpolates between defined time points to model growth trajectories for each.

### Integration with customer acquisition costs
-   Founders may optionally specify a cost per acquired user per channel at one or more points in time (e.g. "£500 in Sept 2024, falling to £50 by Dec 2028").
-   The system will interpolate between these points to produce a time-varying customer acquisition cost curve.
-   This ensures marketing and acquisition costs scale realistically with channel maturity, efficiency improvements, or shifts in strategy.

-   Set client renewal rates (e.g. 85% of clients renew at 12 months)
-   Set user retention and attrition (e.g. 75% still active after 24 months)
-   Apply rolling cohort-based churn logic

## 4. Key Cost Drivers

Cost assumptions are captured in a modular structure that separates fixed, variable, and tiered components – enabling granular, defensible forecasts.

### Team and salaries
-   Define headcount plans by role or function
-   Assign start dates, base salaries, inflation uplifts, and prorated on-costs (e.g. pensions, NI)
-   Add one-off hiring costs or consultancy equivalents

### Customer acquisition
-   Input assumptions for:
    -   Cost per lead / cost per acquisition by channel
    -   Marketing budget as % of revenue or flat monthly
    -   Sales team costs tied to headcount or deal volume

### Product and infrastructure
-   SaaS infrastructure costs modelled using tiered or usage-based pricing (e.g. AWS, Onzo, SendGrid)
-   Apply real-world tiered pricing tables (e.g. £0.05 per user for first 5k users, £0.03 thereafter)
-   Include internal vs external cost attribution (e.g. partner APIs, data licensing)

### Assessment or delivery costs
-   For services like energy audits or installations, model cost per unit based on supplier tiers
-   Minimum guarantees enforced where applicable (e.g. £1,000/month minimum with BTS)

### Overheads and operations
-   Add assumptions for insurance, office, software, professional services
-   Choose fixed monthly or index-linked values

---
The assumptions captured here directly inform both the UI flow and the backend forecast logic. See the 'Frontend UI' and 'Backend Logic' sections for implementation details.

---
# Deliverables for Cursor Implementation
* `AssumptionsForm.tsx` – step-by-step form with contextual inputs
* `assumptionsSchema.ts` – typed schema for all business inputs
* `generateForecastInputs.ts` – input processing engine
* `sCurveGenerator.ts` – reusable S-curve builder
* `forecastEngine.ts` – modular revenue and cost forecast engine
## Exports:
* `generateCSV.ts`
* `generateDeckSummary.ts`
* Authentication and session state handling with auto-save

---
# Repository Structure & Tooling Setup
## Monorepo Setup with Yarn Workspaces
This project now uses Yarn Workspaces for a clean, maintainable monorepo architecture. This supports multiple apps (e.g. frontend, backend) and shared packages (e.g. forecasting logic, type definitions).

## Key Directories
* `/apps/frontend`: Next.js frontend application
* `/packages/`: location for shared libraries and logic (e.g. `forecast-engine`, `shared-types`)
* `/prisma/`: database schema and Prisma client (optional; not yet active)
* `/docs/`: governing markdown files (e.g. `project-brief.md`, `update-log.md`)

## Tooling Status
* Root `package.json` defines Yarn workspaces for `apps/*` and `packages/*`
* Yarn installed globally (via Homebrew)
* `yarn install` run successfully to activate workspace dependency linking
* `"postinstall": "prisma generate"` removed temporarily to bypass missing schema

## Next Steps
* Create `prisma/schema.prisma` before re-enabling the postinstall script
* Use `yarn workspace <package> add <dependency>` to manage scoped dependencies cleanly
* Add shared forecasting logic or assumption schemas to `/packages/`

---
2025-06-17: Initial draft of structured project brief and expanded step-by-step input flow

- **Team Creation and Linking:**
  - When a new user signs up and provides a team/company name, the system must:
    - Create a new team record in the database.
    - Assign the user as the team owner and add them as the first member.
    - Link the user's profile to the team via a `team_id` field.
    - Ensure atomicity: if any part of this process fails, roll back and show an error.

- **Dashboard Experience:**
  - The dashboard must always display the current user's team (if any), the list of team members, and management options.
  - If the user is not part of a team, prompt them to create or join one.

# Recent UI and Data Model Improvements (2025-06)

- The business profile page now loads and saves data persistently for each team, ensuring that saved changes are always reflected when users return to the page.
- A unique constraint was added to the `team_id` column in the `business_profiles` table to prevent duplicate rows and ensure upserts update the correct record.
- The Client Tiers UI was improved to display numbers with thousand separators, provide clear spacing between fields and labels, and normalize font size and weight to match the rest of the UI.
- All elements in each client tier row are now vertically centered, and consistent vertical spacing is applied between rows for a more balanced and readable layout.

## Revenue Stream-Specific Tiered Pricing (2025-06 Update)

- Client tiers are now associated with individual revenue streams, not the business profile.
- When a user adds a revenue stream and selects 'tiered pricing', they can create a new tier table (named after the stream, but editable) or select from existing tier tables.
- Each revenue stream can have its own or a shared tier table. Tier tables are named, editable, and can be reused across streams.
- Tier tables and tiers are managed in their own tables in Supabase, and linked to revenue streams.
- All new Supabase tables must have Row Level Security (RLS) policies set at creation to ensure user/org data isolation.
