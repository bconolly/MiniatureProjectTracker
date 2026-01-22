//
//  PhotoService.swift
//  MiniaturePaintingTracker
//
//  Created by Kiro on 22/1/2026.
//

import Foundation
import UIKit
import os.log

/// Photo service implementation providing file management for miniature photos
class PhotoService: PhotoServiceProtocol {
    
    // MARK: - Properties
    
    private let fileManager = FileManager.default
    private let logger = Logger(subsystem: "com.miniaturetracker.app", category: "PhotoService")
    
    // MARK: - Constants
    
    private static let photosDirectoryName = "Photos"
    private static let maxFileSize: Int64 = 50 * 1024 * 1024 // 50MB limit
    
    // MARK: - Initialization
    
    init() {
        // Ensure photos directory exists on initialization
        do {
            try createPhotosDirectoryIfNeeded()
        } catch {
            logger.error("Failed to create photos directory during initialization: \(error.localizedDescription)")
        }
    }
    
    // MARK: - PhotoServiceProtocol Implementation
    
    /// Save a photo to the file system and return photo metadata
    /// - Parameters:
    ///   - image: The UIImage to save
    ///   - miniatureId: The ID of the miniature this photo belongs to
    /// - Returns: PhotoMetadata containing file information
    /// - Throws: PhotoError if the save operation fails
    func savePhoto(_ image: UIImage, for miniatureId: UUID) throws -> PhotoMetadata {
        logger.debug("Saving photo for miniature: \(miniatureId)")
        
        // Validate image format
        guard validateImageFormat(image) else {
            logger.error("Invalid image format for miniature: \(miniatureId)")
            throw PhotoError.unsupportedFormat
        }
        
        // Check available storage space
        try checkAvailableStorage()
        
        // Determine image format and convert to data
        let (imageData, format) = try convertImageToData(image)
        
        // Generate unique filename
        let filename = generateUniqueFilename(for: miniatureId, format: format)
        let filePath = "\(Self.photosDirectoryName)/\(filename)"
        
        // Get full file URL
        let documentsDirectory = getDocumentsDirectory()
        let fileURL = documentsDirectory.appendingPathComponent(filePath)
        
        // Ensure photos directory exists
        try createPhotosDirectoryIfNeeded()
        
        // Write image data to file
        do {
            try imageData.write(to: fileURL)
            logger.debug("Successfully saved photo to: \(fileURL.path)")
        } catch {
            logger.error("Failed to write photo data: \(error.localizedDescription)")
            throw PhotoError.fileSystemError(error)
        }
        
        // Create and return photo metadata
        let metadata = PhotoMetadata(
            id: UUID(),
            filename: filename,
            filePath: filePath,
            fileSize: Int64(imageData.count),
            mimeType: format.mimeType,
            createdAt: Date(),
            miniatureId: miniatureId
        )
        
        logger.debug("Created photo metadata: \(metadata.id)")
        return metadata
    }
    
    /// Load a photo from the file system
    /// - Parameter metadata: The photo metadata containing file path information
    /// - Returns: The loaded UIImage
    /// - Throws: PhotoError if the load operation fails
    func loadPhoto(_ metadata: PhotoMetadata) throws -> UIImage {
        logger.debug("Loading photo: \(metadata.id)")
        
        let fileURL = metadata.fileURL
        
        // Check if file exists
        guard fileManager.fileExists(atPath: fileURL.path) else {
            logger.error("Photo file not found: \(fileURL.path)")
            throw PhotoError.fileNotFound
        }
        
        // Load image data
        let imageData: Data
        do {
            imageData = try Data(contentsOf: fileURL)
        } catch {
            logger.error("Failed to load photo data: \(error.localizedDescription)")
            throw PhotoError.fileSystemError(error)
        }
        
        // Create UIImage from data
        guard let image = UIImage(data: imageData) else {
            logger.error("Failed to create UIImage from data for photo: \(metadata.id)")
            throw PhotoError.invalidImage
        }
        
        logger.debug("Successfully loaded photo: \(metadata.id)")
        return image
    }
    
    /// Delete a photo from the file system
    /// - Parameter metadata: The photo metadata containing file path information
    /// - Throws: PhotoError if the delete operation fails
    func deletePhoto(_ metadata: PhotoMetadata) throws {
        logger.debug("Deleting photo: \(metadata.id)")
        
        let fileURL = metadata.fileURL
        
        // Check if file exists
        guard fileManager.fileExists(atPath: fileURL.path) else {
            logger.warning("Photo file not found for deletion: \(fileURL.path)")
            return // File doesn't exist, consider deletion successful
        }
        
        // Delete the file
        do {
            try fileManager.removeItem(at: fileURL)
            logger.debug("Successfully deleted photo: \(metadata.id)")
        } catch {
            logger.error("Failed to delete photo: \(error.localizedDescription)")
            throw PhotoError.fileSystemError(error)
        }
    }
    
    /// Get the photos directory URL
    /// - Returns: URL of the photos directory in the app's document directory
    func getPhotosDirectory() -> URL {
        return getDocumentsDirectory().appendingPathComponent(Self.photosDirectoryName)
    }
    
    /// Validate image format
    /// - Parameter image: The UIImage to validate
    /// - Returns: True if the image format is supported (JPEG, PNG, HEIC)
    func validateImageFormat(_ image: UIImage) -> Bool {
        // Try to convert to supported formats to validate
        if image.jpegData(compressionQuality: 1.0) != nil {
            return true
        }
        if image.pngData() != nil {
            return true
        }
        // Note: HEIC validation would require additional checks
        // For now, we assume if JPEG or PNG conversion works, the image is valid
        return false
    }
    
