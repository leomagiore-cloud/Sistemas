-- Replace permissive INSERT policy on stores with a non-constant check
DROP POLICY IF EXISTS "Authenticated users can create stores" ON public.stores;

CREATE POLICY "Authenticated users can create stores"
ON public.stores
FOR INSERT
TO authenticated
WITH CHECK (public.is_authenticated_user());