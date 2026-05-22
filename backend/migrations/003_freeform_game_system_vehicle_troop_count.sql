-- Migration 003:
--  1. game_system becomes free-form (drop CHECK constraint on projects)
--  2. add 'vehicle' to allowed miniature_type values
--  3. add troop_count column to miniatures
--
-- SQLite does not support ALTER TABLE ... DROP CONSTRAINT, so we rebuild
-- the projects and miniatures tables. Foreign keys to these tables use
-- their PRIMARY KEY (id), which is preserved on rebuild.

PRAGMA foreign_keys = OFF;

-- ---- projects: drop game_system CHECK ----

CREATE TABLE projects_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    game_system VARCHAR(50) NOT NULL,
    army VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO projects_new (id, name, game_system, army, description, created_at, updated_at)
SELECT id, name, game_system, army, description, created_at, updated_at FROM projects;

DROP TABLE projects;
ALTER TABLE projects_new RENAME TO projects;

-- ---- miniatures: update CHECK + add troop_count ----

CREATE TABLE miniatures_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    miniature_type VARCHAR(20) NOT NULL CHECK (miniature_type IN ('troop', 'character', 'vehicle')),
    progress_status VARCHAR(50) NOT NULL CHECK (progress_status IN ('unpainted', 'primed', 'basecoated', 'detailed', 'completed')),
    notes TEXT,
    troop_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

INSERT INTO miniatures_new (id, project_id, name, miniature_type, progress_status, notes, troop_count, created_at, updated_at)
SELECT id, project_id, name, miniature_type, progress_status, notes, NULL, created_at, updated_at FROM miniatures;

DROP TABLE miniatures;
ALTER TABLE miniatures_new RENAME TO miniatures;

-- Recreate indexes that were defined on these tables in 001
CREATE INDEX idx_projects_game_system ON projects(game_system);
CREATE INDEX idx_miniatures_project_id ON miniatures(project_id);

PRAGMA foreign_keys = ON;
