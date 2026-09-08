-- Execute this in your Supabase SQL Editor if the 'token' column is currently type 'uuid'
-- This allows storing the new short codes (e.g. "A7B2X9")

DO $$ 
BEGIN
  -- Attempt to alter column type from uuid to text if it isn't already
  -- This handles the case if it was created as UUID
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'tv_devices' 
    AND column_name = 'token' 
    AND data_type = 'uuid'
  ) THEN
    ALTER TABLE tv_devices ALTER COLUMN token TYPE text USING token::text;
  END IF;
END $$;
