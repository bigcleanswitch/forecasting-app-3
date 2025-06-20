-- Create tier_tables (each can be reused across revenue streams)
create table if not exists tier_tables (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create tiers (each belongs to a tier_table)
create table if not exists tiers (
  id uuid primary key default uuid_generate_v4(),
  tier_table_id uuid references tier_tables(id) on delete cascade not null,
  name text,
  min_users int not null,
  max_users int not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Update revenue_streams to reference a tier_table (nullable)
alter table if exists revenue_streams add column if not exists tier_table_id uuid references tier_tables(id);

-- Enable RLS
alter table tier_tables enable row level security;
alter table tiers enable row level security;

-- RLS: Only allow access to tier_tables where user_id = auth.uid()
create policy "User can access own tier tables" on tier_tables for all using (user_id = auth.uid());

-- RLS: Only allow access to tiers where the parent tier_table belongs to the user
create policy "User can access tiers in their tables" on tiers for all using (
  tier_table_id in (select id from tier_tables where user_id = auth.uid())
); 