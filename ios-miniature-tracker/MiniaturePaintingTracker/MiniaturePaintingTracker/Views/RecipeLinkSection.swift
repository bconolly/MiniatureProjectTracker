//
//  RecipeLinkSection.swift
//  MiniaturePaintingTracker
//
//  Created on 22/1/2026.
//

import SwiftUI
import CoreData

struct RecipeLinkSection: View {
    @Environment(\.managedObjectContext) private var viewContext
    
    @ObservedObject var miniature: Miniature
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Recipe.name, ascending: true)],
        animation: .default
    )
    private var allRecipes: FetchedResults<Recipe>
    
    @State private var showingRecipePicker = false
    
    var linkedRecipes: [Recipe] {
        (miniature.recipes as? Set<Recipe>)?.sorted { ($0.name ?? "") < ($1.name ?? "") } ?? []
    }
    
    var availableRecipes: [Recipe] {
        let linked = Set(linkedRecipes.compactMap { $0.id })
        return allRecipes.filter { recipe in
            guard let recipeId = recipe.id else { return false }
            return !linked.contains(recipeId)
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Paint Recipes")
                    .font(.headline)
                Spacer()
                Button {
                    showingRecipePicker = true
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                }
                .disabled(availableRecipes.isEmpty)
            }
            
            if linkedRecipes.isEmpty {
                emptyState
            } else {
                linkedRecipesView
            }
        }
        .sheet(isPresented: $showingRecipePicker) {
            RecipePickerView(
                availableRecipes: availableRecipes,
                onSelect: { recipe in
                    linkRecipe(recipe)
                    showingRecipePicker = false
                }
            )
        }
    }
    
    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "book.pages")
                .font(.largeTitle)
                .foregroundStyle(.secondary)
            Text("No recipes linked")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text("Link paint recipes to track colors and techniques")
                .font(.caption)
                .foregroundStyle(.tertiary)
                .multilineTextAlignment(.center)
            
            if !allRecipes.isEmpty {
                Button("Link Recipe") {
                    showingRecipePicker = true
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 30)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
    
    private var linkedRecipesView: some View {
        VStack(spacing: 8) {
            ForEach(linkedRecipes) { recipe in
                RecipeLinkRow(recipe: recipe) {
                    unlinkRecipe(recipe)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
    
    private func linkRecipe(_ recipe: Recipe) {
        miniature.addToRecipes(recipe)
        miniature.updatedAt = Date()
        
        do {
            try viewContext.save()
        } catch {
            print("Error linking recipe: \(error)")
        }
    }
    
    private func unlinkRecipe(_ recipe: Recipe) {
        miniature.removeFromRecipes(recipe)
        miniature.updatedAt = Date()
        
        do {
            try viewContext.save()
        } catch {
            print("Error unlinking recipe: \(error)")
        }
    }
}

// MARK: - Recipe Link Row

struct RecipeLinkRow: View {
    let recipe: Recipe
    let onUnlink: () -> Void
    
    var body: some View {
        HStack {
            Image(systemName: "book.pages.fill")
                .foregroundStyle(.blue)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(recipe.name ?? "Unknown Recipe")
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                if !recipe.paintsUsed.isEmpty {
                    Text(recipe.paintsUsed.prefix(3).joined(separator: ", "))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
            
            Spacer()
            
            Button(role: .destructive) {
                onUnlink()
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(.secondary)
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Recipe Picker View

struct RecipePickerView: View {
    @Environment(\.dismiss) private var dismiss
    
    let availableRecipes: [Recipe]
    let onSelect: (Recipe) -> Void
    
    var body: some View {
        NavigationStack {
            Group {
                if availableRecipes.isEmpty {
                    ContentUnavailableView(
                        "No Recipes Available",
                        systemImage: "book.pages",
                        description: Text("All recipes are already linked or no recipes exist yet.")
                    )
                } else {
                    List(availableRecipes) { recipe in
                        Button {
                            onSelect(recipe)
                        } label: {
                            RecipePickerRow(recipe: recipe)
                        }
                    }
                }
            }
            .navigationTitle("Link Recipe")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct RecipePickerRow: View {
    let recipe: Recipe
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(recipe.name ?? "Unknown")
                    .font(.headline)
                    .foregroundStyle(.primary)
                
                HStack(spacing: 8) {
                    Label(recipe.miniatureTypeEnum.displayName, systemImage: recipe.miniatureTypeEnum.iconName)
                        .font(.caption)
                    
                    if !recipe.paintsUsed.isEmpty {
                        Text("•")
                        Text("\(recipe.paintsUsed.count) paints")
                            .font(.caption)
                    }
                }
                .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "plus.circle")
                .font(.title2)
                .foregroundStyle(.blue)
        }
        .contentShape(Rectangle())
    }
}

// MARK: - Preview

#Preview {
    NavigationStack {
        ScrollView {
            RecipeLinkSection(miniature: Miniature())
                .padding()
        }
        .environment(\.managedObjectContext, CoreDataManager.shared.persistentContainer.viewContext)
    }
}
