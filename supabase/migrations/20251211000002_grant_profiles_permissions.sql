-- Grant permissions to supabase_auth_admin for profile creation
-- This is required because the handle_new_user trigger runs in the auth schema context

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT INSERT ON public.profiles TO supabase_auth_admin;
GRANT SELECT ON public.profiles TO supabase_auth_admin;
