-- Add check constraint for valid hex color format on categories table
-- This ensures color field follows the format #RRGGBB (e.g., #FF5733)

ALTER TABLE categories
ADD CONSTRAINT categories_color_hex_format
CHECK (color ~* '^#[0-9A-F]{6}$');

-- Comment explaining the constraint
COMMENT ON CONSTRAINT categories_color_hex_format ON categories IS
'Ensures color field is a valid 6-digit hex color code (e.g., #FF5733)';