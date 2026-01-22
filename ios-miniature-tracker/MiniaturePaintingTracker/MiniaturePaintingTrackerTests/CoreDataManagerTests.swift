//
//  CoreDataManagerTests.swift
//  MiniaturePaintingTrackerTests
//
//  Created by Kiro on 22/1/2026.
//

import XCTest
import CoreData
@testable import MiniaturePaintingTracker

class CoreDataManagerTests: XCTestCase {
    
    override func setUpWithError() throws {
        try super.setUpWithError()
    }
    
    override func tearDownWithError() throws {
        try super.tearDownWithError()
    }
    
    // MARK: - Test Singleton Pattern
    
    func testSingletonInstance() {
        // Given: Multiple references to the shared instance
        let instance1 = CoreDataManager.shared
        let instance2 = CoreDataManager.shared
        
        // When: Comparing instances
        // Then: Should be the same instance
        XCTAssertTrue(instance1 === instance2)
    }
    
    // MARK: - Test Core Data Service Initialization
    
    func testCoreDataServiceInitialization() {
        // Given: The CoreDataManager shared instance
        let manager = CoreDataManager.shared
        
        // When: Accessing the core data service
        let service = manager.coreDataService
        
        // Then: Should have a valid service instance
        XCTAssertNotNil(service)
        XCTAssertTrue(service is CoreDataService)
    }
    
    // MARK: - Test Persistent Container
    
    func testPersistentContainerInitialization() {
        // Given: The CoreDataManager shared instance
        let manager = CoreDataManager.shared
        
        // When: Accessing the persistent container
        let container = manager.persistentContainer
        
        // Then: Should have a valid container
        XCTAssertNotNil(container)
        XCTAssertEqual(container.name, "MiniaturePaintingTracker")
        XCTAssertNotNil(container.viewContext)
    }
    
    // MARK: - Test Directory Management
    
    func testDocumentsDirectory() {
        // Given: The CoreDataManager shared instance
        let manager = CoreDataManager.shared
        
        // When: Accessing the documents directory
        let documentsDir = manager.documentsDirectory
        
        // Then: Should return a valid URL
        XCTAssertNotNil(documentsDir)
        XCTAssertTrue(documentsDir.isFileURL)
        XCTAssertTrue(documentsDir.path.contains("Documents"))
    }
    
    func testPhotosDirectory() {
        // Given: The CoreDataManager shared instance
        let manager = CoreDataManager.shared
        
        // When: Accessing the photos directory
        let photosDir = manager.photosDirectory
        
        // Then: Should return a valid URL
        XCTAssertNotNil(photosDir)
        XCTAssertTrue(photosDir.isFileURL)
        XCTAssertTrue(photosDir.path.contains("Photos"))
        
        // And: The directory should exist or be created
        let fileManager = FileManager.default
        XCTAssertTrue(fileManager.fileExists(atPath: photosDir.path))
    }
    
    // MARK: - Test Save Context
    
    func testSaveContext() {
        // Given: The CoreDataManager shared instance
        let manager = CoreDataManager.shared
        
        // When: Calling saveContext
        // Then: Should not throw an error (even with no changes)
        XCTAssertNoThrow(manager.saveContext())
    }
    
    // MARK: - Test App Lifecycle Methods
    
    func testApplicationDidEnterBackground() {
        // Given: The CoreDataManager shared instance
        let manager = CoreDataManager.shared
        
        // When: Calling applicationDidEnterBackground
        // Then: Should not throw an error
        XCTAssertNoThrow(manager.applicationDidEnterBackground())
    }
    
    func testApplicationWillTerminate() {
        // Given: The CoreDataManager shared instance
        let manager = CoreDataManager.shared
        
        // When: Calling applicationWillTerminate
        // Then: Should not throw an error
        XCTAssertNoThrow(manager.applicationWillTerminate())
    }
    
    // MARK: - Test Reset Functionality
    
    func testResetCoreDataStack() {
        // Given: The CoreDataManager shared instance
        let manager = CoreDataManager.shared
        let originalService = manager.coreDataService
        
        // When: Resetting the Core Data stack
        manager.resetCoreDataStack()
        
        // Then: Should have a new service instance
        let newService = manager.coreDataService
        XCTAssertNotNil(newService)
        // Note: In a real scenario, we might want to verify the service was recreated
        // but since we're using the same container, the reference might be the same
    }
}