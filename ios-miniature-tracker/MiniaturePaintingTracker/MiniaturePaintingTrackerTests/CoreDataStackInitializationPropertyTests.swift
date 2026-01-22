//
//  CoreDataStackInitializationPropertyTests.swift
//  MiniaturePaintingTrackerTests
//
//  Created by Kiro on 22/1/2026.
//

import XCTest
import CoreData
@testable import MiniaturePaintingTracker

/// Property-based tests for Core Data stack initialization
/// Feature: miniature-painting-tracker-ios, Property 14: App initialization data loading
/// Validates: Requirements 7.4
class CoreDataStackInitializationPropertyTests: XCTestCase {
    
    // MARK: - Test Properties
    
    private var testIterations: Int { 100 }
    
    // MARK: - Setup and Teardown
    
    override func setUpWithError() throws {
        try super.setUpWithError()
        // Reset any existing state before each test
        CoreDataManager.shared.resetCoreDataStack()
    }
    
    override func tearDownWithError() throws {
        // Clean up after each test
        CoreDataManager.shared.resetCoreDataStack()
        try super.tearDownWithError()
    }
    
    // MARK: - Property 14: App initialization data loading
    
    /// Property test: For any app launch, all data should be loaded from local Core Data storage and be immediately available
    /// This test validates that the Core Data stack initializes correctly and consistently across multiple iterations
    func testAppInitializationDataLoadingProperty() throws {
        // Property: Core Data stack should initialize successfully on every app launch simulation
        for iteration in 1...testIterations {
            // Simulate app launch by accessing CoreDataManager
            let manager = CoreDataManager.shared
            
            // Verify persistent container is properly initialized
            let container = manager.persistentContainer
            XCTAssertNotNil(container, "Iteration \(iteration): Persistent container should be initialized")
            XCTAssertEqual(container.name, "MiniaturePaintingTracker", "Iteration \(iteration): Container should have correct name")
            
            // Verify view context is available and properly configured
            let viewContext = container.viewContext
            XCTAssertNotNil(viewContext, "Iteration \(iteration): View context should be available")
            XCTAssertTrue(viewContext.automaticallyMergesChangesFromParent, "Iteration \(iteration): View context should auto-merge changes")
            
            // Verify Core Data service is initialized - wait for it to be available
            var service: CoreDataServiceProtocol?
            var attempts = 0
            let maxAttempts = 10
            
            while service == nil && attempts < maxAttempts {
                service = manager.coreDataService
                if service == nil {
                    Thread.sleep(forTimeInterval: 0.1) // Wait 100ms
                    attempts += 1
                }
            }
            
            XCTAssertNotNil(service, "Iteration \(iteration): Core Data service should be initialized within reasonable time")
            
            guard let coreDataService = service else {
                XCTFail("Iteration \(iteration): Could not get Core Data service")
                continue
            }
            
            XCTAssertTrue(coreDataService.viewContext === viewContext, "Iteration \(iteration): Service should use the same view context")
            
            // Verify data model entities are available
            let model = container.managedObjectModel
            let entityNames = model.entities.map { $0.name }.compactMap { $0 }
            let expectedEntities = ["Project", "Miniature", "Recipe", "Photo"]
            
            for expectedEntity in expectedEntities {
                XCTAssertTrue(entityNames.contains(expectedEntity), "Iteration \(iteration): Model should contain \(expectedEntity) entity")
            }
            
            // Verify that fetch requests can be executed immediately after initialization
            try validateImmediateDataAccess(context: viewContext, iteration: iteration)
            
            // Reset for next iteration to simulate fresh app launch
            if iteration < testIterations {
                manager.resetCoreDataStack()
            }
        }
    }
    
