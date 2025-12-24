-- Update leave_type enum to include 'Note / Activity Notification'
-- Run this in Supabase SQL Editor

-- First, drop the existing enum type (this will fail if there are existing records)
-- We need to alter the enum instead
ALTER TYPE public.leave_type ADD VALUE IF NOT EXISTS 'Note / Activity Notification';

-- Note: If the above doesn't work, you may need to:
-- 1. Create a new enum with all values
-- 2. Alter the table to use the new enum
-- 3. Drop the old enum
-- But the ADD VALUE should work for PostgreSQL 9.1+

