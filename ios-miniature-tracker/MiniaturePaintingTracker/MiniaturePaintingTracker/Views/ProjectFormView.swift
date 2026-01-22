//
//  ProjectFormView.swift
//  MiniaturePaintingTracker
//
//  Created on 22/1/2026.
//

import SwiftUI
import CoreData

enum ProjectFormMode {
    case create
    case edit(Project)
}

struct ProjectFormView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss
    
    let mode: ProjectFormMode
    
    @State private var name = ""
    @State private var army = ""
    @State private var gameSystem: GameSystem = .warhammer40k
    @State private var projectDescription = ""
    @State private var showingValidationError = false
    @State private var validationMessage = ""
    
    var isEditing: Bool {
        if case .edit = mode { return true }
        return false
    }
    
    var title: String {
        isEditing ? "Edit Project" : "New Project"
    }
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Project Details") {
                    TextField("Project Name", text: $name)
                    TextField("Army", text: $army)
                }
                
                Section("Game System") {
                    Picker("Game System", selection: $gameSystem) {
                        ForEach(GameSystem.allCases, id: \.self) { system in
                            HStack {
                                GameSystemBadge(gameSystem: system)
                                Text(system.displayName)
                            }
                            .tag(system)
                        }
                    }
                    .pickerStyle(.navigationLink)
                }
                
                Section("Description (Optional)") {
                    TextEditor(text: $projectDescription)
                        .frame(minHeight: 100)
                }
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveProject()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || 
                             army.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            .onAppear {
                loadExistingData()
            }
            .alert("Validation Error", isPresented: $showingValidationError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(validationMessage)
            }
        }
    }
    
    private func loadExistingData() {
        if case .edit(let project) = mode {
            name = project.name ?? ""
            army = project.army ?? ""
            gameSystem = project.gameSystemEnum
            projectDescription = project.projectDescription ?? ""
        }
    }
    
    private func saveProject() {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        let trimmedArmy = army.trimmingCharacters(in: .whitespaces)
        
        guard !trimmedName.isEmpty else {
            validationMessage = "Please enter a project name."
            showingValidationError = true
            return
        }
        
        guard !trimmedArmy.isEmpty else {
            validationMessage = "Please enter an army name."
            showingValidationError = true
            return
        }
        
        let project: Project
        
        if case .edit(let existingProject) = mode {
            project = existingProject
        } else {
            project = Project(context: viewContext)
            project.id = UUID()
            project.createdAt = Date()
        }
        
        project.name = trimmedName
        project.army = trimmedArmy
        project.gameSystemEnum = gameSystem
        project.projectDescription = projectDescription.isEmpty ? nil : projectDescription
        project.updatedAt = Date()
        
        do {
            try viewContext.save()
            dismiss()
        } catch {
            validationMessage = "Failed to save project: \(error.localizedDescription)"
            showingValidationError = true
        }
    }
}

#Preview {
    ProjectFormView(mode: .create)
        .environment(\.managedObjectContext, CoreDataManager.shared.persistentContainer.viewContext)
}
