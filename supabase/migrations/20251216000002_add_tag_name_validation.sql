-- Add validation constraints for tag names
-- This migration adds:
-- 1. Check constraint for non-empty tag names after trimming
-- 2. Check constraint for maximum tag name length (100 characters)
-- 3. Check constraint to ensure no leading/trailing whitespace
-- 4. Function to automatically trim tag names on insert/update

-- Add check constraint: tag name must not be empty after trimming
ALTER TABLE tags
ADD CONSTRAINT tags_name_not_empty
CHECK (LENGTH(TRIM(name)) > 0);

-- Add check constraint: tag name must not exceed 100 characters
ALTER TABLE tags
ADD CONSTRAINT tags_name_max_length
CHECK (LENGTH(name) <= 100);

-- Add check constraint: tag name must not have leading/trailing whitespace
ALTER TABLE tags
ADD CONSTRAINT tags_name_trimmed
CHECK (name = TRIM(name));

-- Create function to automatically trim tag names
CREATE OR REPLACE FUNCTION trim_tag_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically trim the tag name
  NEW.name = TRIM(NEW.name);

  -- Validate that the trimmed name is not empty
  IF LENGTH(NEW.name) = 0 THEN
    RAISE EXCEPTION 'Tag name cannot be empty';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to trim tag names before insert/update
CREATE TRIGGER trim_tag_name_trigger
  BEFORE INSERT OR UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION trim_tag_name();

-- Add comment to document the validation rules
COMMENT ON TABLE tags IS 'Flexible tags for detailed transaction classification. Tag names are automatically trimmed, must be non-empty, and cannot exceed 100 characters.';
COMMENT ON COLUMN tags.name IS 'Tag name (automatically trimmed, 1-100 characters, unique per user)';
