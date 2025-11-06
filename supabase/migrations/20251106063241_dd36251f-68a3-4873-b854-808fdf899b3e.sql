-- Add DELETE policy for sessions table
CREATE POLICY "Users can delete their own sessions"
  ON public.sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Fix function search_path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;