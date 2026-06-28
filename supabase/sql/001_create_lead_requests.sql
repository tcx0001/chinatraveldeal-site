create table if not exists public.lead_requests (
  id bigserial primary key,
  request_type text not null check (request_type in ('booking', 'newsletter')),
  source text not null default 'website',
  full_name text,
  email text,
  travel_date text,
  travelers text,
  destination text,
  interest text,
  note text,
  raw_payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_requests_created_at
  on public.lead_requests (created_at desc);
