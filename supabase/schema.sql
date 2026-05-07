create table if not exists public.would_you_dao_state (
  id text primary key,
  state jsonb not null default '{"proposals":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_would_you_dao_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_would_you_dao_state_updated_at on public.would_you_dao_state;

create trigger set_would_you_dao_state_updated_at
before update on public.would_you_dao_state
for each row
execute function public.set_would_you_dao_state_updated_at();

alter table public.would_you_dao_state enable row level security;

revoke all on table public.would_you_dao_state from anon;
revoke all on table public.would_you_dao_state from authenticated;

insert into public.would_you_dao_state (id, state)
values ('production', '{"proposals":[]}'::jsonb)
on conflict (id) do nothing;
