-- Fix infinite recursion on user_stores policies by avoiding self-referential queries

-- 1) Helper function: check if current user is owner of a given store
CREATE OR REPLACE FUNCTION public.is_store_owner(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_stores
    WHERE user_id = auth.uid()
      AND store_id = p_store_id
      AND role = 'proprietario'
  );
$$;

-- 2) Replace the recursive policy
DROP POLICY IF EXISTS "Store owners can manage memberships" ON public.user_stores;

CREATE POLICY "Store owners can manage memberships"
ON public.user_stores
FOR ALL
TO authenticated
USING (public.is_store_owner(store_id))
WITH CHECK (public.is_store_owner(store_id));