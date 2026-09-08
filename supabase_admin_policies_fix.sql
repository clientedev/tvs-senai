-- Fix for RLS Policies: Allow Authenticated Users (Admins) to Manage Data
-- Run this script in the Supabase SQL Editor to fix "new row violates row-level security policy" errors.

-- 1. Policies for tv_devices (Allows Admins to Create, Edit, Delete TVs)
CREATE POLICY "Allow admin all on tv_devices" ON tv_devices
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Policies for tv_content_assignments (Allows Admins to Assign Content)
CREATE POLICY "Allow admin all on tv_content_assignments" ON tv_content_assignments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Policies for media_contents (Allows Admins to Upload/Manage Media)
CREATE POLICY "Allow admin all on media_contents" ON media_contents
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Policies for announcements (Allows Admins to Manage Announcements)
CREATE POLICY "Allow admin all on announcements" ON announcements
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Policies for institution_settings
CREATE POLICY "Allow admin all on institution_settings" ON institution_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Note: These policies grant full access to any user who is logged in (authenticated).
-- Since the application ("page.tsx" and "client.ts") uses the standard Supabase Auth,
-- being logged in is the criterion for being an admin in this context.
