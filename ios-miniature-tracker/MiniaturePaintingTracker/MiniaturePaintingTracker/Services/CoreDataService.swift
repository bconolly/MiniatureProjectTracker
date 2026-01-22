//
//  CoreDataService.swift
//  MiniaturePaintingTracker
//
//  Created by Kiro on 22/1/2026.
//

import Foundation
import CoreData
import os.log

/// Core Data service implementation providing CRUD operations and background context support
class CoreDataService: CoreDataServiceProtocol {
    
    // MARK: - Properties
    
    private let persistentContainer: NSPersistentContainer
    private let logger = Logger(subsystem: "com.miniaturetracker.app", category: "CoreDataService")
    
    /// Main managed object context for UI operations
    var viewContext: NSManagedObjectContext {
        return persistentContainer.viewContext
    }
    
    // MARK: - Initialization
    
    /// Initialize the Core Data service with a persistent container
    /// - Parameter persistentContainer: The NSPersistentContainer to use for Core Data operations
    init(persistentContainer: NSPersistentContainer) {
        self.persistentContainer = persistentContainer
        
        // Configure the view context for UI operations
        viewContext.automaticallyMergesChangesFromParent = true
        viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
    }
    
    // MARK: - CoreDataServiceProtocol Implementation
    
    /// Save changes to the main managed object context
    /// - Throws: CoreDataError.saveFailed if the save operation fails
    func save() throws {
        guard viewContext.hasChanges else {
            logger.debug("No changes to save in view context")
            return
        }
        
        do {
            try viewContext.save()
            logger.debug("Successfully saved changes to view context")
        } catch {
            logger.error("Failed to save view context: \(error.localizedDescription)")
            throw CoreDataError.saveFailed(error)
        }
    }
    
    /// Fetch objects using a fetch request
    /// - Parameter request: The fetch request to execute
    /// - Returns: Array of fetched objects
    /// - Throws: CoreDataError.fetchFailed if the fetch operation fails
    func fetch<T: NSManagedObject>(_ request: NSFetchRequest<T>) throws -> [T] {
        do {
            let results = try viewContext.fetch(request)
            logger.debug("Successfully fetched \(results.count) objects of type \(T.self)")
            return results
        } catch {
            logger.error("Failed to fetch objects of type \(T.self): \(error.localizedDescription)")
            throw CoreDataError.fetchFailed(error)
        }
    }
    
    /// Delete an object from the managed object context
    /// - Parameter object: The object to delete
    /// - Throws: CoreDataError.deleteFailed if the delete operation fails
    func delete(_ object: NSManagedObject) throws {
        do {
            viewContext.delete(object)
            try save()
            logger.debug("Successfully deleted object: \(object)")
        } catch {
            logger.error("Failed to delete object \(object): \(error.localizedDescription)")
            throw CoreDataError.deleteFailed(error)
        }
    }
    
    /// Perform a task on a background context
    /// - Parameter block: The block to execute on the background context
    func performBackgroundTask(_ block: @escaping (NSManagedObjectContext) -> Void) {
        persistentContainer.performBackgroundTask { backgroundContext in
            // Configure background context
            backgroundContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
            
            self.logger.debug("Performing background task")
            block(backgroundContext)
        }
    }
    
    // MARK: - Additional Helper Methods
    
    /// Save changes in a background context
    /// - Parameter context: The background context to save
    /// - Throws: CoreDataError.saveFailed if the save operation fails
    func saveBackgroundContext(_ context: NSManagedObjectContext) throws {
        guard context.hasChanges else {
            logger.debug("No changes to save in background context")
            return
        }
        
        do {
            try context.save()
            logger.debug("Successfully saved changes to background context")
        } catch {
            logger.error("Failed to save background context: \(error.localizedDescription)")
            throw CoreDataError.saveFailed(error)
        }
    }
    
    /// Create a new background context for batch operations
    /// - Returns: A new background managed object context
    func newBackgroundContext() -> NSManagedObjectContext {
        let context = persistentContainer.newBackgroundContext()
        context.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        return context
    }
    
    /// Reset the view context to discard unsaved changes
    func resetViewContext() {
        viewContext.reset()
        logger.debug("Reset view context")
    }
}

// MARK: - Core Data Errors

/// Enumeration of Core Data service errors
enum CoreDataError: LocalizedError {
    case saveFailed(Error)
    case fetchFailed(Error)
    case deleteFailed(Error)
    case contextNotFound
    case invalidEntity
    case initializationFailed(Error)
    
    var errorDescription: String? {
        switch self {
        case .saveFailed(let error):
            return "Failed to save data: \(error.localizedDescription)"
        case .fetchFailed(let error):
            return "Failed to fetch data: \(error.localizedDescription)"
        case .deleteFailed(let error):
            return "Failed to delete data: \(error.localizedDescription)"
        case .contextNotFound:
            return "Managed object context not found"
        case .invalidEntity:
            return "Invalid entity configuration"
        case .initializationFailed(let error):
            return "Failed to initialize Core Data stack: \(error.localizedDescription)"
        }
    }
    
    var failureReason: String? {
        switch self {
        case .saveFailed:
            return "The data could not be saved to the persistent store"
        case .fetchFailed:
            return "The requested data could not be retrieved"
        case .deleteFailed:
            return "The data could not be deleted from the persistent store"
        case .contextNotFound:
            return "No managed object context is available"
        case .invalidEntity:
            return "The entity configuration is invalid or missing"
        case .initializationFailed:
            return "The Core Data stack could not be initialized"
        }
    }
    
    var recoverySuggestion: String? {
        switch self {
        case .saveFailed, .deleteFailed:
            return "Check that the data is valid and try again. If the problem persists, restart the app."
        case .fetchFailed:
            return "Check your network connection and try again."
        case .contextNotFound:
            return "Restart the app to reinitialize the data store."
        case .invalidEntity:
            return "Update the app to the latest version."
        case .initializationFailed:
            return "Restart the app. If the problem persists, reinstall the app."
        }
    }
}