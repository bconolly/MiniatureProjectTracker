//
//  PhotoServiceTests.swift
//  MiniaturePaintingTrackerTests
//
//  Created by Kiro on 22/1/2026.
//

import XCTest
import UIKit
@testable import MiniaturePaintingTracker

class PhotoServiceTests: XCTestCase {
    
    var photoService: PhotoService!
    var testMiniatureId: UUID!
    
    override func setUpWithError() throws {
        try super.setUpWithError()
        photoService = PhotoService()
        testMiniatureId = UUID()
    }
    
    override func tearDownWithError() throws {
        // Clean up any test files
        cleanupTestFiles()
        photoService = nil
        testMiniatureId = nil
        try super.tearDownWithError()
    }
    
    // MARK: - Test Photo Directory Management
    
    func testGetPhotosDirectory() {
        // When: Getting photos directory
        let photosDirectory = photoService.getPhotosDirectory()
        
        // Then: Directory should be in documents directory
        let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let expectedDirectory = documentsDirectory.appendingPathComponent("Photos")
        
        XCTAssertEqual(photosDirectory, expectedDirectory)
    }
    
    func testPhotosDirectoryCreation() {
        // Given: Photos directory might not exist
        let photosDirectory = photoService.getPhotosDirectory()
        
        // When: PhotoService is initialized (directory should be created)
        // Then: Directory should exist
        XCTAssertTrue(FileManager.default.fileExists(atPath: photosDirectory.path))
    }
    
    // MARK: - Test Filename Generation
    
    func testGenerateUniqueFilename() {
        // When: Generating unique filenames
        let filename1 = photoService.generateUniqueFilename(for: testMiniatureId, format: .jpeg)
        let filename2 = photoService.generateUniqueFilename(for: testMiniatureId, format: .png)
        let filename3 = photoService.generateUniqueFilename(for: testMiniatureId, format: .jpeg)
        
        // Then: Filenames should be unique and have correct format
        XCTAssertNotEqual(filename1, filename2)
        XCTAssertNotEqual(filename1, filename3)
        XCTAssertNotEqual(filename2, filename3)
        
        XCTAssertTrue(filename1.hasSuffix(".jpg"))
        XCTAssertTrue(filename2.hasSuffix(".png"))
        XCTAssertTrue(filename3.hasSuffix(".jpg"))
        
        // Should contain miniature ID prefix
        let miniaturePrefix = testMiniatureId.uuidString.prefix(8)
        XCTAssertTrue(filename1.hasPrefix(String(miniaturePrefix)))
        XCTAssertTrue(filename2.hasPrefix(String(miniaturePrefix)))
        XCTAssertTrue(filename3.hasPrefix(String(miniaturePrefix)))
    }
    
    // MARK: - Test Image Format Validation
    
    func testValidateImageFormat() {
        // Given: Valid test images
        let validImage = createTestImage()
        
        // When: Validating image format
        let isValid = photoService.validateImageFormat(validImage)
        
        // Then: Should be valid
        XCTAssertTrue(isValid)
    }
    
    // MARK: - Test Photo Save, Load, Delete Cycle
    
    func testSaveLoadDeletePhoto() throws {
        // Given: A test image
        let testImage = createTestImage()
        
        // When: Saving the photo
        let metadata = try photoService.savePhoto(testImage, for: testMiniatureId)
        
        // Then: Metadata should be valid
        XCTAssertEqual(metadata.miniatureId, testMiniatureId)
        XCTAssertFalse(metadata.filename.isEmpty)
        XCTAssertTrue(metadata.filePath.hasPrefix("Photos/"))
        XCTAssertGreaterThan(metadata.fileSize, 0)
        XCTAssertTrue(metadata.mimeType == "image/jpeg" || metadata.mimeType == "image/png")
        
        // File should exist
        XCTAssertTrue(FileManager.default.fileExists(atPath: metadata.fileURL.path))
        
        // When: Loading the photo
        let loadedImage = try photoService.loadPhoto(metadata)
        
        // Then: Image should be loaded successfully
        XCTAssertNotNil(loadedImage)
        XCTAssertEqual(loadedImage.size, testImage.size)
        
        // When: Deleting the photo
        try photoService.deletePhoto(metadata)
        
        // Then: File should no longer exist
        XCTAssertFalse(FileManager.default.fileExists(atPath: metadata.fileURL.path))
    }
    
    func testSavePhotoWithInvalidImage() {
        // Given: An invalid image (empty image)
        let invalidImage = UIImage()
        
        // When/Then: Saving should throw an error
        XCTAssertThrowsError(try photoService.savePhoto(invalidImage, for: testMiniatureId)) { error in
            XCTAssertTrue(error is PhotoError)
            if case PhotoError.unsupportedFormat = error {
                // Expected error
            } else {
                XCTFail("Expected unsupportedFormat error, got \(error)")
            }
        }
    }
    
    func testLoadNonExistentPhoto() {
        // Given: Metadata for a non-existent photo
        let metadata = PhotoMetadata(
            id: UUID(),
            filename: "nonexistent.jpg",
            filePath: "Photos/nonexistent.jpg",
            fileSize: 1000,
            mimeType: "image/jpeg",
            createdAt: Date(),
            miniatureId: testMiniatureId
        )
        
        // When/Then: Loading should throw an error
        XCTAssertThrowsError(try photoService.loadPhoto(metadata)) { error in
            XCTAssertTrue(error is PhotoError)
            if case PhotoError.fileNotFound = error {
                // Expected error
            } else {
                XCTFail("Expected fileNotFound error, got \(error)")
            }
        }
    }
    
