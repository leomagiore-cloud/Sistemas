-- Drop and recreate the INSERT policy for stores with correct check
DROP POLICY IF EXISTS "Authenticated users can create stores" ON public.stores;

CREATE POLICY "Authenticated users can create stores"
ON public.stores
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Ensure user_stores INSERT policy works correctly
DROP POLICY IF EXISTS "Users can create their own membership" ON public.user_stores;

CREATE POLICY "Users can create their own membership"
ON public.user_stores
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());