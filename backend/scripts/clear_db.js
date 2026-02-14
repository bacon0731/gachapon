const { Client } = require('pg')
const dotenv = require('dotenv')
dotenv.config({ path: '.env.local' })

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!connectionString) {
  console.error('Missing SUPABASE_DB_URL or DATABASE_URL')
  process.exit(1)
}

const sql = `
DO $$
DECLARE
  v_admin_email text := NULL;
  v_admin_id uuid;
  v_table text;
  v_seq text;
  v_role_id bigint;
BEGIN
  IF v_admin_email IS NOT NULL THEN
    SELECT id INTO v_admin_id FROM auth.users WHERE email = v_admin_email LIMIT 1;
  END IF;
  IF v_admin_id IS NULL THEN
    IF to_regclass('auth.users') IS NOT NULL THEN
      SELECT id INTO v_admin_id FROM auth.users ORDER BY created_at NULLS LAST LIMIT 1;
    END IF;
  END IF;
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'NO_AUTH_USER';
  END IF;

  IF to_regclass('public.users') IS NOT NULL THEN
    PERFORM 1 FROM public.users WHERE id = v_admin_id;
    IF NOT FOUND THEN
      BEGIN
        INSERT INTO public.users (id, role, status, tokens, created_at)
        VALUES (v_admin_id, 'super_admin', 'active', 0, NOW());
      EXCEPTION WHEN others THEN
        BEGIN
          INSERT INTO public.users (id) VALUES (v_admin_id);
        EXCEPTION WHEN others THEN NULL;
        END;
    ELSE
      BEGIN
        UPDATE public.users SET role='super_admin', status='active', tokens=0 WHERE id=v_admin_id;
      EXCEPTION WHEN undefined_column THEN
        UPDATE public.users SET status='active' WHERE id=v_admin_id;
      END;
    END IF;
  END IF;

  IF to_regclass('public.roles') IS NOT NULL THEN
    SELECT id INTO v_role_id FROM public.roles WHERE name='super_admin' LIMIT 1;
    IF v_role_id IS NULL THEN
      INSERT INTO public.roles (name, display_name, description, permissions)
      VALUES ('super_admin','超級管理員','擁有系統所有權限',ARRAY['all'])
      RETURNING id INTO v_role_id;
    END IF;
  END IF;

  IF to_regclass('public.admins') IS NOT NULL THEN
    PERFORM 1 FROM public.admins WHERE username='superadmin';
    IF NOT FOUND THEN
      INSERT INTO public.admins (username, email, password_hash, role_id, status, created_at)
      VALUES ('superadmin','admin@example.com','superadmin123',v_role_id,'active',NOW());
    ELSE
      UPDATE public.admins SET role_id=v_role_id, status='active' WHERE username='superadmin';
    END IF;
    DELETE FROM public.admins WHERE username <> 'superadmin';
  END IF;

  IF to_regclass('auth.identities') IS NOT NULL THEN
    EXECUTE format('DELETE FROM auth.identities WHERE user_id <> %L', v_admin_id::text);
  END IF;
  IF to_regclass('auth.users') IS NOT NULL THEN
    EXECUTE format('DELETE FROM auth.users WHERE id <> %L', v_admin_id::text);
  END IF;

  IF to_regclass('public.draw_records') IS NOT NULL THEN EXECUTE 'DELETE FROM public.draw_records'; END IF;
  IF to_regclass('public.draw_history') IS NOT NULL THEN EXECUTE 'DELETE FROM public.draw_history'; END IF;
  IF to_regclass('public.product_prizes') IS NOT NULL THEN EXECUTE 'DELETE FROM public.product_prizes'; END IF;
  IF to_regclass('public.product_tags') IS NOT NULL THEN EXECUTE 'DELETE FROM public.product_tags'; END IF;
  IF to_regclass('public.product_follows') IS NOT NULL THEN EXECUTE 'DELETE FROM public.product_follows'; END IF;
  IF to_regclass('public.delivery_orders') IS NOT NULL THEN EXECUTE 'DELETE FROM public.delivery_orders'; END IF;
  IF to_regclass('public.order_items') IS NOT NULL THEN EXECUTE 'DELETE FROM public.order_items'; END IF;
  IF to_regclass('public.orders') IS NOT NULL THEN EXECUTE 'DELETE FROM public.orders'; END IF;
  IF to_regclass('public.shipment_items') IS NOT NULL THEN EXECUTE 'DELETE FROM public.shipment_items'; END IF;
  IF to_regclass('public.shipment_requests') IS NOT NULL THEN EXECUTE 'DELETE FROM public.shipment_requests'; END IF;
  IF to_regclass('public.marketplace_transactions') IS NOT NULL THEN EXECUTE 'DELETE FROM public.marketplace_transactions'; END IF;
  IF to_regclass('public.marketplace_sales') IS NOT NULL THEN EXECUTE 'DELETE FROM public.marketplace_sales'; END IF;
  IF to_regclass('public.marketplace_orders') IS NOT NULL THEN EXECUTE 'DELETE FROM public.marketplace_orders'; END IF;
  IF to_regclass('public.marketplace_listings') IS NOT NULL THEN EXECUTE 'DELETE FROM public.marketplace_listings'; END IF;
  IF to_regclass('public.recycle_pool') IS NOT NULL THEN EXECUTE 'DELETE FROM public.recycle_pool'; END IF;
  IF to_regclass('public.search_logs') IS NOT NULL THEN EXECUTE 'DELETE FROM public.search_logs'; END IF;
  IF to_regclass('public.visit_logs') IS NOT NULL THEN EXECUTE 'DELETE FROM public.visit_logs'; END IF;
  IF to_regclass('public.visits') IS NOT NULL THEN EXECUTE 'DELETE FROM public.visits'; END IF;
  IF to_regclass('public.banners') IS NOT NULL THEN EXECUTE 'DELETE FROM public.banners'; END IF;
  IF to_regclass('public.news') IS NOT NULL THEN EXECUTE 'DELETE FROM public.news'; END IF;
  IF to_regclass('public.categories') IS NOT NULL THEN EXECUTE 'DELETE FROM public.categories'; END IF;
  IF to_regclass('public.prizes') IS NOT NULL THEN EXECUTE 'DELETE FROM public.prizes'; END IF;
  IF to_regclass('public.products') IS NOT NULL THEN EXECUTE 'DELETE FROM public.products'; END IF;
  IF to_regclass('public.action_logs') IS NOT NULL THEN EXECUTE 'DELETE FROM public.action_logs'; END IF;
  IF to_regclass('public.recharge_records') IS NOT NULL THEN EXECUTE 'DELETE FROM public.recharge_records'; END IF;

  IF to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE format('DELETE FROM public.profiles WHERE id <> %L', v_admin_id::text);
  END IF;
  IF to_regclass('public.users') IS NOT NULL THEN
    EXECUTE format('DELETE FROM public.users WHERE id <> %L', v_admin_id::text);
  END IF;

  FOR v_seq IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S' AND n.nspname = 'public'
  LOOP
    EXECUTE format('ALTER SEQUENCE public.%I RESTART WITH 1', v_seq);
  END LOOP;
END $$;
`

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })
  await client.connect()
  try {
    await client.query(sql)
    console.log('Database cleared. Superadmin preserved.')
  } catch (e) {
    console.error(e)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()

