-- Initial database schema for miniature painting tracker

-- Projects table
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    game_system VARCHAR(50) NOT NULL CHECK (game_system IN ('age_of_sigmar', 'horus_heresy', 'warhammer_40k')),
    army VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Miniatures table
CREATE TABLE miniatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    miniature_type VARCHAR(20) NOT NULL CHECK (miniature_type IN ('troop', 'character')),
    progress_status VARCHAR(50) NOT NULL CHECK (progress_status IN ('unpainted', 'primed', 'basecoated', 'detailed', 'completed')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Painting recipes table
CREATE TABLE painting_recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    miniature_type VARCHAR(20) NOT NULL CHECK (miniature_type IN ('troop', 'character')),
    steps TEXT NOT NULL, -- JSON array of steps
    paints_used TEXT, -- JSON array of paint names/codes
    techniques TEXT, -- JSON array of techniques
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Photos table
CREATE TABLE photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    miniature_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (miniature_id) REFERENCES miniatures(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_miniatures_project_id ON miniatures(project_id);
CREATE INDEX idx_photos_miniature_id ON photos(miniature_id);
CREATE INDEX idx_projects_game_system ON projects(game_system);
CREATE INDEX idx_recipes_miniature_type ON painting_recipes(miniature_type);