    /// Property test: Core Data stack should handle concurrent access during initialization
    func testConcurrentInitializationProperty() throws {
        let expectation = XCTestExpectation(description: "Concurrent initialization")
        expectation.expectedFulfillmentCount = 10
        
        let queue = DispatchQueue.global(qos: .userInitiated)
        
        // Simulate multiple concurrent access attempts during app launch
        for i in 1...10 {
            queue.async {
                // Each concurrent access should get the same singleton instance
                let manager = CoreDataManager.shared
                let container = manager.persistentContainer
                let service = manager.coreDataService
                
                // Verify initialization succeeded
                XCTAssertNotNil(container, "Concurrent access \(i): Container should be initialized")
                XCTAssertNotNil(service, "Concurrent access \(i): Service should be initialized")
                
                // Verify data access works
                let context = service!.viewContext
                XCTAssertNotNil(context, "Concurrent access \(i): Context should be available")
                
                expectation.fulfill()
            }
        }
        
        wait(for: [expectation], timeout: 10.0)
    }
    
    /// Property test: Directory structure should be created consistently
    func testDirectoryCreationProperty() throws {
        for iteration in 1...testIterations {
            let manager = CoreDataManager.shared
            
            // Verify documents directory is accessible
            let documentsDir = manager.documentsDirectory
            XCTAssertTrue(documentsDir.isFileURL, "Iteration \(iteration): Documents directory should be a file URL")
            XCTAssertTrue(FileManager.default.fileExists(atPath: documentsDir.path), "Iteration \(iteration): Documents directory should exist")
            
            // Verify photos directory is created
            let photosDir = manager.photosDirectory
            XCTAssertTrue(photosDir.isFileURL, "Iteration \(iteration): Photos directory should be a file URL")
            XCTAssertTrue(FileManager.default.fileExists(atPath: photosDir.path), "Iteration \(iteration): Photos directory should exist")
            XCTAssertTrue(photosDir.path.contains("Photos"), "Iteration \(iteration): Photos directory should contain 'Photos' in path")
            
            // Verify directory is writable
            let testFile = photosDir.appendingPathComponent("test_\(iteration).txt")
            let testData = "test".data(using: .utf8)!
            
            XCTAssertNoThrow(try testData.write(to: testFile), "Iteration \(iteration): Should be able to write to photos directory")
            XCTAssertTrue(FileManager.default.fileExists(atPath: testFile.path), "Iteration \(iteration): Test file should exist")
            
            // Clean up test file
            try? FileManager.default.removeItem(at: testFile)
            
            // Reset for next iteration
            if iteration < testIterations {
                manager.resetCoreDataStack()
            }
        }
    }
    
    /// Property test: Entity validation should work consistently
    func testEntityValidationProperty() throws {
        for iteration in 1...testIterations {
            let manager = CoreDataManager.shared
            let context = manager.coreDataService.viewContext
            
            // Test Project entity validation
            try validateProjectEntityConsistency(context: context, iteration: iteration)
            
            // Test Miniature entity validation
            try validateMiniatureEntityConsistency(context: context, iteration: iteration)
            
            // Test Recipe entity validation
            try validateRecipeEntityConsistency(context: context, iteration: iteration)
            
            // Test Photo entity validation
            try validatePhotoEntityConsistency(context: context, iteration: iteration)
            
            // Reset context for next iteration
            context.reset()
        }
    }
    
    // MARK: - Helper Methods
    
    private func validateImmediateDataAccess(context: NSManagedObjectContext, iteration: Int) throws {
        // Test that fetch requests work immediately after initialization
        let projectRequest = Project.fetchRequest()
        let projects = try context.fetch(projectRequest)
        XCTAssertNotNil(projects, "Iteration \(iteration): Should be able to fetch projects immediately")
        
        let miniatureRequest = Miniature.fetchRequest()
        let miniatures = try context.fetch(miniatureRequest)
        XCTAssertNotNil(miniatures, "Iteration \(iteration): Should be able to fetch miniatures immediately")
        
        let recipeRequest = Recipe.fetchRequest()
        let recipes = try context.fetch(recipeRequest)
        XCTAssertNotNil(recipes, "Iteration \(iteration): Should be able to fetch recipes immediately")
        
        let photoRequest = Photo.fetchRequest()
        let photos = try context.fetch(photoRequest)
        XCTAssertNotNil(photos, "Iteration \(iteration): Should be able to fetch photos immediately")
    }
    
