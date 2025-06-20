# Update Log

## 2025-06-18 15:15: Dependency Warnings (Periodic Action)

### Context
- During `yarn install`, several warnings were observed regarding deprecated or soon-to-be-unsupported dependencies (e.g., ESLint 8.x, rimraf, glob, inflight, @humanwhocodes/config-array).
- These do not currently break the workflow and are common in the Node/JS ecosystem.
- ESLint 9 is not yet supported by TypeScript ESLint plugins, so we are staying on ESLint 8 for now.

### Action Required
- **Action on:** 2025-09-18
- On or after this date, review the dependency warnings and update dependencies as appropriate (e.g., upgrade to ESLint 9 if supported, update or replace deprecated packages).
- If action is taken, update the 'action on' date to a future review date or remove this entry if resolved.
- If not yet resolved, keep this entry and review again at the next interval.

## 2025-06-18 15:30: Core Foundations Setup

### Changes Made
- Set up monorepo structure using Yarn workspaces
- Created shared types package (`/packages/shared`) with initial type definitions for:
  - Business models (B2C, B2B, B2B2C, etc.)
  - Revenue models (Recurring, OneOff, PerUnit, etc.)
  - User and team management
  - Forecast data structures
- Implemented development tooling:
  - TypeScript configuration
  - ESLint for code linting
  - Prettier for code formatting
  - Build and development scripts

### Technical Decisions
- Chose Yarn workspaces for monorepo management due to its robust package management and workspace features
- Selected tsup for the shared package build tool due to its simplicity and TypeScript support
- Implemented strict TypeScript configuration to ensure type safety across the project
- Set up ESLint with TypeScript support and Prettier integration for consistent code style

### Next Steps
- Begin implementation of Authentication & User/Team Management (Thread 1)
- Set up Supabase integration for authentication and database
- Create initial Next.js application structure

---

## 2025-06-18 15:45: Authentication & Team Management Implementation

### Changes Made
- Implemented authentication system using Supabase
- Created team management functionality with role-based access
- Added team invitation system with a 5-member limit
- Set up database schema with RLS policies
- Created UI components for authentication and team management

### Technical Decisions
- Used Supabase for authentication and database management
- Implemented Row Level Security (RLS) for data protection
- Created a modular team management system
- Used TypeScript for type safety across the application

### Next Steps
- Begin implementation of Step-by-Step Assumptions Input Flow (Thread 2)
- Set up email notifications for team invitations
- Add team settings and customization options

---

## 2025-06-18 15:52: Supabase Setup Required

### Context
- The authentication and team management implementation requires a Supabase project
- No Supabase project has been created or configured yet
- The current implementation is theoretical and cannot be used without Supabase credentials

### Action Required
- Create a Supabase project
- Configure environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Run the database migrations in the Supabase project
- Test the authentication and team management features

### Next Steps
1. Create a Supabase project
2. Configure the project settings
3. Run the database migrations
4. Update the frontend with the Supabase credentials
5. Test the implementation

---

## 2025-06-18 16:20: Supabase Integration & Initial Testing

### Changes Made
- Created a new Supabase project for the app
- Added Supabase credentials (URL and anon key) to `/apps/frontend/.env.local`
- Fixed the order of table creation in the migration SQL to resolve foreign key errors
- Successfully ran the migration in the Supabase SQL editor
- Started the local Next.js app and attempted to access authentication features

### Observations
- Authentication middleware correctly prompts for sign-in when not authenticated
- No sign-up function or page is currently visible in the app, which is a blocker for new user registration

### Next Steps
- Implement or fix the sign-up page/component so new users can register
- Test full authentication and team management flows once sign-up is available

## 2025-06-18 16:40: Sign-Up Form Redesign & UX Improvements

### Changes Made
- Redesigned the sign-up form to use separate fields for first name and last name (instead of a single full name field)
- Grouped fields into logical blocks: personal info (first name, last name, email), team/company name, and password
- Added a confirm password field and enforced password match validation
- Added password requirements (min 8 chars, upper/lowercase, number, special character) and real-time validation feedback
- Added show/hide toggles for password fields
- Improved overall user experience and accessibility of the sign-up process

### Next Steps
- Test the new sign-up flow with various edge cases
- Update documentation and project brief to reflect the new requirements

## 2025-06-18 17:10: Sign-In Debugging and Logging

### Changes Made
- Investigated issue where clicking the sign-in button did not result in a visible error or successful login
- Confirmed that the sign-in handler was being called and the loading state was set, but no error was shown and no redirect occurred
- Added detailed `console.log` logging to the sign-in handler to capture and display the full response from `supabase.auth.signInWithPassword` for further troubleshooting

