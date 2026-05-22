//
//  Project+Extensions.swift
//  MiniaturePaintingTracker
//
//  Created by Kiro on 22/1/2026.
//

import Foundation
import CoreData

// MARK: - Project Entity Extensions

extension Project {
    
    // MARK: - Computed Properties
    
    /// Game system as an enum value. Returns nil when the stored string
    /// is a user-defined (custom) game system. Use `gameSystemKey` for the
    /// canonical raw value and `gameSystemDisplayName` for UI display.
    var gameSystemEnum: GameSystem? {
        get {
            return GameSystem(rawValue: gameSystem ?? "")
        }
        set {
            gameSystem = newValue?.rawValue
        }
    }

    /// Canonical raw key for the project's game system. Either a built-in
    /// `GameSystem.rawValue` ("age_of_sigmar", …) or a custom user-entered name.
    var gameSystemKey: String {
        get { gameSystem ?? "" }
        set { gameSystem = newValue }
    }

    /// Human-readable display name for the project's game system,
    /// resolving built-in raw values and passing through custom names.
    var gameSystemDisplayName: String {
        return GameSystemDisplay.displayName(for: gameSystem ?? "")
    }

    /// Short abbreviation for compact badge display.
    var gameSystemAbbreviation: String {
        return GameSystemDisplay.abbreviation(for: gameSystem ?? "")
    }
    
    /// Array of miniatures sorted by creation date
    var miniaturesArray: [Miniature] {
        let set = miniatures as? Set<Miniature> ?? []
        return set.sorted { ($0.createdAt ?? Date.distantPast) < ($1.createdAt ?? Date.distantPast) }
    }
    
    /// Count of miniatures in the project
    var miniatureCount: Int {
        return miniatures?.count ?? 0
    }
    
    /// Progress summary for the project
    var progressSummary: [ProgressStatus: Int] {
        var summary: [ProgressStatus: Int] = [:]
        
        for status in ProgressStatus.allCases {
            summary[status] = 0
        }
        
        for miniature in miniaturesArray {
            let status = miniature.progressStatusEnum
            summary[status] = (summary[status] ?? 0) + 1
        }
        
        return summary
    }
    
    /// Overall completion percentage (0.0 to 1.0)
    var completionPercentage: Double {
        let miniatures = miniaturesArray
        guard !miniatures.isEmpty else { return 0.0 }
        
        let totalProgress = miniatures.reduce(0.0) { sum, miniature in
            return sum + miniature.progressStatusEnum.progressPercentage
        }
        
        return totalProgress / Double(miniatures.count)
    }
    
    // MARK: - Validation
    
    /// Validate the project data
    /// - Throws: ValidationError if validation fails
    func validate() throws {
        guard let name = name, !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw ValidationError.emptyRequiredField("name")
        }
        
        guard let army = army, !army.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw ValidationError.emptyRequiredField("army")
        }
        
        guard let gameSystem = gameSystem,
              !gameSystem.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        else {
            throw ValidationError.emptyRequiredField("gameSystem")
        }
    }
    
    // MARK: - Convenience Initializers
    
    /// Create a new project with the specified parameters
    /// - Parameters:
    ///   - context: The managed object context
    ///   - name: The project name
    ///   - gameSystem: The game system
    ///   - army: The army name
    ///   - description: Optional project description
    /// - Returns: A new Project instance
    static func create(
        in context: NSManagedObjectContext,
        name: String,
        gameSystem: GameSystem,
        army: String,
        description: String? = nil
    ) -> Project {
        return create(
            in: context,
            name: name,
            gameSystemKey: gameSystem.rawValue,
            army: army,
            description: description
        )
    }

    /// Create with a raw game system key — supports both built-in raw values
    /// (e.g. "age_of_sigmar") and user-defined custom names ("Mordheim").
    static func create(
        in context: NSManagedObjectContext,
        name: String,
        gameSystemKey: String,
        army: String,
        description: String? = nil
    ) -> Project {
        let project = Project(context: context)
        project.id = UUID()
        project.name = name
        project.gameSystem = gameSystemKey
        project.army = army
        project.projectDescription = description
        project.createdAt = Date()
        project.updatedAt = Date()

        return project
    }
}

// MARK: - Fetch Requests

extension Project {
    
    /// Fetch request for projects by game system
    /// - Parameter gameSystem: The game system to filter by
    /// - Returns: A configured fetch request
    static func fetchRequest(for gameSystem: GameSystem) -> NSFetchRequest<Project> {
        let request: NSFetchRequest<Project> = Project.fetchRequest()
        request.predicate = NSPredicate(format: "gameSystem == %@", gameSystem.rawValue)
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \Project.army, ascending: true),
            NSSortDescriptor(keyPath: \Project.name, ascending: true)
        ]
        return request
    }
    
    /// Fetch request for projects sorted by game system and army
    /// - Returns: A configured fetch request
    static func fetchRequestSortedByGameSystemAndArmy() -> NSFetchRequest<Project> {
        let request: NSFetchRequest<Project> = Project.fetchRequest()
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \Project.gameSystem, ascending: true),
            NSSortDescriptor(keyPath: \Project.army, ascending: true),
            NSSortDescriptor(keyPath: \Project.name, ascending: true)
        ]
        return request
    }
}

// MARK: - Validation Errors

enum ValidationError: LocalizedError {
    case emptyRequiredField(String)
    case invalidEnumValue(String, String)
    case invalidRelationship(String)
    
    var errorDescription: String? {
        switch self {
        case .emptyRequiredField(let field):
            return "The \(field) field is required and cannot be empty"
        case .invalidEnumValue(let field, let value):
            return "Invalid value '\(value)' for field \(field)"
        case .invalidRelationship(let relationship):
            return "Invalid relationship: \(relationship)"
        }
    }
    
    var failureReason: String? {
        switch self {
        case .emptyRequiredField:
            return "Required field validation failed"
        case .invalidEnumValue:
            return "Enum value validation failed"
        case .invalidRelationship:
            return "Relationship validation failed"
        }
    }
    
    var recoverySuggestion: String? {
        switch self {
        case .emptyRequiredField:
            return "Please provide a valid value for the required field"
        case .invalidEnumValue:
            return "Please select a valid option from the available choices"
        case .invalidRelationship:
            return "Please ensure all relationships are properly configured"
        }
    }
}