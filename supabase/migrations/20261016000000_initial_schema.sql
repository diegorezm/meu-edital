-- Esquema inicial do Meu Edital.
-- Os ids são gerados pelo app (texto) para permitir gravações offline.
-- Cada linha pertence a um usuário e só é visível para ele (RLS).

create table public.exams (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  role text not null,
  board text,
  exam_date date,
  hours_per_week numeric not null check (hours_per_week >= 0),
  cycle_position integer not null default 0 check (cycle_position >= 0),
  cycle_laps integer not null default 0 check (cycle_laps >= 0),
  created_at date not null default current_date
);

create table public.subjects (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exam_id text not null references public.exams (id) on delete cascade,
  name text not null,
  weight numeric check (weight > 0),
  questions integer check (questions > 0),
  points_per_question numeric check (points_per_question > 0)
);

create table public.topics (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id text not null references public.subjects (id) on delete cascade,
  parent_id text references public.topics (id) on delete cascade,
  name text not null,
  studied boolean not null default false
);

create table public.cycle_items (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exam_id text not null references public.exams (id) on delete cascade,
  subject_id text not null references public.subjects (id) on delete cascade,
  minutes integer not null check (minutes > 0),
  sort_order integer not null
);

create table public.study_sessions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exam_id text not null references public.exams (id) on delete cascade,
  subject_id text not null references public.subjects (id) on delete cascade,
  topic_id text not null references public.topics (id) on delete cascade,
  -- Sem chave estrangeira: o histórico continua contando blocos de ciclos antigos.
  cycle_item_id text,
  type text not null check (type in ('Teoria', 'Questões', 'Revisão')),
  minutes integer not null check (minutes > 0),
  date date not null,
  questions integer check (questions >= 0),
  correct integer check (correct >= 0),
  note text,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exam_id text not null references public.exams (id) on delete cascade,
  topic_id text not null references public.topics (id) on delete cascade,
  due_date date not null,
  completed boolean not null default false,
  stage integer not null
);

create table public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  active_exam_id text references public.exams (id) on delete set null,
  review_offsets integer[] not null default '{1,7,30}'
);

create index on public.exams (user_id);
create index on public.subjects (user_id);
create index on public.subjects (exam_id);
create index on public.topics (user_id);
create index on public.topics (subject_id);
create index on public.topics (parent_id);
create index on public.cycle_items (user_id);
create index on public.cycle_items (exam_id);
create index on public.cycle_items (subject_id);
create index on public.study_sessions (user_id, date);
create index on public.study_sessions (exam_id);
create index on public.study_sessions (subject_id);
create index on public.study_sessions (topic_id);
create index on public.reviews (user_id, due_date);
create index on public.reviews (exam_id);
create index on public.reviews (topic_id);
create index on public.user_settings (active_exam_id);

do $$
declare
  t text;
begin
  foreach t in array array[
    'exams', 'subjects', 'topics', 'cycle_items', 'study_sessions', 'reviews', 'user_settings'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "Dono acessa os próprios dados" on public.%I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))',
      t
    );
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end
$$;
