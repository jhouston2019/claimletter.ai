# Database Migration Instructions

## Quick Start - Run Migrations in Supabase

### Option 1: Use the Consolidated Migration (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Run the Complete Migration**
   - Open the file: `supabase/RUN-MIGRATIONS.sql`
   - Copy ALL the SQL content
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verify Tables Were Created**
   - In SQL Editor, run:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```
   - You should see:
     - `cla_letters`
     - `subscriptions`
     - `tlh_letters`
     - `usage_tracking`
     - `users`

### Option 2: Run Individual Migration Files

If you prefer to run migrations one by one:

1. **Run in this exact order:**
   ```
   1. 20251001_create_users_table.sql
   2. 20251001_create_documents_table.sql (creates cla_letters)
   3. 20251001_create_subscriptions_table.sql
   4. 20251001_setup_rls_policies.sql
   ```

2. **For each file:**
   - Open Supabase SQL Editor
   - Copy the contents of the migration file
   - Paste and run

## Important Notes

- **RLS Policies**: The migrations set up Row Level Security (RLS) to ensure data is secure
- **Service Role Access**: Your Netlify functions use `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS, so server-side access works
- **Both Table Names**: The code uses both `tlh_letters` and `cla_letters` - the migration creates both for compatibility

## Verification Checklist

After running migrations, verify:

- [ ] Tables exist (run verification query above)
- [ ] RLS is enabled (check in Supabase Table Editor - should show "RLS enabled")
- [ ] Indexes created (check performance - queries should be fast)
- [ ] Functions/triggers created (check in Supabase Database → Functions)

## Troubleshooting

**Error: "relation already exists"**
- Tables might already exist - that's okay! The migration uses `CREATE TABLE IF NOT EXISTS`
- If you want to recreate, drop tables first:
  ```sql
  DROP TABLE IF EXISTS public.tlh_letters CASCADE;
  DROP TABLE IF EXISTS public.cla_letters CASCADE;
  DROP TABLE IF EXISTS public.subscriptions CASCADE;
  DROP TABLE IF EXISTS public.usage_tracking CASCADE;
  DROP TABLE IF EXISTS public.users CASCADE;
  ```

**Error: "permission denied"**
- Make sure you're running as the database owner or have proper permissions
- Check you're in the correct project

**RLS not working as expected**
- Remember: Service role key bypasses RLS (for server-side functions)
- Anonymous key respects RLS (for client-side)
- Your Netlify functions use service role key, so they have full access

## Storage Bucket Setup

Don't forget to also create the storage bucket:

1. Go to Supabase Dashboard → Storage
2. Click "Create bucket"
3. Name: `letters`
4. Make it **Private** (not public)
5. Click "Create bucket"

## Next Steps

After migrations are complete:
1. Test the production readiness check (should show Supabase ✅)
2. Test a complete user flow
3. Monitor Supabase logs for any errors

