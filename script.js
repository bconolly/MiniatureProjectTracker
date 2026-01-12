/**
 * Miniature Painting Tracker
 *
 * Security Features:
 * - HTML escaping for all user-generated text content to prevent XSS
 * - Data URL validation for all images to prevent malicious content injection
 * - Event delegation instead of inline event handlers
 * - Input validation for file types, sizes, and text lengths
 * - Content Security Policy enforced via meta tag
 * - IIFE wrapper to prevent global namespace pollution
 */

class MiniatureTracker {
    constructor() {
        // Constants
        this.MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
        this.MAX_NAME_LENGTH = 100;
        this.MAX_TEMPLATE_NAME_LENGTH = 50;
        this.ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        try {
            this.projects = JSON.parse(localStorage.getItem('miniature-projects') || '[]');
            this.templates = JSON.parse(localStorage.getItem('recipe-templates') || '[]');
        } catch (error) {
            console.error('Failed to load saved data:', error);
            this.projects = [];
            this.templates = [];
            alert('Failed to load saved data. Starting with empty project list.');
        }
        this.currentProjectId = null;
        this.currentMiniId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderProjects();
    }

    bindEvents() {
        // Project modal events
        document.getElementById('new-project-btn').addEventListener('click', () => this.openProjectModal());
        document.getElementById('project-form').addEventListener('submit', (e) => this.saveProject(e));
        document.getElementById('cancel-btn').addEventListener('click', () => this.closeProjectModal());
        
        // Miniature modal events
        document.getElementById('miniature-form').addEventListener('submit', (e) => this.saveMiniature(e));
        document.getElementById('cancel-mini-btn').addEventListener('click', () => this.closeMiniatureModal());
        
        // Template events
        document.getElementById('manage-templates-btn').addEventListener('click', () => this.openManageTemplatesModal());
        document.getElementById('apply-template-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.applyTemplate();
        });
        document.getElementById('save-template-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openSaveTemplateModal();
        });
        document.getElementById('template-form').addEventListener('submit', (e) => this.saveTemplate(e));
        document.getElementById('cancel-template-btn').addEventListener('click', () => this.closeTemplateModal());
        document.getElementById('close-templates-btn').addEventListener('click', () => this.closeManageTemplatesModal());
        
        // Photo preview events
        document.getElementById('project-photo').addEventListener('change', (e) => this.previewPhoto(e, 'photo-preview'));
        document.getElementById('mini-photo').addEventListener('change', (e) => this.previewPhoto(e, 'mini-photo-preview'));
        
        // Modal close events
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });
        
        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Event delegation for dynamically created buttons
        document.getElementById('projects-grid').addEventListener('click', (e) => {
            const target = e.target;

            // Edit project button
            if (target.classList.contains('edit-project-btn')) {
                const projectId = target.dataset.projectId;
                this.openProjectModal(projectId);
            }

            // Delete project button
            if (target.classList.contains('delete-project-btn')) {
                const projectId = target.dataset.projectId;
                this.deleteProject(projectId);
            }

            // Add miniature button
            if (target.classList.contains('add-mini-btn')) {
                const projectId = target.dataset.projectId;
                this.openMiniatureModal(projectId);
            }

            // Edit miniature button
            if (target.classList.contains('edit-mini-btn')) {
                const projectId = target.dataset.projectId;
                const miniId = target.dataset.miniId;
                this.openMiniatureModal(projectId, miniId);
            }

            // Delete miniature button
            if (target.classList.contains('delete-mini-btn')) {
                const projectId = target.dataset.projectId;
                const miniId = target.dataset.miniId;
                this.deleteMiniature(projectId, miniId);
            }
        });

        // Event delegation for template management
        document.getElementById('templates-list').addEventListener('click', (e) => {
            const target = e.target;

            // Delete template button
            if (target.classList.contains('delete-template-btn')) {
                const templateId = target.dataset.templateId;
                this.deleteTemplate(templateId);
            }
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    // Security: Escape HTML to prevent XSS
    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    // Security: Validate data URL to ensure it's a safe image
    validateDataUrl(dataUrl) {
        if (!dataUrl || typeof dataUrl !== 'string') {
            return false;
        }

        // Check if it's a valid data URL format
        const dataUrlPattern = /^data:image\/(jpeg|png|gif|webp);base64,/;
        if (!dataUrlPattern.test(dataUrl)) {
            console.warn('Invalid data URL format detected');
            return false;
        }

        return true;
    }

    // Security: Sanitize image source for use in HTML
    sanitizeImageSrc(src) {
        if (!src) return '';

        // Validate data URLs
        if (src.startsWith('data:')) {
            return this.validateDataUrl(src) ? src : '';
        }

        // For other URLs, only allow relative paths (shouldn't happen in this app)
        return '';
    }

    saveData() {
        try {
            localStorage.setItem('miniature-projects', JSON.stringify(this.projects));
            localStorage.setItem('recipe-templates', JSON.stringify(this.templates));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                alert('Storage quota exceeded. Please delete some projects or images to free up space.');
            } else {
                alert('Failed to save data. Please try again.');
            }
            console.error('Save error:', error);
        }
    }

    validateImageFile(file) {
        if (file.size > this.MAX_IMAGE_SIZE) {
            alert('Image file is too large. Please choose an image smaller than 5MB.');
            return false;
        }

        if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
            alert('Invalid file type. Please choose a JPEG, PNG, GIF, or WebP image.');
            return false;
        }

        return true;
    }

    openProjectModal(projectId = null) {
        const modal = document.getElementById('project-modal');
        const form = document.getElementById('project-form');
        const title = document.getElementById('modal-title');
        
        form.reset();
        document.getElementById('photo-preview').innerHTML = '';
        
        if (projectId) {
            const project = this.projects.find(p => String(p.id) === String(projectId));
            if (project) {
                title.textContent = 'Edit Project';
                document.getElementById('project-id').value = project.id;
                document.getElementById('project-name').value = project.name;
                document.getElementById('project-description').value = project.description || '';
                document.getElementById('paint-recipe').value = project.paintRecipe || '';
                document.getElementById('project-notes').value = project.notes || '';
                
                if (project.photo) {
                    const sanitizedSrc = this.sanitizeImageSrc(project.photo);
                    if (sanitizedSrc) {
                        document.getElementById('photo-preview').innerHTML =
                            `<img src="${sanitizedSrc}" alt="Project photo" style="max-width: 200px; border-radius: 8px;">`;
                    }
                }
            }
        } else {
            title.textContent = 'New Project';
            document.getElementById('project-id').value = '';
        }
        
        modal.style.display = 'block';
    }

    closeProjectModal() {
        document.getElementById('project-modal').style.display = 'none';
    }

    async saveProject(e) {
        e.preventDefault();
        
        const projectId = document.getElementById('project-id').value.trim();
        const name = document.getElementById('project-name').value.trim();
        const description = document.getElementById('project-description').value.trim();
        const paintRecipe = document.getElementById('paint-recipe').value.trim();
        const notes = document.getElementById('project-notes').value.trim();
        const photoFile = document.getElementById('project-photo').files[0];
        
        // Validation
        if (!name) {
            alert('Project name is required.');
            return;
        }
        if (name.length > this.MAX_NAME_LENGTH) {
            alert(`Project name must be ${this.MAX_NAME_LENGTH} characters or less.`);
            return;
        }
        
        let photo = null;
        if (photoFile) {
            if (!this.validateImageFile(photoFile)) {
                return;
            }
            photo = await this.fileToBase64(photoFile);
        } else if (projectId) {
            const existingProject = this.projects.find(p => String(p.id) === String(projectId));
            photo = existingProject?.photo || null;
        }
        
        const projectData = {
            id: projectId || this.generateId(),
            name,
            description,
            paintRecipe,
            notes,
            photo,
            miniatures: projectId ? this.projects.find(p => String(p.id) === String(projectId))?.miniatures || [] : [],
            createdAt: projectId ? this.projects.find(p => String(p.id) === String(projectId))?.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (projectId) {
            const index = this.projects.findIndex(p => String(p.id) === String(projectId));
            if (index !== -1) {
                this.projects[index] = projectData;
            } else {
                console.error('Project not found for update:', projectId);
                alert('Error: Could not find project to update.');
                return;
            }
        } else {
            this.projects.push(projectData);
        }
        
        this.saveData();
        this.renderProjects();
        this.closeProjectModal();
    }

    openMiniatureModal(projectId, miniId = null) {
        const modal = document.getElementById('miniature-modal');
        const form = document.getElementById('miniature-form');
        const title = document.getElementById('mini-modal-title');
        
        form.reset();
        document.getElementById('mini-photo-preview').innerHTML = '';
        document.getElementById('mini-project-id').value = projectId;
        
        // Load templates into dropdown
        this.loadTemplateDropdown();
        
        if (miniId) {
            const project = this.projects.find(p => String(p.id) === String(projectId));
            const mini = project?.miniatures.find(m => String(m.id) === String(miniId));
            if (mini) {
                title.textContent = 'Edit Miniature';
                document.getElementById('mini-id').value = mini.id;
                document.getElementById('mini-name').value = mini.name;
                document.getElementById('mini-stage').value = mini.stage;
                document.getElementById('mini-recipe').value = mini.recipe || '';
                document.getElementById('mini-notes').value = mini.notes || '';
                
                if (mini.photo) {
                    const sanitizedSrc = this.sanitizeImageSrc(mini.photo);
                    if (sanitizedSrc) {
                        document.getElementById('mini-photo-preview').innerHTML =
                            `<img src="${sanitizedSrc}" alt="Miniature photo" style="max-width: 200px; border-radius: 8px;">`;
                    }
                }
            }
        } else {
            title.textContent = 'Add Miniature';
            document.getElementById('mini-id').value = '';
        }
        
        modal.style.display = 'block';
    }

    closeMiniatureModal() {
        document.getElementById('miniature-modal').style.display = 'none';
    }

    async saveMiniature(e) {
        e.preventDefault();
        
        const projectId = document.getElementById('mini-project-id').value.trim();
        const miniId = document.getElementById('mini-id').value.trim();
        const name = document.getElementById('mini-name').value.trim();
        const stage = document.getElementById('mini-stage').value;
        const recipe = document.getElementById('mini-recipe').value.trim();
        const notes = document.getElementById('mini-notes').value.trim();
        const photoFile = document.getElementById('mini-photo').files[0];
        
        // Validation
        if (!name) {
            alert('Miniature name is required.');
            return;
        }
        if (name.length > this.MAX_NAME_LENGTH) {
            alert(`Miniature name must be ${this.MAX_NAME_LENGTH} characters or less.`);
            return;
        }
        
        let photo = null;
        if (photoFile) {
            if (!this.validateImageFile(photoFile)) {
                return;
            }
            photo = await this.fileToBase64(photoFile);
        } else if (miniId) {
            const project = this.projects.find(p => String(p.id) === String(projectId));
            const existingMini = project?.miniatures.find(m => String(m.id) === String(miniId));
            photo = existingMini?.photo || null;
        }
        
        const miniData = {
            id: miniId || this.generateId(),
            name,
            stage,
            recipe,
            notes,
            photo,
            createdAt: miniId ? this.projects.find(p => String(p.id) === String(projectId))?.miniatures.find(m => String(m.id) === String(miniId))?.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const projectIndex = this.projects.findIndex(p => String(p.id) === String(projectId));
        if (projectIndex !== -1) {
            if (!this.projects[projectIndex].miniatures) {
                this.projects[projectIndex].miniatures = [];
            }
            
            if (miniId) {
                const miniIndex = this.projects[projectIndex].miniatures.findIndex(m => String(m.id) === String(miniId));
                this.projects[projectIndex].miniatures[miniIndex] = miniData;
            } else {
                this.projects[projectIndex].miniatures.push(miniData);
            }
            
            this.projects[projectIndex].updatedAt = new Date().toISOString();
        }
        
        this.saveData();
        this.renderProjects();
        this.closeMiniatureModal();
    }

    deleteProject(projectId) {
        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            this.projects = this.projects.filter(p => String(p.id) !== String(projectId));
            this.saveData();
            this.renderProjects();
        }
    }

    deleteMiniature(projectId, miniId) {
        if (confirm('Are you sure you want to delete this miniature?')) {
            const projectIndex = this.projects.findIndex(p => String(p.id) === String(projectId));
            if (projectIndex !== -1) {
                this.projects[projectIndex].miniatures = this.projects[projectIndex].miniatures.filter(m => String(m.id) !== String(miniId));
                this.projects[projectIndex].updatedAt = new Date().toISOString();
                this.saveData();
                this.renderProjects();
            }
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    previewPhoto(e, previewId) {
        const file = e.target.files[0];
        const preview = document.getElementById(previewId);

        if (file) {
            // Validate file before preview
            if (!this.validateImageFile(file)) {
                e.target.value = ''; // Clear the file input
                preview.innerHTML = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                const sanitizedSrc = this.sanitizeImageSrc(dataUrl);
                if (sanitizedSrc) {
                    preview.innerHTML = `<img src="${sanitizedSrc}" alt="Preview" style="max-width: 200px; border-radius: 8px;">`;
                } else {
                    preview.innerHTML = '';
                    alert('Invalid image data detected.');
                }
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    }

    renderProjects() {
        const grid = document.getElementById('projects-grid');
        
        if (this.projects.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.8);">
                    <h2>No projects yet</h2>
                    <p>Click "New Project" to start tracking your miniature painting!</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = this.projects.map(project => this.renderProjectCard(project)).join('');
    }

    renderProjectCard(project) {
        const miniatures = project.miniatures || [];
        const completedCount = miniatures.filter(m => m.stage === 'finished').length;
        
        return `
            <div class="project-card" data-project-id="${this.escapeHtml(project.id)}">
                <div class="project-header">
                    <h3 class="project-title">${this.escapeHtml(project.name)}</h3>
                    <div class="project-actions">
                        <button class="btn btn-small btn-secondary edit-project-btn" data-project-id="${this.escapeHtml(project.id)}">Edit</button>
                        <button class="btn btn-small btn-secondary delete-project-btn" data-project-id="${this.escapeHtml(project.id)}" style="background: #fed7d7; color: #c53030;">Delete</button>
                    </div>
                </div>
                
                ${project.photo ? `<img src="${this.sanitizeImageSrc(project.photo)}" alt="${this.escapeHtml(project.name)}" class="project-photo">` : ''}
                
                ${project.description ? `<p class="project-description">${this.escapeHtml(project.description)}</p>` : ''}
                
                ${project.paintRecipe ? `
                    <div class="paint-recipe">
                        <h4>🎨 Paint Recipe</h4>
                        <div class="paint-recipe-content">${this.escapeHtml(project.paintRecipe)}</div>
                    </div>
                ` : ''}
                
                <div class="miniatures-section">
                    <h4>
                        Miniatures (${completedCount}/${miniatures.length} completed)
                        <button class="btn btn-small btn-primary add-mini-btn" data-project-id="${this.escapeHtml(project.id)}">Add Mini</button>
                    </h4>
                    <div class="miniatures-list">
                        ${miniatures.map(mini => this.renderMiniatureItem(project.id, mini)).join('')}
                    </div>
                </div>
                
                ${project.notes ? `
                    <div class="notes-section">
                        <h4>📝 Notes</h4>
                        <div class="notes-content">${this.escapeHtml(project.notes)}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderMiniatureItem(projectId, mini) {
        return `
            <div class="miniature-item" data-project-id="${this.escapeHtml(projectId)}" data-mini-id="${this.escapeHtml(mini.id)}">
                <div class="miniature-info">
                    <div class="miniature-name">${this.escapeHtml(mini.name)}</div>
                    <span class="miniature-stage stage-${this.escapeHtml(mini.stage)}">${this.escapeHtml(mini.stage)}</span>
                    ${mini.recipe ? `
                        <div class="miniature-recipe">
                            <h5>🎨 Paint Recipe</h5>
                            <div class="miniature-recipe-content">${this.escapeHtml(mini.recipe)}</div>
                        </div>
                    ` : ''}
                    ${mini.notes ? `<div style="font-size: 0.8rem; color: #4a5568; margin-top: 5px;">${this.escapeHtml(mini.notes)}</div>` : ''}
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    ${mini.photo ? `<img src="${this.sanitizeImageSrc(mini.photo)}" alt="${this.escapeHtml(mini.name)}" class="miniature-photo">` : ''}
                    <button class="btn btn-small btn-secondary edit-mini-btn" data-project-id="${this.escapeHtml(projectId)}" data-mini-id="${this.escapeHtml(mini.id)}">Edit</button>
                    <button class="btn btn-small btn-secondary delete-mini-btn" data-project-id="${this.escapeHtml(projectId)}" data-mini-id="${this.escapeHtml(mini.id)}" style="background: #fed7d7; color: #c53030;">×</button>
                </div>
            </div>
        `;
    }

    // Template Management Functions
    loadTemplateDropdown() {
        const select = document.getElementById('recipe-template');
        select.innerHTML = '<option value="">Choose a template...</option>';
        
        this.templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = template.name;
            select.appendChild(option);
        });
    }

    applyTemplate() {
        const templateId = document.getElementById('recipe-template').value;
        if (!templateId) return;
        
        const template = this.templates.find(t => t.id === templateId);
        if (template) {
            document.getElementById('mini-recipe').value = template.recipe;
        }
    }

    openSaveTemplateModal() {
        const recipe = document.getElementById('mini-recipe').value.trim();
        if (!recipe) {
            alert('Please enter a recipe before saving as template.');
            return;
        }
        
        document.getElementById('template-recipe').value = recipe;
        document.getElementById('template-modal').style.display = 'block';
    }

    closeTemplateModal() {
        document.getElementById('template-modal').style.display = 'none';
    }

    saveTemplate(e) {
        e.preventDefault();
        
        const name = document.getElementById('template-name').value.trim();
        const recipe = document.getElementById('template-recipe').value.trim();
        
        // Validation
        if (!name) {
            alert('Template name is required.');
            return;
        }
        if (name.length > this.MAX_TEMPLATE_NAME_LENGTH) {
            alert(`Template name must be ${this.MAX_TEMPLATE_NAME_LENGTH} characters or less.`);
            return;
        }
        
        const templateData = {
            id: this.generateId(),
            name,
            recipe,
            createdAt: new Date().toISOString()
        };
        
        this.templates.push(templateData);
        this.saveData();
        this.closeTemplateModal();
        this.loadTemplateDropdown();
        
        // Clear the form
        document.getElementById('template-form').reset();
    }

    openManageTemplatesModal() {
        this.renderTemplatesList();
        document.getElementById('manage-templates-modal').style.display = 'block';
    }

    closeManageTemplatesModal() {
        document.getElementById('manage-templates-modal').style.display = 'none';
    }

    renderTemplatesList() {
        const container = document.getElementById('templates-list');
        
        if (this.templates.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #4a5568;">
                    <p>No recipe templates saved yet.</p>
                    <p>Create templates while adding miniatures to reuse your favorite paint schemes!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.templates.map(template => `
            <div class="template-item" data-template-id="${this.escapeHtml(template.id)}">
                <div class="template-header">
                    <span class="template-name">${this.escapeHtml(template.name)}</span>
                    <button class="btn btn-small btn-secondary delete-template-btn" data-template-id="${this.escapeHtml(template.id)}" style="background: #fed7d7; color: #c53030;">Delete</button>
                </div>
                <div class="template-recipe">${this.escapeHtml(template.recipe)}</div>
            </div>
        `).join('');
    }

    deleteTemplate(templateId) {
        if (confirm('Are you sure you want to delete this template?')) {
            this.templates = this.templates.filter(t => String(t.id) !== String(templateId));
            this.saveData();
            this.renderTemplatesList();
            this.loadTemplateDropdown();
        }
    }
}

// Initialize the app in an IIFE to avoid global namespace pollution
(function() {
    'use strict';
    const tracker = new MiniatureTracker();
})();