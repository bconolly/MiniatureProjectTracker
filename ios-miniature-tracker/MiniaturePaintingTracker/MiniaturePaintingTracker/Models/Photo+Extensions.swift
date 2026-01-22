//
//  Photo+Extensions.swift
//  MiniaturePaintingTracker
//
//  Created by Kiro on 22/1/2026.
//

import Foundation
import CoreData

// MARK: - Photo Entity Extensions

extension Photo {
    
    // MARK: - Computed Properties
    
    /// Full file URL for the photo in the app's document directory
    var fileURL: URL {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return documentsPath.appendingPathComponent(filePath ?? "")
    }
    
    /// Formatted file size string for display
    var formattedFileSize: String {
        return ByteCountFormatter.string(fromByteCount: fileSize, countStyle: .file)
    }
    
    /// Check if the photo file exists on disk
    var fileExists: Bool {
        return FileManager.default.fileExists(atPath: fileURL.path)
    }
    
    /// Image format based on MIME type
    var imageFormat: ImageFormat {
        guard let mimeType = mimeType else { return .jpeg }
        switch mimeType.lowercased() {
        case "image/jpeg", "image/jpg":
            return .jpeg
        case "image/png":
            return .png
        case "image/heic", "image/heif":
            return .heic
        default:
            return .jpeg
        }
    }
    
    /// Display name for the photo
    var displayName: String {
        let filename = filename ?? ""
        return filename.isEmpty ? "Photo \(id?.uuidString.prefix(8) ?? "Unknown")" : filename
    }
    
    /// Relative age string for display (e.g., "2 hours ago")
    var relativeAge: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.dateTimeStyle = .named
        return formatter.localizedString(for: createdAt ?? Date(), relativeTo: Date())
    }
    
    // MARK: - Validation
    
    /// Validate the photo data
    /// - Throws: ValidationError if validation fails
    func validate() throws {
        guard let filename = filename, !filename.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw ValidationError.emptyRequiredField("filename")
        }
        
        guard let filePath = filePath, !filePath.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw ValidationError.emptyRequiredField("filePath")
        }
        
        guard let mimeType = mimeType, !mimeType.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw ValidationError.emptyRequiredField("mimeType")
        }
        
        guard fileSize > 0 else {
            throw ValidationError.invalidFileSize(fileSize)
        }
        
        guard imageFormat != .jpeg || mimeType.lowercased().contains("jpeg") || mimeType.lowercased().contains("jpg") else {
            throw ValidationError.unsupportedImageFormat(mimeType)
        }
        
        guard miniature != nil else {
            throw ValidationError.invalidRelationship("miniature")
        }
    }
    
    /// Validate that the photo file exists and is accessible
    /// - Throws: ValidationError if file validation fails
    func validateFile() throws {
        guard fileExists else {
            throw ValidationError.fileNotFound(filePath ?? "unknown")
        }
        
        // Check if file size matches the stored value
        do {
            let attributes = try FileManager.default.attributesOfItem(atPath: fileURL.path)
            if let actualSize = attributes[.size] as? Int64, actualSize != fileSize {
                throw ValidationError.fileSizeMismatch(expected: fileSize, actual: actualSize)
            }
        } catch {
            throw ValidationError.fileAccessError(error)
        }
    }
    
    // MARK: - File Management
    
    /// Delete the photo file from disk
    /// - Throws: Error if file deletion fails
    func deleteFile() throws {
        guard fileExists else { return }
        
        do {
            try FileManager.default.removeItem(at: fileURL)
        } catch {
            throw PhotoError.fileSystemError(error)
        }
    }
    
    /// Generate a unique filename for a new photo
    /// - Parameter extension: The file extension (e.g., "jpg", "png")
    /// - Returns: A unique filename
    static func generateUniqueFilename(withExtension extension: String) -> String {
        let timestamp = Int(Date().timeIntervalSince1970)
        let uuid = UUID().uuidString.prefix(8)
        return "photo_\(timestamp)_\(uuid).\(`extension`)"
    }
    
    /// Get the file extension from the filename
    var fileExtension: String {
        guard let filename = filename else { return "" }
        return (filename as NSString).pathExtension.lowercased()
    }
    
    // MARK: - Convenience Initializers
    
    /// Create a new photo with the specified parameters
    /// - Parameters:
    ///   - context: The managed object context
    ///   - filename: The photo filename
    ///   - filePath: The relative file path
    ///   - fileSize: The file size in bytes
    ///   - mimeType: The MIME type
    ///   - miniature: The associated miniature
    /// - Returns: A new Photo instance
    static func create(
        in context: NSManagedObjectContext,
        filename: String,
        filePath: String,
        fileSize: Int64,
        mimeType: String,
        miniature: Miniature
    ) -> Photo {
        let photo = Photo(context: context)
        photo.id = UUID()
        photo.filename = filename
        photo.filePath = filePath
        photo.fileSize = fileSize
        photo.mimeType = mimeType
        photo.createdAt = Date()
        photo.miniature = miniature
        
        return photo
    }
}

// MARK: - Fetch Requests

extension Photo {
    
    /// Fetch request for photos by miniature
    /// - Parameter miniature: The miniature to filter by
    /// - Returns: A configured fetch request
    static func fetchRequest(for miniature: Miniature) -> NSFetchRequest<Photo> {
        let request: NSFetchRequest<Photo> = Photo.fetchRequest()
        request.predicate = NSPredicate(format: "miniature == %@", miniature)
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \Photo.createdAt, ascending: true)
        ]
        return request
    }
    
    /// Fetch request for photos sorted by creation date (chronological order)
    /// - Returns: A configured fetch request
    static func fetchRequestSortedByDate() -> NSFetchRequest<Photo> {
        let request: NSFetchRequest<Photo> = Photo.fetchRequest()
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \Photo.createdAt, ascending: true)
        ]
        return request
    }
    
    /// Fetch request for photos by image format
    /// - Parameter format: The image format to filter by
    /// - Returns: A configured fetch request
    static func fetchRequest(for format: ImageFormat) -> NSFetchRequest<Photo> {
        let request: NSFetchRequest<Photo> = Photo.fetchRequest()
        let mimeType = format.mimeType
        request.predicate = NSPredicate(format: "mimeType == %@", mimeType)
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \Photo.createdAt, ascending: false)
        ]
        return request
    }
}

// MARK: - Additional Validation Errors

extension ValidationError {
    static func invalidFileSize(_ size: Int64) -> ValidationError {
        return .invalidEnumValue("fileSize", "\(size)")
    }
    
    static func unsupportedImageFormat(_ mimeType: String) -> ValidationError {
        return .invalidEnumValue("mimeType", mimeType)
    }
    
    static func fileNotFound(_ path: String) -> ValidationError {
        return .invalidRelationship("file at path: \(path)")
    }
    
    static func fileSizeMismatch(expected: Int64, actual: Int64) -> ValidationError {
        return .invalidEnumValue("fileSize", "expected \(expected), got \(actual)")
    }
    
    static func fileAccessError(_ error: Error) -> ValidationError {
        return .invalidRelationship("file access: \(error.localizedDescription)")
    }
}