    /// Generate a unique filename for a photo
    /// - Parameters:
    ///   - miniatureId: The ID of the miniature this photo belongs to
    ///   - format: The image format (jpeg, png, heic)
    /// - Returns: A unique filename string
    func generateUniqueFilename(for miniatureId: UUID, format: ImageFormat) -> String {
        let timestamp = Int(Date().timeIntervalSince1970)
        let uniqueId = UUID().uuidString.prefix(8)
        let miniaturePrefix = miniatureId.uuidString.prefix(8)
        
        return "\(miniaturePrefix)_\(timestamp)_\(uniqueId).\(format.fileExtension)"
    }
    
    // MARK: - Private Helper Methods
    
    /// Get the documents directory URL
    /// - Returns: URL of the app's documents directory
    private func getDocumentsDirectory() -> URL {
        return fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
    
    /// Create photos directory if it doesn't exist
    /// - Throws: PhotoError.directoryCreationFailed if directory creation fails
    private func createPhotosDirectoryIfNeeded() throws {
        let photosDirectory = getPhotosDirectory()
        
        if !fileManager.fileExists(atPath: photosDirectory.path) {
            do {
                try fileManager.createDirectory(at: photosDirectory, withIntermediateDirectories: true, attributes: nil)
                logger.debug("Created photos directory: \(photosDirectory.path)")
            } catch {
                logger.error("Failed to create photos directory: \(error.localizedDescription)")
                throw PhotoError.directoryCreationFailed
            }
        }
    }
    
    /// Check available storage space
    /// - Throws: PhotoError.insufficientStorage if storage is insufficient
    private func checkAvailableStorage() throws {
        let documentsDirectory = getDocumentsDirectory()
        
        do {
            let resourceValues = try documentsDirectory.resourceValues(forKeys: [.volumeAvailableCapacityKey])
            if let availableCapacity = resourceValues.volumeAvailableCapacity {
                // Require at least 100MB free space
                let requiredSpace: Int64 = 100 * 1024 * 1024
                if availableCapacity < requiredSpace {
                    logger.error("Insufficient storage space. Available: \(availableCapacity), Required: \(requiredSpace)")
                    throw PhotoError.insufficientStorage
                }
            }
        } catch {
            logger.warning("Could not check available storage: \(error.localizedDescription)")
            // Continue without storage check if we can't determine available space
        }
    }
    
    /// Convert UIImage to Data and determine format
    /// - Parameter image: The UIImage to convert
    /// - Returns: Tuple containing image data and detected format
    /// - Throws: PhotoError if conversion fails
    private func convertImageToData(_ image: UIImage) throws -> (Data, ImageFormat) {
        // Try JPEG first (most common and efficient)
        if let jpegData = image.jpegData(compressionQuality: 0.8) {
            // Check file size limit
            if Int64(jpegData.count) > Self.maxFileSize {
                logger.warning("JPEG image too large, trying with lower quality")
                if let compressedData = image.jpegData(compressionQuality: 0.5) {
                    return (compressedData, .jpeg)
                }
            } else {
                return (jpegData, .jpeg)
            }
        }
        
        // Try PNG as fallback
        if let pngData = image.pngData() {
            if Int64(pngData.count) > Self.maxFileSize {
                logger.error("PNG image too large: \(pngData.count) bytes")
                throw PhotoError.insufficientStorage
            }
            return (pngData, .png)
        }
        
        // If neither format works, throw error
        logger.error("Could not convert image to supported format")
        throw PhotoError.unsupportedFormat
    }
    
    // MARK: - Cleanup Methods
    
    /// Clean up orphaned photo files (files without corresponding Core Data records)
    /// This method can be called during app startup to maintain file system integrity
    func cleanupOrphanedFiles(validFilePaths: Set<String>) {
        logger.debug("Starting cleanup of orphaned photo files")
        
        let photosDirectory = getPhotosDirectory()
        
        do {
            let fileURLs = try fileManager.contentsOfDirectory(at: photosDirectory, includingPropertiesForKeys: nil)
            
            for fileURL in fileURLs {
                let relativePath = "\(Self.photosDirectoryName)/\(fileURL.lastPathComponent)"
                
                if !validFilePaths.contains(relativePath) {
                    do {
                        try fileManager.removeItem(at: fileURL)
                        logger.debug("Removed orphaned file: \(fileURL.lastPathComponent)")
                    } catch {
                        logger.error("Failed to remove orphaned file \(fileURL.lastPathComponent): \(error.localizedDescription)")
                    }
                }
            }
        } catch {
            logger.error("Failed to enumerate photos directory for cleanup: \(error.localizedDescription)")
        }
    }
    
    /// Get total size of all photos in bytes
    /// - Returns: Total size of all photo files
    func getTotalPhotosSize() -> Int64 {
        let photosDirectory = getPhotosDirectory()
        var totalSize: Int64 = 0
        
        do {
            let fileURLs = try fileManager.contentsOfDirectory(at: photosDirectory, includingPropertiesForKeys: [.fileSizeKey])
            
            for fileURL in fileURLs {
                let resourceValues = try fileURL.resourceValues(forKeys: [.fileSizeKey])
                if let fileSize = resourceValues.fileSize {
                    totalSize += Int64(fileSize)
                }
            }
        } catch {
            logger.error("Failed to calculate total photos size: \(error.localizedDescription)")
        }
        
        return totalSize
    }
}