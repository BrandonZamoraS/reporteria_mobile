


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."check_record" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid",
    "products_establishment_id" "uuid",
    "user_profile_id" "uuid",
    "status" "text" DEFAULT 'ok'::"text" NOT NULL,
    "notes" "text",
    "checked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "check_record_status_check" CHECK (("status" = ANY (ARRAY['ok'::"text", 'issue'::"text", 'not_applicable'::"text"])))
);


ALTER TABLE "public"."check_record" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "legal_name" "text",
    "tax_id" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."company" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."establishment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "code" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "country" "text" DEFAULT 'MX'::"text",
    "latitude" numeric(9,6),
    "longitude" numeric(9,6),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."establishment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evidence" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "check_record_id" "uuid" NOT NULL,
    "uploaded_by_user_profile_id" "uuid",
    "file_path" "text" NOT NULL,
    "file_url" "text",
    "mime_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."evidence" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "sku" "text",
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."product" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products_establishment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "establishment_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."products_establishment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."route" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "establishment_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "route_date" "date",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "route_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."route" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "route_id" "uuid",
    "establishment_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "due_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "task_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."task" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profile" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid",
    "full_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "role" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_profile" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_profile_id" "uuid" NOT NULL,
    "task_id" "uuid" NOT NULL,
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."user_tasks" OWNER TO "postgres";


ALTER TABLE ONLY "public"."check_record"
    ADD CONSTRAINT "check_record_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company"
    ADD CONSTRAINT "company_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company"
    ADD CONSTRAINT "company_tax_id_key" UNIQUE ("tax_id");



ALTER TABLE ONLY "public"."establishment"
    ADD CONSTRAINT "establishment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evidence"
    ADD CONSTRAINT "evidence_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product"
    ADD CONSTRAINT "product_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products_establishment"
    ADD CONSTRAINT "products_establishment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products_establishment"
    ADD CONSTRAINT "products_establishment_product_id_establishment_id_key" UNIQUE ("product_id", "establishment_id");



ALTER TABLE ONLY "public"."route"
    ADD CONSTRAINT "route_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task"
    ADD CONSTRAINT "task_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profile"
    ADD CONSTRAINT "user_profile_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."user_profile"
    ADD CONSTRAINT "user_profile_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user_profile"
    ADD CONSTRAINT "user_profile_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_tasks"
    ADD CONSTRAINT "user_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_tasks"
    ADD CONSTRAINT "user_tasks_user_profile_id_task_id_key" UNIQUE ("user_profile_id", "task_id");



CREATE INDEX "check_record_checked_at_idx" ON "public"."check_record" USING "btree" ("checked_at");



CREATE INDEX "check_record_products_establishment_id_idx" ON "public"."check_record" USING "btree" ("products_establishment_id");



CREATE INDEX "check_record_task_id_idx" ON "public"."check_record" USING "btree" ("task_id");



CREATE INDEX "check_record_user_profile_id_idx" ON "public"."check_record" USING "btree" ("user_profile_id");



CREATE UNIQUE INDEX "establishment_company_code_unique_idx" ON "public"."establishment" USING "btree" ("company_id", "code") WHERE ("code" IS NOT NULL);



CREATE INDEX "establishment_company_id_idx" ON "public"."establishment" USING "btree" ("company_id");



CREATE INDEX "evidence_check_record_id_idx" ON "public"."evidence" USING "btree" ("check_record_id");



CREATE INDEX "product_company_id_idx" ON "public"."product" USING "btree" ("company_id");



CREATE UNIQUE INDEX "product_company_sku_unique_idx" ON "public"."product" USING "btree" ("company_id", "sku") WHERE ("sku" IS NOT NULL);



CREATE INDEX "products_establishment_establishment_id_idx" ON "public"."products_establishment" USING "btree" ("establishment_id");



CREATE INDEX "products_establishment_product_id_idx" ON "public"."products_establishment" USING "btree" ("product_id");



CREATE INDEX "route_establishment_id_idx" ON "public"."route" USING "btree" ("establishment_id");



CREATE INDEX "route_status_idx" ON "public"."route" USING "btree" ("status");



CREATE INDEX "task_establishment_id_idx" ON "public"."task" USING "btree" ("establishment_id");



CREATE INDEX "task_route_id_idx" ON "public"."task" USING "btree" ("route_id");



