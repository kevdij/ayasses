-- =====================================================================
--  Club des Ayasses : base de données Supabase
--  À exécuter une fois dans Supabase > SQL Editor > New query > Run.
--
--  Principe de sécurité (appliqué PAR LE SERVEUR, pas par le navigateur) :
--   - tout le monde peut LIRE le contenu public du site ;
--   - seuls les comptes listés dans public.admins, connectés AVEC la double
--     authentification validée (niveau « aal2 »), peuvent le MODIFIER.
-- =====================================================================

-- Contenu du site : une ligne par bloc (club, events, news, structures…)
create table if not exists public.site_content (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null
);

-- Liste des administrateurs autorisés
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

-- Journal des modifications (qui a changé quoi, quand)
create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  at         timestamptz not null default now(),
  user_id    uuid,
  key        text,
  action     text
);

alter table public.site_content enable row level security;
alter table public.admins       enable row level security;
alter table public.audit_log    enable row level security;

-- Fonction : l'utilisateur courant est-il un admin connecté avec la 2FA ?
create or replace function public.is_mfa_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     and exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

revoke all on function public.is_mfa_admin() from public;
grant execute on function public.is_mfa_admin() to anon, authenticated;

-- ---------- site_content ----------
drop policy if exists "lecture publique" on public.site_content;
create policy "lecture publique" on public.site_content
  for select using (true);

drop policy if exists "ecriture admins 2FA" on public.site_content;
create policy "ecriture admins 2FA" on public.site_content
  for all to authenticated
  using (public.is_mfa_admin())
  with check (public.is_mfa_admin());

-- ---------- admins ----------
-- Un utilisateur connecté peut seulement vérifier s'il est lui-même admin.
-- Ajouter / retirer un admin se fait uniquement depuis le tableau de bord Supabase.
drop policy if exists "voir son propre statut" on public.admins;
create policy "voir son propre statut" on public.admins
  for select to authenticated
  using (user_id = auth.uid());

-- ---------- audit_log ----------
drop policy if exists "lecture admins 2FA" on public.audit_log;
create policy "lecture admins 2FA" on public.audit_log
  for select to authenticated
  using (public.is_mfa_admin());

-- Le journal est rempli automatiquement par un trigger (personne ne peut y écrire à la main)
create or replace function public.log_site_content()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    insert into public.audit_log (user_id, key, action) values (auth.uid(), old.key, 'delete');
    return old;
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  insert into public.audit_log (user_id, key, action) values (auth.uid(), new.key, lower(tg_op));
  return new;
end;
$$;

drop trigger if exists trg_log_site_content on public.site_content;
create trigger trg_log_site_content
  before insert or update or delete on public.site_content
  for each row execute function public.log_site_content();

-- =====================================================================
--  Pour ajouter un administrateur (après l'avoir invité dans
--  Authentication > Users > Invite user) :
--
--    insert into public.admins (user_id, email)
--    select id, email from auth.users where email = 'prenom@exemple.fr';
--
--  Pour en retirer un :
--    delete from public.admins where email = 'prenom@exemple.fr';
-- =====================================================================
