-- Fix: Update handle_new_user trigger to read currency from user metadata
-- This prevents duplicate profile creation errors during signup
-- IMPORTANT: Use fully qualified table name (public.profiles) because trigger runs in auth schema

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, currency)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'currency', 'USD')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger already exists, no need to recreate
