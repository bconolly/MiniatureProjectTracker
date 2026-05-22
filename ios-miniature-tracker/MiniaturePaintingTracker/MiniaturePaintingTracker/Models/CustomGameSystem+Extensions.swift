//
//  CustomGameSystem+Extensions.swift
//  MiniaturePaintingTracker
//

import Foundation
import CoreData

extension CustomGameSystem {

    // MARK: - Computed Properties

    /// Display name (the user-entered name, with whitespace trimmed for safety).
    var displayName: String {
        return (name ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
    }

    /// Storage key used on Project.gameSystem — same as the display name
    /// (custom systems have no separate raw form).
    var storageKey: String { displayName }

    // MARK: - Factory

    /// Create a new custom game system. Caller must save the context.
    /// Returns nil when the trimmed name is empty.
    @discardableResult
    static func create(
        in context: NSManagedObjectContext,
        name: String
    ) -> CustomGameSystem? {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        let entity = CustomGameSystem(context: context)
        entity.id = UUID()
        entity.name = trimmed
        entity.createdAt = Date()
        return entity
    }

    // MARK: - Fetch Requests

    /// All custom game systems, sorted alphabetically by name.
    static func fetchRequestAllSorted() -> NSFetchRequest<CustomGameSystem> {
        let request: NSFetchRequest<CustomGameSystem> = CustomGameSystem.fetchRequest()
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \CustomGameSystem.name, ascending: true)
        ]
        return request
    }

    /// Returns true if a custom system with this (case-insensitive, trimmed) name already exists.
    static func nameExists(_ candidate: String, in context: NSManagedObjectContext) -> Bool {
        let trimmed = candidate.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return false }
        // Conflict with built-ins?
        let builtInMatch = GameSystem.allCases.contains { builtin in
            builtin.displayName.compare(trimmed, options: .caseInsensitive) == .orderedSame ||
            builtin.rawValue.compare(trimmed, options: .caseInsensitive) == .orderedSame
        }
        if builtInMatch { return true }
        // Conflict with another custom row?
        let request: NSFetchRequest<CustomGameSystem> = CustomGameSystem.fetchRequest()
        request.predicate = NSPredicate(format: "name ==[c] %@", trimmed)
        request.fetchLimit = 1
        let count = (try? context.count(for: request)) ?? 0
        return count > 0
    }
}
