//
//  RecipeListView.swift
//  MiniaturePaintingTracker
//
//  Created on 22/1/2026.
//

import SwiftUI
import CoreData

struct RecipeListView: View {
    @Environment(\.managedObjectContext) private var viewContext
    
    @FetchRequest(
        sortDescriptors: [
            NSSortDescriptor(keyPath: \Recipe.miniatureType, ascending: true),
            NSSortDescriptor(keyPath: \Recipe.name, ascending: true)
        ],
        animation: .default)
    private var recipes: FetchedResults<Recipe>
    
    @State private var showingAddRecipe = false
    @State private var typeFilter: MiniatureType? = nil
    @State private var searchText = ""
    
    var body: some View {
        NavigationStack {
            Group {
                if recipes.isEmpty {
                    emptyState
                } else {
                    recipeList
                }
            }
            .navigationTitle("Recipes")
            .searchable(text: $searchText, prompt: "Search recipes")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showingAddRecipe = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
                
                ToolbarItem(placement: .secondaryAction) {
                    Menu {
                        Button {
                            typeFilter = nil
                        } label: {
                            if typeFilter == nil {
                                Label("All Types", systemImage: "checkmark")
                            } else {
                                Text("All Types")
                            }
                        }
                        
                        ForEach(MiniatureType.allCases, id: \.self) { type in
                            Button {
                                typeFilter = type
                            } label: {
                                if typeFilter == type {
                                    Label(type.displayName, systemImage: "checkmark")
                                } else {
                                    Label(type.displayName, systemImage: type.iconName)
                                }
                            }
                        }
                    } label: {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                    }
                }
            }
            .sheet(isPresented: $showingAddRecipe) {
                RecipeFormView(mode: .create)
            }
        }
    }
    
    // MARK: - Empty State
    
    private var emptyState: some View {
        ContentUnavailableView {
            Label("No Recipes", systemImage: "book")
        } description: {
            Text("Create painting recipes to remember your techniques and color schemes.")
        } actions: {
            Button("Create Recipe") {
                showingAddRecipe = true
            }
            .buttonStyle(.borderedProminent)
        }
    }
    
    // MARK: - Recipe List
    
    private var recipeList: some View {
        List {
            ForEach(MiniatureType.allCases, id: \.self) { type in
                let recipesForType = filteredRecipes.filter { $0.miniatureTypeEnum == type }
                
                if !recipesForType.isEmpty && (typeFilter == nil || typeFilter == type) {
                    Section {
                        ForEach(recipesForType) { recipe in
                            NavigationLink(destination: RecipeDetailView(recipe: recipe)) {
                                RecipeRowView(recipe: recipe)
                            }
                        }
                        .onDelete { indexSet in
                            deleteRecipes(recipesForType, at: indexSet)
                        }
                    } header: {
                        HStack {
                            Image(systemName: type.iconName)
                            Text(type.displayName + " Recipes")
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
    }
    
    // MARK: - Computed Properties
    
    private var filteredRecipes: [Recipe] {
        var result = Array(recipes)
        
        if !searchText.isEmpty {
            result = result.filter { recipe in
                (recipe.name?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                recipe.paintsUsed.contains { $0.localizedCaseInsensitiveContains(searchText) } ||
                recipe.techniques.contains { $0.localizedCaseInsensitiveContains(searchText) }
            }
        }
        
        if let filter = typeFilter {
            result = result.filter { $0.miniatureTypeEnum == filter }
        }
        
        return result
    }
    
    // MARK: - Actions
    
    private func deleteRecipes(_ recipes: [Recipe], at offsets: IndexSet) {
        for index in offsets {
            viewContext.delete(recipes[index])
        }
        
        do {
            try viewContext.save()
        } catch {
            print("Error deleting recipe: \(error)")
        }
    }
}

// MARK: - Recipe Row View

struct RecipeRowView: View {
    @ObservedObject var recipe: Recipe
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(recipe.name ?? "Unknown Recipe")
                    .font(.headline)
                
                Spacer()
                
                Image(systemName: recipe.miniatureTypeEnum.iconName)
                    .foregroundStyle(.secondary)
            }
            
            Text(recipe.summary)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            
            if !recipe.paintsUsed.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(recipe.paintsUsed.prefix(5), id: \.self) { paint in
                            Text(paint)
                                .font(.caption2)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color(.systemGray5))
                                .clipShape(Capsule())
                        }
                        
                        if recipe.paintsUsed.count > 5 {
                            Text("+\(recipe.paintsUsed.count - 5)")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    RecipeListView()
        .environment(\.managedObjectContext, CoreDataManager.shared.persistentContainer.viewContext)
}