    func testDeleteNonExistentPhoto() {
        // Given: Metadata for a non-existent photo
        let metadata = PhotoMetadata(
            id: UUID(),
            filename: "nonexistent.jpg",
            filePath: "Photos/nonexistent.jpg",
            fileSize: 1000,
            mimeType: "image/jpeg",
            createdAt: Date(),
            miniatureId: testMiniatureId
        )
        
        // When/Then: Deleting should not throw an error (graceful handling)
        XCTAssertNoThrow(try photoService.deletePhoto(metadata))
    }
    
    // MARK: - Test Utility Methods
    
    func testGetTotalPhotosSize() throws {
        // Given: No photos initially
        let initialSize = photoService.getTotalPhotosSize()
        XCTAssertEqual(initialSize, 0)
        
        // When: Adding a photo
        let testImage = createTestImage()
        let metadata = try photoService.savePhoto(testImage, for: testMiniatureId)
        
        // Then: Total size should increase
        let newSize = photoService.getTotalPhotosSize()
        XCTAssertGreaterThan(newSize, initialSize)
        XCTAssertEqual(newSize, metadata.fileSize)
        
        // Cleanup
        try photoService.deletePhoto(metadata)
    }
    
    func testCleanupOrphanedFiles() throws {
        // Given: A saved photo and an orphaned file
        let testImage = createTestImage()
        let metadata = try photoService.savePhoto(testImage, for: testMiniatureId)
        
        // Create an orphaned file
        let photosDirectory = photoService.getPhotosDirectory()
        let orphanedFileURL = photosDirectory.appendingPathComponent("orphaned_file.jpg")
        let orphanedData = "fake image data".data(using: .utf8)!
        try orphanedData.write(to: orphanedFileURL)
        
        // Verify both files exist
        XCTAssertTrue(FileManager.default.fileExists(atPath: metadata.fileURL.path))
        XCTAssertTrue(FileManager.default.fileExists(atPath: orphanedFileURL.path))
        
        // When: Cleaning up with valid file paths
        let validFilePaths: Set<String> = [metadata.filePath]
        photoService.cleanupOrphanedFiles(validFilePaths: validFilePaths)
        
        // Then: Valid file should remain, orphaned file should be removed
        XCTAssertTrue(FileManager.default.fileExists(atPath: metadata.fileURL.path))
        XCTAssertFalse(FileManager.default.fileExists(atPath: orphanedFileURL.path))
        
        // Cleanup
        try photoService.deletePhoto(metadata)
    }
    
    // MARK: - Test PhotoMetadata
    
    func testPhotoMetadataFileURL() {
        // Given: Photo metadata
        let metadata = PhotoMetadata(
            id: UUID(),
            filename: "test.jpg",
            filePath: "Photos/test.jpg",
            fileSize: 1000,
            mimeType: "image/jpeg",
            createdAt: Date(),
            miniatureId: testMiniatureId
        )
        
        // When: Getting file URL
        let fileURL = metadata.fileURL
        
        // Then: URL should be correct
        let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let expectedURL = documentsDirectory.appendingPathComponent("Photos/test.jpg")
        XCTAssertEqual(fileURL, expectedURL)
    }
    
    func testPhotoMetadataFormattedFileSize() {
        // Given: Photo metadata with specific file size
        let metadata = PhotoMetadata(
            id: UUID(),
            filename: "test.jpg",
            filePath: "Photos/test.jpg",
            fileSize: 1024,
            mimeType: "image/jpeg",
            createdAt: Date(),
            miniatureId: testMiniatureId
        )
        
        // When: Getting formatted file size
        let formattedSize = metadata.formattedFileSize
        
        // Then: Should be formatted correctly
        XCTAssertFalse(formattedSize.isEmpty)
        XCTAssertTrue(formattedSize.contains("KB") || formattedSize.contains("bytes"))
    }
    
    // MARK: - Test ImageFormat Enum
    
    func testImageFormatProperties() {
        // Test JPEG format
        XCTAssertEqual(ImageFormat.jpeg.mimeType, "image/jpeg")
        XCTAssertEqual(ImageFormat.jpeg.fileExtension, "jpg")
        
        // Test PNG format
        XCTAssertEqual(ImageFormat.png.mimeType, "image/png")
        XCTAssertEqual(ImageFormat.png.fileExtension, "png")
        
        // Test HEIC format
        XCTAssertEqual(ImageFormat.heic.mimeType, "image/heic")
        XCTAssertEqual(ImageFormat.heic.fileExtension, "heic")
    }
    
    // MARK: - Helper Methods
    
    private func createTestImage() -> UIImage {
        // Create a simple test image
        let size = CGSize(width: 100, height: 100)
        UIGraphicsBeginImageContext(size)
        UIColor.red.setFill()
        UIRectFill(CGRect(origin: .zero, size: size))
        let image = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        return image ?? UIImage()
    }
    
    private func cleanupTestFiles() {
        let photosDirectory = photoService?.getPhotosDirectory()
        guard let directory = photosDirectory else { return }
        
        do {
            let fileURLs = try FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil)
            for fileURL in fileURLs {
                try FileManager.default.removeItem(at: fileURL)
            }
        } catch {
            print("Failed to cleanup test files: \(error)")
        }
    }
}