create extension if not exists "pg_trgm" with schema "extensions";

drop extension if exists "pg_net";

create sequence "public"."user_session_log_session_log_id_seq";


  create table "public"."user_session_log" (
    "session_log_id" bigint not null default nextval('public.user_session_log_session_log_id_seq'::regclass),
    "user_id" bigint,
    "auth_user_id" uuid not null,
    "login_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "logout_at" timestamp with time zone,
    "user_agent" text
      );


alter table "public"."user_session_log" enable row level security;

alter table "public"."route" alter column day type "public"."route_day_enum" using day::text::"public"."route_day_enum";

alter table "public"."check_record" enable row level security;

alter table "public"."company" enable row level security;

alter table "public"."establishment" enable row level security;

alter table "public"."evidence" enable row level security;

alter table "public"."product" enable row level security;

alter table "public"."products_establishment" enable row level security;

alter table "public"."route" alter column "day" drop not null;

alter table "public"."route" enable row level security;

alter table "public"."task" enable row level security;

alter table "public"."user_profile" add column "company_id" bigint;

alter table "public"."user_profile" add column "email" text;

alter table "public"."user_profile" add column "is_active" boolean not null default true;

alter table "public"."user_profile" alter column "auth_user_id" set not null;

alter table "public"."user_profile" enable row level security;

alter table "public"."user_tasks" enable row level security;

alter sequence "public"."user_session_log_session_log_id_seq" owned by "public"."user_session_log"."session_log_id";

CREATE INDEX check_record_time_date_idx ON public.check_record USING btree (time_date);

CREATE INDEX company_name_trgm_idx ON public.company USING gin (name extensions.gin_trgm_ops);

CREATE INDEX products_establishment_establishment_id_idx ON public.products_establishment USING btree (establishment_id);

CREATE INDEX user_profile_company_id_idx ON public.user_profile USING btree (company_id);

CREATE UNIQUE INDEX user_profile_email_unique_idx ON public.user_profile USING btree (lower(email)) WHERE (email IS NOT NULL);

CREATE INDEX user_session_log_auth_user_id_login_idx ON public.user_session_log USING btree (auth_user_id, login_at DESC);

CREATE UNIQUE INDEX user_session_log_pkey ON public.user_session_log USING btree (session_log_id);

CREATE INDEX user_session_log_user_id_login_idx ON public.user_session_log USING btree (user_id, login_at DESC);

alter table "public"."user_session_log" add constraint "user_session_log_pkey" PRIMARY KEY using index "user_session_log_pkey";

alter table "public"."user_profile" add constraint "user_profile_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE SET NULL not valid;

alter table "public"."user_profile" validate constraint "user_profile_company_id_fkey";

alter table "public"."user_profile" add constraint "user_profile_company_only_visitante_chk" CHECK (((company_id IS NULL) OR (role = 'visitante'::public.user_role_enum))) not valid;

alter table "public"."user_profile" validate constraint "user_profile_company_only_visitante_chk";

alter table "public"."user_session_log" add constraint "user_session_log_auth_user_id_fkey" FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_session_log" validate constraint "user_session_log_auth_user_id_fkey";

alter table "public"."user_session_log" add constraint "user_session_log_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.user_profile(user_id) ON DELETE SET NULL not valid;

alter table "public"."user_session_log" validate constraint "user_session_log_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.current_user_role()
 RETURNS public.user_role_enum
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select up.role
  from public.user_profile up
  where up.auth_user_id = auth.uid()
  limit 1;
$function$
;

CREATE OR REPLACE FUNCTION public.route_day_options()
 RETURNS text[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select enum_range(null::public.route_day_enum)::text[];
$function$
;

CREATE OR REPLACE FUNCTION public.user_profile_protect_self_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  actor_role public.user_role_enum;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if auth.uid() is null then
    return new;
  end if;

  actor_role := public.current_user_role();

  if actor_role = 'admin' then
    return new;
  end if;

  if actor_role = 'editor' then
    if new.role is distinct from old.role
       or new.is_active is distinct from old.is_active
       or new.auth_user_id is distinct from old.auth_user_id then
      raise exception 'Editor no puede cambiar rol, estado ni vinculacion auth';
    end if;
    return new;
  end if;

  if new.auth_user_id is distinct from auth.uid() then
    raise exception 'No autorizado para actualizar este perfil';
  end if;

  if new.role is distinct from old.role
     or new.email is distinct from old.email
     or new.is_active is distinct from old.is_active
     or new.phone_num is distinct from old.phone_num
     or new.auth_user_id is distinct from old.auth_user_id
     or new.company_id is distinct from old.company_id then
    raise exception 'Solo puedes actualizar tu nombre';
  end if;

  return new;
end
$function$
;

grant delete on table "public"."user_session_log" to "anon";

grant insert on table "public"."user_session_log" to "anon";

grant references on table "public"."user_session_log" to "anon";

grant select on table "public"."user_session_log" to "anon";

grant trigger on table "public"."user_session_log" to "anon";

grant truncate on table "public"."user_session_log" to "anon";

grant update on table "public"."user_session_log" to "anon";

grant delete on table "public"."user_session_log" to "authenticated";

grant insert on table "public"."user_session_log" to "authenticated";

grant references on table "public"."user_session_log" to "authenticated";

grant select on table "public"."user_session_log" to "authenticated";

grant trigger on table "public"."user_session_log" to "authenticated";

grant truncate on table "public"."user_session_log" to "authenticated";

grant update on table "public"."user_session_log" to "authenticated";

grant delete on table "public"."user_session_log" to "service_role";

grant insert on table "public"."user_session_log" to "service_role";

grant references on table "public"."user_session_log" to "service_role";

grant select on table "public"."user_session_log" to "service_role";

grant trigger on table "public"."user_session_log" to "service_role";

grant truncate on table "public"."user_session_log" to "service_role";

grant update on table "public"."user_session_log" to "service_role";


  create policy "check_record_insert_admin_editor"
  on "public"."check_record"
  as permissive
  for insert
  to authenticated
with check ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "check_record_insert_rutero_own"
  on "public"."check_record"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = 'rutero'::public.user_role_enum) AND (up.user_id = check_record.user_id)))));



  create policy "check_record_select_admin_editor"
  on "public"."check_record"
  as permissive
  for select
  to authenticated
using ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "check_record_select_rutero_own"
  on "public"."check_record"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = 'rutero'::public.user_role_enum) AND (up.user_id = check_record.user_id)))));



  create policy "check_record_select_visitante_company_products"
  on "public"."check_record"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.product p
     JOIN public.user_profile up ON ((up.company_id = p.company_id)))
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = 'visitante'::public.user_role_enum) AND (p.product_id = check_record.product_id)))));



  create policy "company_delete_admin"
  on "public"."company"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = 'admin'::public.user_role_enum)))));



  create policy "company_insert_admin_editor"
  on "public"."company"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum]))))));



  create policy "company_select_admin_editor_visitante"
  on "public"."company"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum, 'visitante'::public.user_role_enum]))))));



  create policy "company_update_admin_editor"
  on "public"."company"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum]))))))
with check ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum]))))));



  create policy "establishment_delete_admin"
  on "public"."establishment"
  as permissive
  for delete
  to authenticated
using ((public.current_user_role() = 'admin'::public.user_role_enum));



  create policy "establishment_insert_admin_editor"
  on "public"."establishment"
  as permissive
  for insert
  to authenticated
with check ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "establishment_select_admin_editor"
  on "public"."establishment"
  as permissive
  for select
  to authenticated
using ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "establishment_select_visitante_company_products"
  on "public"."establishment"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM ((public.products_establishment pe
     JOIN public.product p ON ((p.product_id = pe.product_id)))
     JOIN public.user_profile up ON ((up.auth_user_id = auth.uid())))
  WHERE ((pe.establishment_id = establishment.establishment_id) AND (up.role = 'visitante'::public.user_role_enum) AND (up.company_id = p.company_id)))));



  create policy "establishment_update_admin_editor"
  on "public"."establishment"
  as permissive
  for update
  to authenticated
using ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])))
with check ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "evidence_insert_admin_editor"
  on "public"."evidence"
  as permissive
  for insert
  to authenticated
with check ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "evidence_insert_rutero_own_records"
  on "public"."evidence"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM (public.check_record cr
     JOIN public.user_profile up ON ((up.user_id = cr.user_id)))
  WHERE ((cr.record_id = evidence.record_id) AND (up.auth_user_id = auth.uid()) AND (up.role = 'rutero'::public.user_role_enum)))));



  create policy "evidence_select_admin_editor"
  on "public"."evidence"
  as permissive
  for select
  to authenticated
using ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "evidence_select_rutero_own_records"
  on "public"."evidence"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.check_record cr
     JOIN public.user_profile up ON ((up.user_id = cr.user_id)))
  WHERE ((cr.record_id = evidence.record_id) AND (up.auth_user_id = auth.uid()) AND (up.role = 'rutero'::public.user_role_enum)))));



  create policy "evidence_select_visitante_company_products"
  on "public"."evidence"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM ((public.check_record cr
     JOIN public.product p ON ((p.product_id = cr.product_id)))
     JOIN public.user_profile up ON ((up.company_id = p.company_id)))
  WHERE ((cr.record_id = evidence.record_id) AND (up.auth_user_id = auth.uid()) AND (up.role = 'visitante'::public.user_role_enum)))));



  create policy "product_delete_admin"
  on "public"."product"
  as permissive
  for delete
  to authenticated
using ((public.current_user_role() = 'admin'::public.user_role_enum));



  create policy "product_insert_admin_editor"
  on "public"."product"
  as permissive
  for insert
  to authenticated
with check ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "product_select_admin_editor"
  on "public"."product"
  as permissive
  for select
  to authenticated
using ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "product_select_visitante_own_company"
  on "public"."product"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = 'visitante'::public.user_role_enum) AND (up.company_id = product.company_id)))));



  create policy "product_update_admin_editor"
  on "public"."product"
  as permissive
  for update
  to authenticated
using ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])))
with check ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "products_establishment_delete_admin_editor"
  on "public"."products_establishment"
  as permissive
  for delete
  to authenticated
using ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "products_establishment_insert_admin_editor"
  on "public"."products_establishment"
  as permissive
  for insert
  to authenticated
with check ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "products_establishment_select_admin_editor"
  on "public"."products_establishment"
  as permissive
  for select
  to authenticated
using ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "products_establishment_select_visitante_company_products"
  on "public"."products_establishment"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.product p
     JOIN public.user_profile up ON ((up.auth_user_id = auth.uid())))
  WHERE ((p.product_id = products_establishment.product_id) AND (up.role = 'visitante'::public.user_role_enum) AND (up.company_id = p.company_id)))));



  create policy "products_establishment_update_admin_editor"
  on "public"."products_establishment"
  as permissive
  for update
  to authenticated
using ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])))
with check ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "route_delete_admin"
  on "public"."route"
  as permissive
  for delete
  to authenticated
using ((public.current_user_role() = 'admin'::public.user_role_enum));



  create policy "route_insert_admin_editor"
  on "public"."route"
  as permissive
  for insert
  to authenticated
with check ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "route_select_admin_editor"
  on "public"."route"
  as permissive
  for select
  to authenticated
using ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "route_select_rutero_assigned"
  on "public"."route"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = 'rutero'::public.user_role_enum) AND (up.user_id = route.assigned_user)))));



  create policy "route_update_admin_editor"
  on "public"."route"
  as permissive
  for update
  to authenticated
using ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])))
with check ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "task_delete_admin"
  on "public"."task"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = 'admin'::public.user_role_enum)))));



  create policy "task_insert_admin"
  on "public"."task"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = 'admin'::public.user_role_enum)))));



  create policy "task_select_admin_editor"
  on "public"."task"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum]))))));



  create policy "task_select_rutero_assigned"
  on "public"."task"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (public.user_tasks ut
     JOIN public.user_profile up ON ((up.user_id = ut.user_id)))
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = 'rutero'::public.user_role_enum) AND (ut.task_id = task.task_id)))));



  create policy "task_update_admin_editor"
  on "public"."task"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum]))))))
with check ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum]))))));



  create policy "user_profile_delete_admin"
  on "public"."user_profile"
  as permissive
  for delete
  to authenticated
using ((public.current_user_role() = 'admin'::public.user_role_enum));



  create policy "user_profile_insert_admin"
  on "public"."user_profile"
  as permissive
  for insert
  to authenticated
with check ((public.current_user_role() = 'admin'::public.user_role_enum));



  create policy "user_profile_select_admin_editor"
  on "public"."user_profile"
  as permissive
  for select
  to authenticated
using ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "user_profile_select_own"
  on "public"."user_profile"
  as permissive
  for select
  to authenticated
using ((auth.uid() = auth_user_id));



  create policy "user_profile_update_admin_editor"
  on "public"."user_profile"
  as permissive
  for update
  to authenticated
using ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])))
with check ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "user_profile_update_own"
  on "public"."user_profile"
  as permissive
  for update
  to authenticated
using ((auth.uid() = auth_user_id))
with check ((auth.uid() = auth_user_id));



  create policy "user_session_log_insert_own"
  on "public"."user_session_log"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = auth_user_id));



  create policy "user_session_log_select_admin_editor"
  on "public"."user_session_log"
  as permissive
  for select
  to authenticated
using ((public.current_user_role() = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum])));



  create policy "user_session_log_select_own"
  on "public"."user_session_log"
  as permissive
  for select
  to authenticated
using ((auth.uid() = auth_user_id));



  create policy "user_session_log_update_own"
  on "public"."user_session_log"
  as permissive
  for update
  to authenticated
using ((auth.uid() = auth_user_id))
with check ((auth.uid() = auth_user_id));



  create policy "user_tasks_delete_admin_editor"
  on "public"."user_tasks"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum]))))));



  create policy "user_tasks_insert_admin_editor"
  on "public"."user_tasks"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum]))))));



  create policy "user_tasks_select_admin_editor"
  on "public"."user_tasks"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum]))))));



  create policy "user_tasks_select_rutero_own"
  on "public"."user_tasks"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = 'rutero'::public.user_role_enum) AND (up.user_id = user_tasks.user_id)))));



  create policy "user_tasks_update_admin_editor"
  on "public"."user_tasks"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum]))))))
with check ((EXISTS ( SELECT 1
   FROM public.user_profile up
  WHERE ((up.auth_user_id = auth.uid()) AND (up.role = ANY (ARRAY['admin'::public.user_role_enum, 'editor'::public.user_role_enum]))))));


CREATE TRIGGER trg_user_profile_protect_self_update BEFORE UPDATE ON public.user_profile FOR EACH ROW EXECUTE FUNCTION public.user_profile_protect_self_update();


