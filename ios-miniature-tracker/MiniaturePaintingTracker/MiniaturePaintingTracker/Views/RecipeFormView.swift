//
//  RecipeFormView.swift
//  MiniaturePaintingTracker
//
//  Created on 22/1/2026.
//

import SwiftUI
import CoreData

enum RecipeFormMode {
    case create
    case edit(Recipe)
}

struct RecipeFormView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss
    
    let mode: RecipeFormMode
    
    @State private var name = ""
    @State private var miniatureType: MiniatureType = .troop
    @State private var steps: [String] = []
    @State private var paintsUsed: [String] = []
    @State private var techniques: [String] = []
    @State private var notes = ""
    
    @State private var newStep = ""
    @State private var newPaint = ""
    @State private var newTechnique = ""
    
    @State private var showingValidationError = false
    @State private var validationMessage = ""
    
    var isEditing: Bool {
        if case .edit = mode { return true }
        return false
    }
    
    var title: String {
        isEditing ? "Edit Recipe" : "New Recipe"
    }
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Recipe Details") {
                    TextField("Recipe Name", text: $name)
                    
                    Picker("Miniature Type", selection: $miniatureType) {
                        ForEach(MiniatureType.allCases, id: \.self) { type in
                            Label(type.displayName, systemImage: type.iconName)
                                .tag(type)
                        }
                    }
                }
                
                // Steps Section
                Section {
                    ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                        HStack {
                            Text("\(index + 1).")
                                .fontWeight(.bold)
                                .foregroundStyle(.blue)
                                .frame(width: 30)
                            Text(step)
                        }
                    }
                    .onDelete { indexSet in
                        steps.remove(atOffsets: indexSet)
                    }
                    .onMove { from, to in
                        steps.move(fromOffsets: from, toOffset: to)
                    }
                    
                    HStack {
                        TextField("Add step...", text: $newStep)
                        Button {
                            addStep()
                        } label: {
                            Image(systemName: "plus.circle.fill")
                                .foregroundStyle(.blue)
                        }
                        .disabled(newStep.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                } header: {
                    HStack {
                        Text("Steps")
                        Spacer()
                        EditButton()
                            .font(.caption)
                    }
                }
                
                // Paints Section
                Section {
                    FlowLayout(spacing: 8) {
                        ForEach(paintsUsed, id: \.self) { paint in
                            HStack(spacing: 4) {
                                Text(paint)
                                Button {
                                    paintsUsed.removeAll { $0 == paint }
                                } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .font(.caption)
                                }
                            }
                            .font(.caption)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.purple.opacity(0.15))
                            .foregroundStyle(.purple)
                            .clipShape(Capsule())
                        }
                    }
                    
                    HStack {
                        TextField("Add paint...", text: $newPaint)
                        Button {
                            addPaint()
                        } label: {
                            Image(systemName: "plus.circle.fill")
                                .foregroundStyle(.purple)
                        }
                        .disabled(newPaint.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                } header: {
                    Text("Paints Used")
                }
                
                // Techniques Section
                Section {
                    ForEach(techniques, id: \.self) { technique in
                        HStack {
                            Image(systemName: "paintbrush.pointed.fill")
                                .foregroundStyle(.orange)
                            Text(technique)
                        }
                    }
                    .onDelete { indexSet in
                        techniques.remove(atOffsets: indexSet)
                    }
                    
                    HStack {
                        TextField("Add technique...", text: $newTechnique)
                        Button {
                            addTechnique()
                        } label: {
                            Image(systemName: "plus.circle.fill")
                                .foregroundStyle(.orange)
                        }
                        .disabled(newTechnique.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                } header: {
                    Text("Techniques")
                }
                
                // Notes Section
                Section("Notes (Optional)") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 80)
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
                        saveRecipe()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
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
        if case .edit(let recipe) = mode {
            name = recipe.name ?? ""
            miniatureType = recipe.miniatureTypeEnum
            steps = recipe.steps
            paintsUsed = recipe.paintsUsed
            techniques = recipe.techniques
            notes = recipe.notes ?? ""
        }
    }
    
    private func addStep() {
        let trimmed = newStep.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        steps.append(trimmed)
        newStep = ""
    }
    
    private func addPaint() {
        let trimmed = newPaint.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty, !paintsUsed.contains(trimmed) else { return }
        paintsUsed.append(trimmed)
        newPaint = ""
    }
    
    private func addTechnique() {
        let trimmed = newTechnique.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty, !techniques.contains(trimmed) else { return }
        techniques.append(trimmed)
        newTechnique = ""
    }
    
    private func saveRecipe() {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        
        guard !trimmedName.isEmpty else {
            validationMessage = "Please enter a recipe name."
            showingValidationError = true
            return
        }
        
        let recipe: Recipe
        
        if case .edit(let existingRecipe) = mode {
            recipe = existingRecipe
        } else {
            recipe = Recipe(context: viewContext)
            recipe.id = UUID()
            recipe.createdAt = Date()
        }
        
        recipe.name = trimmedName
        recipe.miniatureTypeEnum = miniatureType
        recipe.steps = steps
        recipe.paintsUsed = paintsUsed
        recipe.techniques = techniques
        recipe.notes = notes.isEmpty ? nil : notes
        recipe.updatedAt = Date()
        
        do {
            try viewContext.save()
            dismiss()
        } catch {
            validationMessage = "Failed to save recipe: \(error.localizedDescription)"
            showingValidationError = true
        }
    }
}

#Preview {
    RecipeFormView(mode: .create)
        .environment(\.managedObjectContext, CoreDataManager.shared.persistentContainer.viewContext)
}
