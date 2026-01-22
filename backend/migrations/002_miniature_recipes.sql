-- Migration: Link miniatures to painting recipes (many-to-many)

-- Junction table for miniature-recipe relationships
CREATE TABLE miniature_recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    miniature_id INTEGER NOT NULL,
    recipe_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (miniature_id) REFERENCES miniatures(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES painting_recipes(id) ON DELETE CASCADE,
    UNIQUE(miniature_id, recipe_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_miniature_recipes_miniature_id ON miniature_recipes(miniature_id);
CREATE INDEX idx_miniature_recipes_recipe_id ON miniature_recipes(recipe_id);
