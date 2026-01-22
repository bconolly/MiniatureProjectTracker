//
//  PhotoServiceProtocol.swift
//  MiniaturePaintingTracker
//
//  Created by Kiro on 22/1/2026.
//

import Foundation
import UIKit

/// Protocol defining the interface for photo management operations
protocol PhotoServiceProtocol {
    /// Save a photo to the file system and return photo metadata
    /// - Parameters:
    ///   - image: The UIImage to save
    ///   - miniatureId: The ID of the miniature this photo belongs to
    /// - Returns: PhotoMetadata containing file information
    /// - Throws: PhotoError if the save operation fails
    func savePhoto(_ image: UIImage, for miniatureId: UUID) throws -> PhotoMetadata
    
    /// Load a photo from the file system
    /// - Parameter metadata: The photo metadata containing file path information
    /// - Returns: The loaded UIImage
    /// - Throws: PhotoError if the load operation fails
    func loadPhoto(_ metadata: PhotoMetadata) throws -> UIImage
    
    /// Delete a photo from the file system
    /// - Parameter metadata: The photo metadata containing file path information
    /// - Throws: PhotoError if the delete operation fails
    func deletePhoto(_ metadata: PhotoMetadata) throws
    
    /// Get the photos directory URL
    /// - Returns: URL of the photos directory in the app's document directory
    func getPhotosDirectory() -> URL
    
    /// Validate image format
    /// - Parameter image: The UIImage to validate
    /// - Returns: True if the image format is supported (JPEG, PNG, HEIC)
    func validateImageFormat(_ image: UIImage) -> Bool
    
    /// Generate a unique filename for a photo
    /// - Parameters:
    ///   - miniatureId: The ID of the miniature this photo belongs to
    ///   - format: The image format (jpeg, png, heic)
    /// - Returns: A unique filename string
    func generateUniqueFilename(for miniatureId: UUID, format: ImageFormat) -> String
}

/// Photo metadata structure containing file information
struct PhotoMetadata {
    let id: UUID
    let filename: String
    let filePath: String
    let fileSize: Int64
    let mimeType: String
    let createdAt: Date
    let miniatureId: UUID
    
    /// Get the full file URL
    var fileURL: URL {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return documentsPath.appendingPathComponent(filePath)
    }
    
    /// Get formatted file size string
    var formattedFileSize: String {
        ByteCountFormatter.string(fromByteCount: fileSize, countStyle: .file)
    }
}

/// Supported image formats
enum ImageFormat: String, CaseIterable {
    case jpeg = "jpeg"
    case png = "png"
    case heic = "heic"
    
    var mimeType: String {
        switch self {
        case .jpeg:
            return "image/jpeg"
        case .png:
            return "image/png"
        case .heic:
            return "image/heic"
        }
    }
    
    var fileExtension: String {
        switch self {
        case .jpeg:
            return "jpg"
        case .png:
            return "png"
        case .heic:
            return "heic"
        }
    }
}

/// Photo service errors
enum PhotoError: LocalizedError {
    case insufficientStorage
    case unsupportedFormat
    case fileSystemError(Error)
    case permissionDenied
    case fileNotFound
    case invalidImage
    case directoryCreationFailed
    
    var errorDescription: String? {
        switch self {
        case .insufficientStorage:
            return "Not enough storage space for photos"
        case .unsupportedFormat:
            return "Photo format not supported. Only JPEG, PNG, and HEIC are allowed."
        case .fileSystemError(let error):
            return "File operation failed: \(error.localizedDescription)"
        case .permissionDenied:
            return "Photo access permission required"
        case .fileNotFound:
            return "Photo file not found"
        case .invalidImage:
            return "Invalid image data"
        case .directoryCreationFailed:
            return "Failed to create photos directory"
        }
    }
    
    var failureReason: String? {
        switch self {
        case .insufficientStorage:
            return "The device does not have enough free storage space"
        case .unsupportedFormat:
            return "The image format is not supported by the app"
        case .fileSystemError:
            return "A file system operation failed"
        case .permissionDenied:
            return "The app does not have permission to access photos"
        case .fileNotFound:
            return "The requested photo file could not be found"
        case .invalidImage:
            return "The image data is corrupted or invalid"
        case .directoryCreationFailed:
            return "The photos directory could not be created"
        }
    }
    
    var recoverySuggestion: String? {
        switch self {
        case .insufficientStorage:
            return "Free up storage space on your device and try again"
        case .unsupportedFormat:
            return "Use a photo in JPEG, PNG, or HEIC format"
        case .fileSystemError, .directoryCreationFailed:
            return "Restart the app and try again"
        case .permissionDenied:
            return "Enable photo access in Settings"
        case .fileNotFound:
            return "The photo may have been deleted. Try taking a new photo."
        case .invalidImage:
            return "Try selecting a different photo"
        }
    }
}