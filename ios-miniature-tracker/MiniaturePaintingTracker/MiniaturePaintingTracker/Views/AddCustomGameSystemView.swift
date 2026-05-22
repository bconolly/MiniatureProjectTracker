//
//  AddCustomGameSystemView.swift
//  MiniaturePaintingTracker
//

import SwiftUI
import CoreData

struct AddCustomGameSystemView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss

    /// Called with the newly-saved game-system key (its storage name).
    let onSave: (String) -> Void

    @State private var name: String = ""
    @State private var errorMessage: String?

    private var trimmedName: String {
        name.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var canSave: Bool {
        !trimmedName.isEmpty && errorMessage == nil
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Name") {
                    TextField("e.g. Mordheim, Kill Team, Warhammer Fantasy", text: $name)
                        .autocorrectionDisabled()
                        .onChange(of: name) { _, _ in
                            errorMessage = nil
                        }
                }

                if let errorMessage {
                    Section {
                        Label(errorMessage, systemImage: "exclamationmark.triangle.fill")
                            .foregroundStyle(.orange)
                    }
                }

                Section {
                    Text("Custom game systems are stored on this device and appear in the Game System picker for any project.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Add Game System")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .disabled(!canSave)
                }
            }
        }
    }

    private func save() {
        let candidate = trimmedName
        guard !candidate.isEmpty else { return }

        if CustomGameSystem.nameExists(candidate, in: viewContext) {
            errorMessage = "A game system with this name already exists."
            return
        }

        guard let entity = CustomGameSystem.create(in: viewContext, name: candidate) else {
            errorMessage = "Could not save the game system."
            return
        }

        do {
            try viewContext.save()
            onSave(entity.storageKey)
            dismiss()
        } catch {
            errorMessage = "Failed to save: \(error.localizedDescription)"
        }
    }
}

#Preview {
    AddCustomGameSystemView { _ in }
        .environment(\.managedObjectContext, CoreDataManager.shared.persistentContainer.viewContext)
}
