-- Schema for Vercel Postgres

CREATE SEQUENCE IF NOT EXISTS task_id_seq;
CREATE SEQUENCE IF NOT EXISTS content_id_seq;

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY DEFAULT ('task-' || nextval('task_id_seq')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  assignee TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY DEFAULT ('content-' || nextval('content_id_seq')),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  key_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  content_type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_name TEXT,
  author TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  published_date TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON tasks(assignee);
CREATE INDEX IF NOT EXISTS content_items_archived_idx ON content_items(is_archived);
CREATE INDEX IF NOT EXISTS content_items_read_idx ON content_items(is_read);
CREATE INDEX IF NOT EXISTS content_items_category_idx ON content_items(category);
CREATE INDEX IF NOT EXISTS content_items_task_id_idx ON content_items(task_id);
