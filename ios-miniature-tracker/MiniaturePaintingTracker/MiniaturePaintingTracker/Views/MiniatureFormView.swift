//
//  MiniatureFormView.swift
//  MiniaturePaintingTracker
//
//  Created on 22/1/2026.
//

import SwiftUI
import CoreData

enum MiniatureFormMode {
    case create
    case edit(Miniature)
}

struct MiniatureFormView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss
    
    let project: Project
    let mode: MiniatureFormMode
    
    @State private var name = ""
    @State private var miniatureType: MiniatureType = .troop
    @State private var progressStatus: ProgressStatus = .unpainted
    @State private var notes = ""
    @State private var showingValidationError = false
    @State private var validationMessage = ""
    
    var isEditing: Bool {
        if case .edit = mode { return true }
        return false
    }
    
    var title: String {
        isEditing ? "Edit Miniature" : "Add Miniature"
    }
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Miniature Details") {
                    TextField("Name", text: $name)
                    
                    Picker("Type", selection: $miniatureType) {
                        ForEach(MiniatureType.allCases, id: \.self) { type in
                            Label(type.displayName, systemImage: type.iconName)
                                .tag(type)
                        }
                    }
                }
                
                if isEditing {
                    Section("Progress") {
                        Picker("Status", selection: $progressStatus) {
                            ForEach(ProgressStatus.allCases, id: \.self) { status in
                                HStack {
                                    Image(systemName: status.iconName)
                                        .foregroundStyle(status.color)
                                    Text(status.displayName)
                                }
                                .tag(status)
                            }
                        }
                        .pickerStyle(.navigationLink)
                    }
                }
                
                Section("Notes (Optional)") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 80)
                }
                
                Section {
                    HStack {
                        Text("Project")
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text(project.name ?? "Unknown")
                    }
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
                        saveMiniature()
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
        if case .edit(let miniature) = mode {
            name = miniature.name ?? ""
            miniatureType = miniature.miniatureTypeEnum
            progressStatus = miniature.progressStatusEnum
            notes = miniature.notes ?? ""
        }
    }
    
    private func saveMiniature() {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        
        guard !trimmedName.isEmpty else {
            validationMessage = "Please enter a miniature name."
            showingValidationError = true
            return
        }
        
        let miniature: Miniature
        
        if case .edit(let existingMiniature) = mode {
            miniature = existingMiniature
        } else {
            miniature = Miniature(context: viewContext)
            miniature.id = UUID()
            miniature.createdAt = Date()
            miniature.project = project
            miniature.progressStatusEnum = .unpainted
        }
        
        miniature.name = trimmedName
        miniature.miniatureTypeEnum = miniatureType
        
        if isEditing {
            miniature.progressStatusEnum = progressStatus
        }
        
        miniature.notes = notes.isEmpty ? nil : notes
        miniature.updatedAt = Date()
        
        do {
            try viewContext.save()
            dismiss()
        } catch {
            validationMessage = "Failed to save miniature: \(error.localizedDescription)"
            showingValidationError = true
        }
    }
}

#Preview {
    MiniatureFormView(project: Project(), mode: .create)
        .environment(\.managedObjectContext, CoreDataManager.shared.persistentContainer.viewContext)
}