CREATE INDEX "task_status_idx" ON "public"."task" USING "btree" ("status");



CREATE INDEX "user_tasks_task_id_idx" ON "public"."user_tasks" USING "btree" ("task_id");



CREATE INDEX "user_tasks_user_profile_id_idx" ON "public"."user_tasks" USING "btree" ("user_profile_id");



CREATE OR REPLACE TRIGGER "company_set_updated_at" BEFORE UPDATE ON "public"."company" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "establishment_set_updated_at" BEFORE UPDATE ON "public"."establishment" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "product_set_updated_at" BEFORE UPDATE ON "public"."product" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "route_set_updated_at" BEFORE UPDATE ON "public"."route" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "task_set_updated_at" BEFORE UPDATE ON "public"."task" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "user_profile_set_updated_at" BEFORE UPDATE ON "public"."user_profile" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."check_record"
    ADD CONSTRAINT "check_record_products_establishment_id_fkey" FOREIGN KEY ("products_establishment_id") REFERENCES "public"."products_establishment"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."check_record"
    ADD CONSTRAINT "check_record_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."check_record"
    ADD CONSTRAINT "check_record_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profile"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."establishment"
    ADD CONSTRAINT "establishment_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evidence"
    ADD CONSTRAINT "evidence_check_record_id_fkey" FOREIGN KEY ("check_record_id") REFERENCES "public"."check_record"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evidence"
    ADD CONSTRAINT "evidence_uploaded_by_user_profile_id_fkey" FOREIGN KEY ("uploaded_by_user_profile_id") REFERENCES "public"."user_profile"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."product"
    ADD CONSTRAINT "product_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products_establishment"
    ADD CONSTRAINT "products_establishment_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishment"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products_establishment"
    ADD CONSTRAINT "products_establishment_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."route"
    ADD CONSTRAINT "route_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishment"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task"
    ADD CONSTRAINT "task_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "public"."establishment"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task"
    ADD CONSTRAINT "task_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "public"."route"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_profile"
    ADD CONSTRAINT "user_profile_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_tasks"
    ADD CONSTRAINT "user_tasks_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."user_profile"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_tasks"
    ADD CONSTRAINT "user_tasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tasks"
    ADD CONSTRAINT "user_tasks_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profile"("id") ON DELETE CASCADE;



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."check_record" TO "anon";
GRANT ALL ON TABLE "public"."check_record" TO "authenticated";
GRANT ALL ON TABLE "public"."check_record" TO "service_role";



GRANT ALL ON TABLE "public"."company" TO "anon";
GRANT ALL ON TABLE "public"."company" TO "authenticated";
GRANT ALL ON TABLE "public"."company" TO "service_role";



GRANT ALL ON TABLE "public"."establishment" TO "anon";
GRANT ALL ON TABLE "public"."establishment" TO "authenticated";
GRANT ALL ON TABLE "public"."establishment" TO "service_role";



GRANT ALL ON TABLE "public"."evidence" TO "anon";
GRANT ALL ON TABLE "public"."evidence" TO "authenticated";
GRANT ALL ON TABLE "public"."evidence" TO "service_role";



GRANT ALL ON TABLE "public"."product" TO "anon";
GRANT ALL ON TABLE "public"."product" TO "authenticated";
GRANT ALL ON TABLE "public"."product" TO "service_role";



GRANT ALL ON TABLE "public"."products_establishment" TO "anon";
GRANT ALL ON TABLE "public"."products_establishment" TO "authenticated";
GRANT ALL ON TABLE "public"."products_establishment" TO "service_role";



GRANT ALL ON TABLE "public"."route" TO "anon";
GRANT ALL ON TABLE "public"."route" TO "authenticated";
GRANT ALL ON TABLE "public"."route" TO "service_role";



GRANT ALL ON TABLE "public"."task" TO "anon";
GRANT ALL ON TABLE "public"."task" TO "authenticated";
GRANT ALL ON TABLE "public"."task" TO "service_role";



GRANT ALL ON TABLE "public"."user_profile" TO "anon";
GRANT ALL ON TABLE "public"."user_profile" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profile" TO "service_role";



GRANT ALL ON TABLE "public"."user_tasks" TO "anon";
GRANT ALL ON TABLE "public"."user_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."user_tasks" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







