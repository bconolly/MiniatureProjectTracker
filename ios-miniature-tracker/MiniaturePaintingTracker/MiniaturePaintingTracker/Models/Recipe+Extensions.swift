//
//  Recipe+Extensions.swift
//  MiniaturePaintingTracker
//
//  Created by Kiro on 22/1/2026.
//

import Foundation
import CoreData

// MARK: - Recipe Entity Extensions

extension Recipe {
    
    // MARK: - Computed Properties
    
    /// Miniature type as an enum value
    var miniatureTypeEnum: MiniatureType {
        get {
            return MiniatureType(rawValue: miniatureType ?? "") ?? .troop
        }
        set {
            miniatureType = newValue.rawValue
        }
    }
    
    /// Steps array decoded from JSON data
    var steps: [String] {
        get {
            guard let stepsData = stepsData, let decoded = try? JSONDecoder().decode([String].self, from: stepsData) else {
                return []
            }
            return decoded
        }
        set {
            stepsData = (try? JSONEncoder().encode(newValue)) ?? Data()
            updatedAt = Date()
        }
    }
    
    /// Paints used array decoded from JSON data
    var paintsUsed: [String] {
        get {
            guard let paintsUsedData = paintsUsedData, let decoded = try? JSONDecoder().decode([String].self, from: paintsUsedData) else {
                return []
            }
            return decoded
        }
        set {
            paintsUsedData = (try? JSONEncoder().encode(newValue)) ?? Data()
            updatedAt = Date()
        }
    }
    
    /// Techniques array decoded from JSON data
    var techniques: [String] {
        get {
            guard let techniquesData = techniquesData, let decoded = try? JSONDecoder().decode([String].self, from: techniquesData) else {
                return []
            }
            return decoded
        }
        set {
            techniquesData = (try? JSONEncoder().encode(newValue)) ?? Data()
            updatedAt = Date()
        }
    }
    
    /// Total number of steps in the recipe
    var stepCount: Int {
        return steps.count
    }
    
    /// Total number of paints used in the recipe
    var paintCount: Int {
        return paintsUsed.count
    }
    
    /// Total number of techniques used in the recipe
    var techniqueCount: Int {
        return techniques.count
    }
    
    /// Display name combining type and name
    var displayName: String {
        return "\(miniatureTypeEnum.displayName) Recipe: \(name ?? "Unknown")"
    }
    
    /// Summary text for the recipe
    var summary: String {
        let components = [
            stepCount > 0 ? "\(stepCount) steps" : nil,
            paintCount > 0 ? "\(paintCount) paints" : nil,
            techniqueCount > 0 ? "\(techniqueCount) techniques" : nil
        ].compactMap { $0 }
        
        return components.isEmpty ? "No details" : components.joined(separator: ", ")
    }
    
    // MARK: - Validation
    
    /// Validate the recipe data
    /// - Throws: ValidationError if validation fails
    func validate() throws {
        guard let name = name, !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw ValidationError.emptyRequiredField("name")
        }
        
        guard let miniatureType = miniatureType, MiniatureType(rawValue: miniatureType) != nil else {
            throw ValidationError.invalidEnumValue("miniatureType", miniatureType ?? "nil")
        }
        
        // Validate that JSON data is properly formatted
        if let stepsData = stepsData {
            do {
                _ = try JSONDecoder().decode([String].self, from: stepsData)
            } catch {
                throw ValidationError.invalidJSONData("stepsData")
            }
        }
        
        if let paintsUsedData = paintsUsedData {
            do {
                _ = try JSONDecoder().decode([String].self, from: paintsUsedData)
            } catch {
                throw ValidationError.invalidJSONData("paintsUsedData")
            }
        }
        
