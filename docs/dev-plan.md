# Modular Development Plan

This document outlines the recommended modular approach for building the forecasting tool web app. Each major feature or module should be developed in its own thread or context, always referring back to `project-brief.md` and this plan for consistency.

## 1. Core Foundations
- Set up the monorepo (Yarn workspaces, etc.)
- Create a shared types package (`/packages/shared`)
- Set up CI/CD basics (linting, formatting, type-checking, test scaffolding)

## 2. Authentication & User/Team Management (Thread 1)
- Integrate Supabase Auth (frontend & backend)
- Implement user sign-up, login, and session management
- Build team creation, invitation, and management flows
- Enforce team size and role-based access (UI & backend)
- Set up RLS policies and test them
- **Sign-Up Flow:**
  - When a user signs up and provides a team/company name, create a new team in the database.
  - Assign the user as the team owner and add them as the first member.
  - Link the user's profile to the newly created team via a `team_id` field.
  - After sign-up, redirect the user to the dashboard, which should display the team name and the user as a member.
- **Dashboard:**
  - On load, fetch the current user's profile and their associated team.
  - If no team is found, display a clear error and provide a way to create or join a team.
  - If a team is found, display the team name, all current members, and options to invite new members (if under the limit).
  - Ensure the "Invite" form is visible and functional for team owners.
- **Error Handling:**
  - If the team creation or linking fails during sign-up, show a clear error and do not proceed to the dashboard.
  - If the dashboard cannot find a team for the user, provide a way to recover (e.g., create a new team or contact support).
- **Deliverable:** Working user/team system with secure authentication and role-based UI
- Ensure the RLS policy for team creation (INSERT on teams) applies to the 'authenticated' role, not just 'public', so authenticated users can create teams.

## 3. Step-by-Step Assumptions Input Flow (Thread 2)
- Design UI flow for business type, launch date, go-to-market, etc.
- Implement dynamic form logic based on business model selection
- Validate and persist assumptions to backend
- **Update:** Client tiers are now associated with revenue streams, not the business profile. When a user adds a revenue stream and selects 'tiered pricing', they can create a new tier table (named after the stream, but editable) or select from existing tier tables. Each revenue stream can have its own or a shared tier table. Tier tables and tiers are managed in their own tables in Supabase, and linked to revenue streams.
- **Note:** When creating new tables in Supabase, always set appropriate Row Level Security (RLS) policies at creation to ensure user/org data isolation.
- **Deliverable:** Robust, guided assumptions input wizard

## 4. Forecast Engine & Data Models (Thread 3)
- Develop core forecasting logic as a reusable package (`/packages/forecast-engine`)
- Integrate with assumptions data model
- Write unit tests for all core logic
- **Deliverable:** Tested, modular forecasting engine

## 5. Output & Export (Thread 4)
- Implement CSV/XLSX export of forecasts
- Add summary deck/PDF export if in scope
- **Deliverable:** Downloadable, shareable forecast outputs

## 6. Admin Features & Advanced RBAC (Thread 5)
- Build admin dashboard and controls
- Implement advanced RLS and server-side validation
- **Deliverable:** Secure, scalable admin tooling

## 7. Documentation & Consistency (Ongoing, Thread 6)
- Keep `/docs` up to date as you build
- Document all APIs, data models, and UI flows
- Review each thread's output for consistency with the project brief

---

## Future or Periodic Actions

- Maintain a list of periodic or future actions (e.g., dependency upgrades, technical debt, or ecosystem changes).
- Each action should have an 'action on' date.
- If the 'action on' date is reached and the action is not marked complete, take the necessary action (e.g., upgrade dependencies, refactor code, etc.).
- After taking action, either update the 'action on' date to a new appropriate future date or remove the item from the list if resolved.
- Review this section regularly as part of ongoing project maintenance.

---

**How to Use This Plan:**
- Start a new chat thread for each major module/feature.
- Always reference `project-brief.md` and `dev-plan.md` in new prompts.
- Summarize decisions and outcomes in `/docs/update-log.md` for traceability.
- Cross-link threads if dependencies arise.
- Do regular "consistency checks" across threads.
- Regularly review the "Future or Periodic Actions" section and take action on any items that have reached their 'action on' date. Update or remove items as appropriate. 