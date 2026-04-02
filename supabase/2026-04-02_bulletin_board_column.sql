-- Add board_column to space_boards so bulletins can be assigned to a CMYK column.
-- Valid values: 'C' | 'M' | 'Y' | 'K'
ALTER TABLE space_boards
  ADD COLUMN IF NOT EXISTS board_column TEXT NOT NULL DEFAULT 'C';
