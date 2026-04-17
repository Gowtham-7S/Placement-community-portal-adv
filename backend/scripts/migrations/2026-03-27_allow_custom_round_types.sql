-- Migration: Allow custom round types in rounds table
-- Date: 2026-03-27
-- Description: Remove CHECK constraint on round_type to allow custom round types

-- Remove the CHECK constraint on round_type column
ALTER TABLE rounds DROP CONSTRAINT IF EXISTS rounds_round_type_check;

-- Optional: Update the constants.js file to reflect that round types are now flexible
-- But since we're allowing any string, we don't need to restrict it