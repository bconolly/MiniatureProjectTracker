//
//  CoreDataManager.swift
//  MiniaturePaintingTracker
//
//  Created by Kiro on 22/1/2026.
//

import Foundation
import CoreData
import os.log

/// Manager class for Core Data stack and service initialization
class CoreDataManager {
    
    // MARK: - Singleton
    
    static let shared = CoreDataManager()
    
    // MARK: - Properties
    
    private let logger = Logger(subsystem: "com.miniaturetracker.app", category: "CoreDataManager")
    
    /// The Core Data service instance
    private(set) var coreDataService: CoreDataServiceProtocol!
    
    /// The persistent container for the application
    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "MiniaturePaintingTracker")
        
        // Configure the persistent store
        let storeDescription = container.persistentStoreDescriptions.first
        storeDescription?.shouldInferMappingModelAutomatically = true
        storeDescription?.shouldMigrateStoreAutomatically = true
        
        // For testing, use in-memory store if needed
        if ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil {
            storeDescription?.type = NSInMemoryStoreType
        }
        
        var loadError: Error?
        container.loadPersistentStores { [weak self] (storeDescription, error) in
            if let error = error as NSError? {
                self?.logger.error("Core Data failed to load store: \(error), \(error.userInfo)")
                loadError = error
            } else {
                self?.logger.info("Core Data store loaded successfully: \(storeDescription.url?.absoluteString ?? "unknown")")
            }
        }
        
        // If there was a load error, throw it instead of using fatalError
        if let error = loadError {
            logger.error("Core Data initialization failed: \(error)")
            // For testing, we'll create a fallback in-memory store
            if ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil {
                let fallbackContainer = NSPersistentContainer(name: "MiniaturePaintingTracker")
                let fallbackDescription = fallbackContainer.persistentStoreDescriptions.first
                fallbackDescription?.type = NSInMemoryStoreType
                
                fallbackContainer.loadPersistentStores { _, _ in }
                fallbackContainer.viewContext.automaticallyMergesChangesFromParent = true
                fallbackContainer.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
                return fallbackContainer
            }
        }
        
        // Configure the view context
        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        
        return container
    }()
    
    // MARK: - Initialization
    
    private init() {
        // Initialize the Core Data service after the persistent container is set up
        setupCoreDataService()
    }
    
    // MARK: - Setup
    
    private func setupCoreDataService() {
        // Ensure the persistent container is loaded
        _ = persistentContainer
        
        // Initialize the Core Data service
        coreDataService = CoreDataService(persistentContainer: persistentContainer)
        logger.info("Core Data service initialized successfully")
    }
    
    // MARK: - Public Methods
    
    /// Save the Core Data context
    /// This method should be called when the app enters the background
    func saveContext() {
        do {
            try coreDataService.save()
            logger.debug("Context saved successfully")
        } catch {
            logger.error("Failed to save context: \(error.localizedDescription)")
        }
    }
    
    /// Reset the Core Data stack (useful for testing)
    func resetCoreDataStack() {
        logger.warning("Resetting Core Data stack")
        
        // Reset the view context
        if let service = coreDataService as? CoreDataService {
            service.resetViewContext()
        }
        
        // For testing, we need to properly reset the lazy property
        if ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil {
            // Clear any existing data in the context
            persistentContainer.viewContext.reset()
            
            // Delete all objects from the in-memory store
            let entities = persistentContainer.managedObjectModel.entities
            for entity in entities {
                if let entityName = entity.name {
                    let fetchRequest = NSFetchRequest<NSManagedObject>(entityName: entityName)
                    do {
                        let objects = try persistentContainer.viewContext.fetch(fetchRequest)
                        for object in objects {
                            persistentContainer.viewContext.delete(object)
                        }
                        try persistentContainer.viewContext.save()
                    } catch {
                        logger.error("Failed to clear entity \(entityName): \(error)")
                    }
                }
            }
        }
        
        // Reinitialize the service
        setupCoreDataService()
    }
    
    /// Get the documents directory URL for file storage
    var documentsDirectory: URL {
        let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        return paths[0]
    }
    
    /// Get the photos directory URL for photo storage
    var photosDirectory: URL {
        let photosDir = documentsDirectory.appendingPathComponent("Photos")
        
        // Create the directory if it doesn't exist
        if !FileManager.default.fileExists(atPath: photosDir.path) {
            do {
                try FileManager.default.createDirectory(at: photosDir, withIntermediateDirectories: true, attributes: nil)
                logger.debug("Created photos directory at: \(photosDir.path)")
            } catch {
                logger.error("Failed to create photos directory: \(error.localizedDescription)")
            }
        }
        
        return photosDir
    }
}

// MARK: - App Lifecycle Support

extension CoreDataManager {
    
    /// Handle app entering background
    func applicationDidEnterBackground() {
        saveContext()
    }
    
    /// Handle app termination
    func applicationWillTerminate() {
        saveContext()
    }
}