        if let techniquesData = techniquesData {
            do {
                _ = try JSONDecoder().decode([String].self, from: techniquesData)
            } catch {
                throw ValidationError.invalidJSONData("techniquesData")
            }
        }
    }
    
    // MARK: - Recipe Management
    
    /// Add a step to the recipe
    /// - Parameter step: The step to add
    func addStep(_ step: String) {
        var currentSteps = steps
        currentSteps.append(step)
        steps = currentSteps
    }
    
    /// Remove a step at the specified index
    /// - Parameter index: The index of the step to remove
    func removeStep(at index: Int) {
        var currentSteps = steps
        guard index >= 0 && index < currentSteps.count else { return }
        currentSteps.remove(at: index)
        steps = currentSteps
    }
    
    /// Add a paint to the recipe
    /// - Parameter paint: The paint to add
    func addPaint(_ paint: String) {
        var currentPaints = paintsUsed
        if !currentPaints.contains(paint) {
            currentPaints.append(paint)
            paintsUsed = currentPaints
        }
    }
    
    /// Remove a paint from the recipe
    /// - Parameter paint: The paint to remove
    func removePaint(_ paint: String) {
        var currentPaints = paintsUsed
        currentPaints.removeAll { $0 == paint }
        paintsUsed = currentPaints
    }
    
    /// Add a technique to the recipe
    /// - Parameter technique: The technique to add
    func addTechnique(_ technique: String) {
        var currentTechniques = techniques
        if !currentTechniques.contains(technique) {
            currentTechniques.append(technique)
            techniques = currentTechniques
        }
    }
    
    /// Remove a technique from the recipe
    /// - Parameter technique: The technique to remove
    func removeTechnique(_ technique: String) {
        var currentTechniques = techniques
        currentTechniques.removeAll { $0 == technique }
        techniques = currentTechniques
    }
    
    // MARK: - Convenience Initializers
    
    /// Create a new recipe with the specified parameters
    /// - Parameters:
    ///   - context: The managed object context
    ///   - name: The recipe name
    ///   - type: The miniature type
    ///   - steps: Initial steps (optional)
    ///   - paints: Initial paints (optional)
    ///   - techniques: Initial techniques (optional)
    ///   - notes: Optional notes
    /// - Returns: A new Recipe instance
    static func create(
        in context: NSManagedObjectContext,
        name: String,
        type: MiniatureType,
        steps: [String] = [],
        paints: [String] = [],
        techniques: [String] = [],
        notes: String? = nil
    ) -> Recipe {
        let recipe = Recipe(context: context)
        recipe.id = UUID()
        recipe.name = name
        recipe.miniatureTypeEnum = type
        recipe.notes = notes
        recipe.createdAt = Date()
        recipe.updatedAt = Date()
        
        // Set the arrays (this will encode them to JSON)
        recipe.steps = steps
        recipe.paintsUsed = paints
        recipe.techniques = techniques
        
        return recipe
    }
}

// MARK: - Fetch Requests

extension Recipe {
    
    /// Fetch request for recipes by miniature type
    /// - Parameter type: The miniature type to filter by
    /// - Returns: A configured fetch request
    static func fetchRequest(for type: MiniatureType) -> NSFetchRequest<Recipe> {
        let request: NSFetchRequest<Recipe> = Recipe.fetchRequest()
        request.predicate = NSPredicate(format: "miniatureType == %@", type.rawValue)
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \Recipe.name, ascending: true)
        ]
        return request
    }
    
    /// Fetch request for recipes sorted by name
    /// - Returns: A configured fetch request
    static func fetchRequestSortedByName() -> NSFetchRequest<Recipe> {
        let request: NSFetchRequest<Recipe> = Recipe.fetchRequest()
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \Recipe.name, ascending: true)
        ]
        return request
    }
    
    /// Fetch request for recipes sorted by creation date (newest first)
    /// - Returns: A configured fetch request
    static func fetchRequestSortedByDate() -> NSFetchRequest<Recipe> {
        let request: NSFetchRequest<Recipe> = Recipe.fetchRequest()
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \Recipe.createdAt, ascending: false)
        ]
        return request
    }
    
    /// Fetch request for recipes by miniature type sorted by name
    /// - Parameter type: The miniature type to filter by
    /// - Returns: A configured fetch request
    static func fetchRequestByTypeSortedByName(for type: MiniatureType) -> NSFetchRequest<Recipe> {
        let request = fetchRequest(for: type)
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \Recipe.name, ascending: true)
        ]
        return request
    }
}

// MARK: - Additional Validation Errors

extension ValidationError {
    static func invalidJSONData(_ field: String) -> ValidationError {
        return .invalidEnumValue(field, "Invalid JSON data")
    }
}