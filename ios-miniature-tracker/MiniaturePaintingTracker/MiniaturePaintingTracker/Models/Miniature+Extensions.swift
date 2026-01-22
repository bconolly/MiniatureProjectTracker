//
//  Miniature+Extensions.swift
//  MiniaturePaintingTracker
//
//  Created by Kiro on 22/1/2026.
//

import Foundation
import CoreData

// MARK: - Miniature Entity Extensions

extension Miniature {
    
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
    
    /// Progress status as an enum value
    var progressStatusEnum: ProgressStatus {
        get {
            return ProgressStatus(rawValue: progressStatus ?? "") ?? .unpainted
        }
        set {
            progressStatus = newValue.rawValue
            updatedAt = Date()
        }
    }
    
    /// Array of photos sorted by creation date (chronological order)
    var photosArray: [Photo] {
        let set = photos as? Set<Photo> ?? []
        return set.sorted { ($0.createdAt ?? Date.distantPast) < ($1.createdAt ?? Date.distantPast) }
    }
    
    /// Count of photos associated with this miniature
    var photoCount: Int {
        return photos?.count ?? 0
    }
    
    /// Most recent photo for thumbnail display
    var latestPhoto: Photo? {
        return photosArray.last
    }
    
    /// Display name combining miniature type and name
    var displayName: String {
        return "\(miniatureTypeEnum.displayName): \(name ?? "Unknown")"
    }
    
    // MARK: - Validation
    
    /// Validate the miniature data
    /// - Throws: ValidationError if validation fails
    func validate() throws {
        guard let name = name, !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw ValidationError.emptyRequiredField("name")
        }
        
        guard let miniatureType = miniatureType, MiniatureType(rawValue: miniatureType) != nil else {
            throw ValidationError.invalidEnumValue("miniatureType", miniatureType ?? "nil")
        }
        
        guard let progressStatus = progressStatus, ProgressStatus(rawValue: progressStatus) != nil else {
            throw ValidationError.invalidEnumValue("progressStatus", progressStatus ?? "nil")
        }
        
        guard project != nil else {
            throw ValidationError.invalidRelationship("project")
        }
    }
    
    // MARK: - Progress Management
    
    /// Update the progress status and timestamp
    /// - Parameter newStatus: The new progress status
    func updateProgress(to newStatus: ProgressStatus) {
        progressStatusEnum = newStatus
        updatedAt = Date()
    }
    
    /// Check if the miniature is completed
    var isCompleted: Bool {
        return progressStatusEnum == .completed
    }
    
    /// Get the next logical progress status
    var nextProgressStatus: ProgressStatus? {
        let allStatuses = ProgressStatus.allCases
        guard let currentIndex = allStatuses.firstIndex(of: progressStatusEnum),
              currentIndex < allStatuses.count - 1 else {
            return nil
        }
        return allStatuses[currentIndex + 1]
    }
    
    /// Get the previous progress status
    var previousProgressStatus: ProgressStatus? {
        let allStatuses = ProgressStatus.allCases
        guard let currentIndex = allStatuses.firstIndex(of: progressStatusEnum),
              currentIndex > 0 else {
            return nil
        }
        return allStatuses[currentIndex - 1]
    }
    
    // MARK: - Convenience Initializers
    
    /// Create a new miniature with the specified parameters
    /// - Parameters:
    ///   - context: The managed object context
    ///   - name: The miniature name
    ///   - type: The miniature type
    ///   - project: The parent project
    ///   - notes: Optional notes
    /// - Returns: A new Miniature instance
    static func create(
        in context: NSManagedObjectContext,
        name: String,
        type: MiniatureType,
        project: Project,
        notes: String? = nil
    ) -> Miniature {
        let miniature = Miniature(context: context)
        miniature.id = UUID()
        miniature.name = name
        miniature.miniatureTypeEnum = type
        miniature.progressStatusEnum = .unpainted
        miniature.notes = notes
        miniature.createdAt = Date()
        miniature.updatedAt = Date()
        miniature.project = project
        
        return miniature
    }
}

// MARK: - Fetch Requests

extension Miniature {
    
    /// Fetch request for miniatures by project
    /// - Parameter project: The project to filter by
    /// - Returns: A configured fetch request
    static func fetchRequest(for project: Project) -> NSFetchRequest<Miniature> {
        let request: NSFetchRequest<Miniature> = Miniature.fetchRequest()
        request.predicate = NSPredicate(format: "project == %@", project)
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \Miniature.createdAt, ascending: true)
        ]
        return request
    }
    
    /// Fetch request for miniatures by type
    /// - Parameter type: The miniature type to filter by
    /// - Returns: A configured fetch request
    static func fetchRequest(for type: MiniatureType) -> NSFetchRequest<Miniature> {
        let request: NSFetchRequest<Miniature> = Miniature.fetchRequest()
        request.predicate = NSPredicate(format: "miniatureType == %@", type.rawValue)
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \Miniature.name, ascending: true)
        ]
        return request
    }
    
    /// Fetch request for miniatures by progress status
    /// - Parameter status: The progress status to filter by
    /// - Returns: A configured fetch request
    static func fetchRequest(for status: ProgressStatus) -> NSFetchRequest<Miniature> {
        let request: NSFetchRequest<Miniature> = Miniature.fetchRequest()
        request.predicate = NSPredicate(format: "progressStatus == %@", status.rawValue)
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \Miniature.updatedAt, ascending: false)
        ]
        return request
    }
    
    /// Fetch request for completed miniatures
    /// - Returns: A configured fetch request
    static func fetchRequestForCompleted() -> NSFetchRequest<Miniature> {
        return fetchRequest(for: .completed)
    }
    
    /// Fetch request for miniatures in progress (not unpainted or completed)
    /// - Returns: A configured fetch request
    static func fetchRequestForInProgress() -> NSFetchRequest<Miniature> {
        let request: NSFetchRequest<Miniature> = Miniature.fetchRequest()
        request.predicate = NSPredicate(
            format: "progressStatus != %@ AND progressStatus != %@",
            ProgressStatus.unpainted.rawValue,
            ProgressStatus.completed.rawValue
        )
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \Miniature.updatedAt, ascending: false)
        ]
        return request
    }
}