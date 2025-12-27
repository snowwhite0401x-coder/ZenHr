-- Fix RLS Policy for departments table
-- Run this in Supabase SQL Editor to allow inserting/updating/deleting departments

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all access for anon dev" ON public.departments;
DROP POLICY IF EXISTS "Public read departments" ON public.departments;
DROP POLICY IF EXISTS "Public insert departments" ON public.departments;
DROP POLICY IF EXISTS "Public update departments" ON public.departments;
DROP POLICY IF EXISTS "Public delete departments" ON public.departments;

-- Create a comprehensive policy that allows all operations
CREATE POLICY "Allow all access for anon dev"
ON public.departments
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Alternative: If the above doesn't work, use separate policies for each operation
-- CREATE POLICY "Public read departments"
-- ON public.departments
-- FOR SELECT
-- TO public
-- USING (true);
--
-- CREATE POLICY "Public insert departments"
-- ON public.departments
-- FOR INSERT
-- TO public
-- WITH CHECK (true);
--
-- CREATE POLICY "Public update departments"
-- ON public.departments
-- FOR UPDATE
-- TO public
-- USING (true)
-- WITH CHECK (true);
--
-- CREATE POLICY "Public delete departments"
-- ON public.departments
-- FOR DELETE
-- TO public
-- USING (true);

