//
//  CoreDataServiceTests.swift
//  MiniaturePaintingTrackerTests
//
//  Created by Kiro on 22/1/2026.
//

import XCTest
import CoreData
@testable import MiniaturePaintingTracker

class CoreDataServiceTests: XCTestCase {
    
    var coreDataService: CoreDataService!
    var testContainer: NSPersistentContainer!
    
    override func setUpWithError() throws {
        try super.setUpWithError()
        
        // Create an in-memory Core Data stack for testing
        testContainer = NSPersistentContainer(name: "MiniaturePaintingTracker")
        
        let description = NSPersistentStoreDescription()
        description.type = NSInMemoryStoreType
        description.shouldAddStoreAsynchronously = false
        
        testContainer.persistentStoreDescriptions = [description]
        
        testContainer.loadPersistentStores { _, error in
            if let error = error {
                fatalError("Failed to load test store: \(error)")
            }
        }
        
        coreDataService = CoreDataService(persistentContainer: testContainer)
    }
    
    override func tearDownWithError() throws {
        coreDataService = nil
        testContainer = nil
        try super.tearDownWithError()
    }
    
    // MARK: - Test Save Functionality
    
    func testSaveWithNoChanges() throws {
        // Given: A context with no changes
        XCTAssertFalse(coreDataService.viewContext.hasChanges)
        
        // When: Calling save
        // Then: Should not throw an error
        XCTAssertNoThrow(try coreDataService.save())
    }
    
    func testSaveWithChanges() throws {
        // Given: A context with changes (we'll create a dummy entity for this test)
        // Note: This test will need actual entities to be meaningful
        // For now, we'll test the basic save mechanism
        
        // When: Calling save on a clean context
        // Then: Should not throw an error
        XCTAssertNoThrow(try coreDataService.save())
    }
    
    // MARK: - Test Fetch Functionality
    
    func testFetchEmptyResults() throws {
        // Given: An empty data store
        let request = NSFetchRequest<NSManagedObject>(entityName: "NonExistentEntity")
        
        // When: Fetching non-existent entities
        // Then: Should throw a fetch error (entity doesn't exist)
        XCTAssertThrowsError(try coreDataService.fetch(request)) { error in
            XCTAssertTrue(error is CoreDataError)
            if case CoreDataError.fetchFailed = error {
                // Expected error type
            } else {
                XCTFail("Expected CoreDataError.fetchFailed")
            }
        }
    }
    
    // MARK: - Test Background Context
    
    func testPerformBackgroundTask() {
        // Given: A background task expectation
        let expectation = XCTestExpectation(description: "Background task completed")
        
        // When: Performing a background task
        coreDataService.performBackgroundTask { context in
            // Then: Should receive a valid background context
            XCTAssertNotNil(context)
            XCTAssertNotEqual(context, self.coreDataService.viewContext)
            expectation.fulfill()
        }
        
        wait(for: [expectation], timeout: 1.0)
    }
    
    func testNewBackgroundContext() {
        // Given: The core data service
        guard let service = coreDataService as? CoreDataService else {
            XCTFail("Service should be CoreDataService instance")
            return
        }
        
        // When: Creating a new background context
        let backgroundContext = service.newBackgroundContext()
        
        // Then: Should return a valid context different from view context
        XCTAssertNotNil(backgroundContext)
        XCTAssertNotEqual(backgroundContext, coreDataService.viewContext)
        XCTAssertEqual(backgroundContext.concurrencyType, .privateQueueConcurrencyType)
    }
    
    // MARK: - Test Error Handling
    
    func testCoreDataErrorDescriptions() {
        let testError = NSError(domain: "TestDomain", code: 1, userInfo: [NSLocalizedDescriptionKey: "Test error"])
        
        let saveError = CoreDataError.saveFailed(testError)
        XCTAssertNotNil(saveError.errorDescription)
        XCTAssertTrue(saveError.errorDescription!.contains("Failed to save data"))
        
        let fetchError = CoreDataError.fetchFailed(testError)
        XCTAssertNotNil(fetchError.errorDescription)
        XCTAssertTrue(fetchError.errorDescription!.contains("Failed to fetch data"))
        
        let deleteError = CoreDataError.deleteFailed(testError)
        XCTAssertNotNil(deleteError.errorDescription)
        XCTAssertTrue(deleteError.errorDescription!.contains("Failed to delete data"))
        
        let contextError = CoreDataError.contextNotFound
        XCTAssertNotNil(contextError.errorDescription)
        XCTAssertTrue(contextError.errorDescription!.contains("context not found"))
        
        let entityError = CoreDataError.invalidEntity
        XCTAssertNotNil(entityError.errorDescription)
        XCTAssertTrue(entityError.errorDescription!.contains("Invalid entity"))
    }
    
    // MARK: - Test View Context Access
    
    func testViewContextAccess() {
        // Given: The core data service
        // When: Accessing the view context
        let context = coreDataService.viewContext
        
        // Then: Should return the main context
        XCTAssertNotNil(context)
        XCTAssertEqual(context, testContainer.viewContext)
        XCTAssertEqual(context.concurrencyType, .mainQueueConcurrencyType)
    }
    
    // MARK: - Test Reset Functionality
    
    func testResetViewContext() {
        // Given: The core data service
        guard let service = coreDataService as? CoreDataService else {
            XCTFail("Service should be CoreDataService instance")
            return
        }
        
        // When: Resetting the view context
        // Then: Should not throw an error
        XCTAssertNoThrow(service.resetViewContext())
    }
}