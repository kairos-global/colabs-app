-- ============================================================
-- Advanced Task Fields
-- Adds priority, due_date, and assignee_id to space_tasks.
-- Run in Supabase SQL Editor.
-- ============================================================

ALTER TABLE space_tasks
  ADD COLUMN IF NOT EXISTS priority   text    DEFAULT 'medium'
    CHECK (priority IN ('low','medium','high','critical')),
  ADD COLUMN IF NOT EXISTS due_date   date,
  ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Index for fast filtering by assignee
CREATE INDEX IF NOT EXISTS idx_space_tasks_assignee
  ON space_tasks (assignee_id);

-- Index for due date sorting / overdue queries
CREATE INDEX IF NOT EXISTS idx_space_tasks_due_date
  ON space_tasks (due_date) WHERE due_date IS NOT NULL;
