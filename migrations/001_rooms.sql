create table if not exists rooms (
  code text primary key,
  host_key text not null,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rooms_updated_at_idx on rooms (updated_at desc);