    private func validateProjectEntityConsistency(context: NSManagedObjectContext, iteration: Int) throws {
        // Create a test project
        let project = Project.create(
            in: context,
            name: "Test Project \(iteration)",
            gameSystem: .ageOfSigmar,
            army: "Test Army"
        )
        
        // Validate enum conversion works
        XCTAssertEqual(project.gameSystemEnum, .ageOfSigmar, "Iteration \(iteration): Game system enum should be set correctly")
        XCTAssertEqual(project.gameSystem, "age_of_sigmar", "Iteration \(iteration): Game system raw value should be correct")
        
        // Validate validation works
        XCTAssertNoThrow(try project.validate(), "Iteration \(iteration): Valid project should pass validation")
        
        // Test invalid project
        project.name = ""
        XCTAssertThrowsError(try project.validate(), "Iteration \(iteration): Invalid project should fail validation")
    }
    
    private func validateMiniatureEntityConsistency(context: NSManagedObjectContext, iteration: Int) throws {
        // Create a test project first
        let project = Project.create(
            in: context,
            name: "Test Project",
            gameSystem: .warhammer40k,
            army: "Test Army"
        )
        
        // Create a test miniature
        let miniature = Miniature.create(
            in: context,
            name: "Test Miniature \(iteration)",
            type: .character,
            project: project
        )
        
        // Validate enum conversions work
        XCTAssertEqual(miniature.miniatureTypeEnum, .character, "Iteration \(iteration): Miniature type enum should be set correctly")
        XCTAssertEqual(miniature.progressStatusEnum, .unpainted, "Iteration \(iteration): Progress status should default to unpainted")
        
        // Validate validation works
        XCTAssertNoThrow(try miniature.validate(), "Iteration \(iteration): Valid miniature should pass validation")
        
        // Test progress update
        miniature.updateProgress(to: .primed)
        XCTAssertEqual(miniature.progressStatusEnum, .primed, "Iteration \(iteration): Progress should update correctly")
    }
    
    private func validateRecipeEntityConsistency(context: NSManagedObjectContext, iteration: Int) throws {
        // Create a test recipe
        let recipe = Recipe.create(
            in: context,
            name: "Test Recipe \(iteration)",
            type: .troop,
            steps: ["Step 1", "Step 2"],
            paints: ["Paint 1", "Paint 2"],
            techniques: ["Technique 1"]
        )
        
        // Validate enum conversion works
        XCTAssertEqual(recipe.miniatureTypeEnum, .troop, "Iteration \(iteration): Recipe type enum should be set correctly")
        
        // Validate JSON encoding/decoding works
        XCTAssertEqual(recipe.steps.count, 2, "Iteration \(iteration): Steps should be encoded/decoded correctly")
        XCTAssertEqual(recipe.paintsUsed.count, 2, "Iteration \(iteration): Paints should be encoded/decoded correctly")
        XCTAssertEqual(recipe.techniques.count, 1, "Iteration \(iteration): Techniques should be encoded/decoded correctly")
        
        // Validate validation works
        XCTAssertNoThrow(try recipe.validate(), "Iteration \(iteration): Valid recipe should pass validation")
    }
    
    private func validatePhotoEntityConsistency(context: NSManagedObjectContext, iteration: Int) throws {
        // Create test project and miniature first
        let project = Project.create(
            in: context,
            name: "Test Project",
            gameSystem: .horusHeresy,
            army: "Test Army"
        )
        
        let miniature = Miniature.create(
            in: context,
            name: "Test Miniature",
            type: .troop,
            project: project
        )
        
        // Create a test photo
        let photo = Photo.create(
            in: context,
            filename: "test_photo_\(iteration).jpg",
            filePath: "Photos/test_photo_\(iteration).jpg",
            fileSize: 1024,
            mimeType: "image/jpeg",
            miniature: miniature
        )
        
        // Validate computed properties work
        XCTAssertTrue(photo.fileURL.path.contains("test_photo_\(iteration).jpg"), "Iteration \(iteration): File URL should be computed correctly")
        XCTAssertEqual(photo.imageFormat, .jpeg, "Iteration \(iteration): Image format should be detected correctly")
        
        // Validate validation works
        XCTAssertNoThrow(try photo.validate(), "Iteration \(iteration): Valid photo should pass validation")
    }
}