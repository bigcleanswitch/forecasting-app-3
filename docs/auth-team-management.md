# Authentication & Team Management

This document outlines the authentication and team management features implemented in the application.

## Overview

The application uses Supabase for authentication and team management. The system supports:

- User authentication (sign up, sign in, sign out)
- Team creation and management
- Team invitations with a maximum of 5 members per team
- Role-based access control (owner vs member)

## Database Schema

### Tables

1. **profiles**
   - `id`: UUID (references auth.users)
   - `created_at`: TIMESTAMP
   - `updated_at`: TIMESTAMP
   - `email`: TEXT
   - `full_name`: TEXT
   - `role`: TEXT ('owner' or 'member')
   - `team_id`: UUID (references teams)

2. **teams**
   - `id`: UUID
   - `created_at`: TIMESTAMP
   - `updated_at`: TIMESTAMP
   - `name`: TEXT
   - `owner_id`: UUID (references auth.users)
   - `member_count`: INTEGER (1-5)

3. **team_invites**
   - `id`: UUID
   - `created_at`: TIMESTAMP
   - `team_id`: UUID (references teams)
   - `email`: TEXT
   - `status`: TEXT ('pending', 'accepted', 'rejected')
   - `expires_at`: TIMESTAMP

## Authentication Flow

1. **Sign Up**
   - New users can create an account with email and password
   - If they have a pending team invite, they'll be prompted to join that team
   - Otherwise, they can create a new team and become its owner

2. **Sign In**
   - Users can sign in with their email and password
   - Upon successful authentication, they're redirected to the dashboard

3. **Sign Out**
   - Users can sign out from the dashboard
   - They're redirected to the sign-in page

## Team Management

1. **Team Creation**
   - When a user signs up without an invite, they create a new team
   - They automatically become the team owner
   - The team starts with a member count of 1

2. **Team Invitations**
   - Team owners can invite up to 4 additional members (5 total)
   - Invites are sent via email
   - Invites expire after 7 days
   - Invited users can either:
     - Create a new account and join the team
     - Join the team with an existing account

3. **Team Roles**
   - **Owner**: Can manage team members and settings
   - **Member**: Can access team data but cannot manage team settings

## Security

1. **Row Level Security (RLS)**
   - All tables have RLS enabled
   - Users can only access data related to their team
   - Team owners have additional permissions for team management

2. **Data Validation**
   - Team member count is enforced (1-5 members)
   - Role values are restricted to 'owner' or 'member'
   - Invite status values are restricted to 'pending', 'accepted', or 'rejected'

## API Endpoints

The application uses Supabase's client library to interact with the database. Key operations include:

1. **Authentication**
   ```typescript
   // Sign up
   const { data, error } = await supabase.auth.signUp({
     email,
     password,
   })

   // Sign in
   const { data, error } = await supabase.auth.signInWithPassword({
     email,
     password,
   })

   // Sign out
   const { error } = await supabase.auth.signOut()
   ```

2. **Team Management**
   ```typescript
   // Create team
   const { data, error } = await supabase
     .from('teams')
     .insert({
       name,
       owner_id: user.id,
       member_count: 1,
     })

   // Create invite
   const { data, error } = await supabase
     .from('team_invites')
     .insert({
       team_id,
       email,
       expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
     })
   ```

## UI Components

1. **Authentication Pages**
   - `/auth/sign-in`: Sign in form
   - `/auth/sign-up`: Sign up form
   - `/auth/join-team/[inviteId]`: Team invitation acceptance page

2. **Dashboard**
   - Shows team information
   - Lists team members
   - Provides team management options for owners
   - Includes sign out functionality

## Future Improvements

1. **Email Notifications**
   - Implement email sending for team invitations
   - Add email templates for various team-related notifications

2. **Team Settings**
   - Add team profile customization
   - Implement team member role management
   - Add team deletion functionality

3. **Security Enhancements**
   - Add two-factor authentication
   - Implement session management
   - Add audit logging for team actions 