### Next Steps
- Attempt sign-in and review the console output for error or data details
- Use the logged information to diagnose and resolve any remaining authentication issues

## 2025-06-18 17:40: Supabase Client Refactor and Linter Fixes

### Changes Made
- Migrated all relevant frontend files to use the new Supabase browser client from `@/lib/supabase-browser` for proper session sharing
- Updated imports in `dashboard`, `sign-in`, `sign-up`, and `join-team` pages
- Created a server-side Supabase client at `@/lib/supabase-server` for future SSR or API use
- Fixed linter errors and unclosed JSX tags in the sign-up page

### Next Steps
- Restart the development server to ensure all changes are picked up and session sharing works as expected

## 2025-06-19: Clarified Team Creation, Linking, and Dashboard Requirements

### Changes Made
- Updated dev-plan.md to specify atomic team creation and user linking during sign-up, and detailed dashboard requirements for team/member display and error handling.
- Updated project-brief.md to explicitly require atomic team creation/linking and robust dashboard experience.

### Rationale
- Users reported that after sign-up, the dashboard did not display their team or allow member management, despite providing a team name.
- These changes ensure a reliable, user-friendly onboarding and team management experience, and clarify expected system behavior for developers.

## 2025-06-19: Improved UX for Unconfirmed Users in Sign-Up Flow

### Changes Made
- Updated the sign-up flow to check if email confirmation is required (i.e., no session returned after sign-up).
- If confirmation is required, the user now sees a clear message: 'Registration successful! Please check your email to confirm your account before continuing.'
- Prevented further actions (like team creation) until the user confirms their email and signs in.

### Rationale
- Prevents confusing errors (401/403) for users who have not yet confirmed their email.
- Provides a clear, user-friendly next step after registration.

## 2025-06-19: Fixed RLS Policy for Team Creation

### Changes Made
- Updated the RLS policy for the teams table so that the insert policy applies to the 'authenticated' role (not just 'public').
- This allows authenticated users to create teams, resolving the 403 error during onboarding and team creation.

### Rationale
- Supabase assigns the 'authenticated' role to users after login. The previous policy only applied to 'public', so authenticated users were blocked by RLS.
- This change ensures the correct permissions for team creation.

## 2025-06-20: Business Profile Separation, Navigation Refactor, and UI/TypeScript Fixes

### Changes Made
- Split the business profile (business type, start date, end date, go-to-market channels, client tiers) into its own flow/page (`/business-profile`), separate from the assumptions flow.
- Renamed 'launch date' to 'start date' and added an 'end date' field to the business profile to determine the modelled period.
- Updated the assumptions flow to start with pricing, removing business model, start/end date, go-to-market, and client tiers from this flow.
- Created a persistent navigation bar (Dashboard, Business Profile, Assumptions, Data Sheets) as a client component, imported into the server layout for all pages.
- Refactored layout to avoid Next.js 'use client' and metadata export conflict by moving the navbar to its own file.
- Fixed all related navigation and rendering errors (including usePathname and metadata export issues).
- Updated TypeScript config as needed for Next.js suggestions (e.g., allowJs, isolatedModules).

### Rationale
- Improves clarity and separation of concerns between business profile and assumptions.
- Provides a consistent, user-friendly navigation experience across the app.
- Resolves technical issues with Next.js App Router and React hooks in layouts.

### Next Steps
- Review and update the project brief to reflect:
  - The new separation of business profile and assumptions flows.
  - The renaming of 'launch date' to 'start date' and the addition of 'end date'.
  - The new navigation structure (Dashboard, Business Profile, Assumptions, Data Sheets).
- Ensure all documentation and UI flows are consistent with these changes.

## 2025-06-20 17:00: Business Profile & Client Tiers UI/Data Model Improvements

### Changes Made
- Business profile page now loads and saves data persistently for each team, ensuring saved changes are always reflected when users return.
- Added a unique constraint to the `team_id` column in the `business_profiles` table to prevent duplicate rows and ensure upserts update the correct record.
- Improved Client Tiers UI: numbers now display with thousand separators, spacing between fields and labels is clearer, and font size/weight is normalized to match the rest of the UI.
- All elements in each client tier row are now vertically centered, and consistent vertical spacing is applied between rows for a more balanced and readable layout.

### Rationale
- These changes improve data integrity, user experience, and visual consistency across the business profile and client tier sections.
