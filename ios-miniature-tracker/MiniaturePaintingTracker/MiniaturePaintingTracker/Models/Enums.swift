//
//  Enums.swift
//  MiniaturePaintingTracker
//
//  Created by Kiro on 22/1/2026.
//

import Foundation
import SwiftUI

// MARK: - Game System Enumeration

/// Enumeration representing the different Warhammer game systems
enum GameSystem: String, CaseIterable, Identifiable {
    case ageOfSigmar = "age_of_sigmar"
    case horusHeresy = "horus_heresy"
    case warhammer40k = "warhammer_40k"
    
    var id: String { rawValue }
    
    /// Human-readable display name for the game system
    var displayName: String {
        switch self {
        case .ageOfSigmar:
            return "Age of Sigmar"
        case .horusHeresy:
            return "Horus Heresy"
        case .warhammer40k:
            return "Warhammer 40K"
        }
    }
    
    /// Short abbreviation for the game system
    var abbreviation: String {
        switch self {
        case .ageOfSigmar:
            return "AoS"
        case .horusHeresy:
            return "HH"
        case .warhammer40k:
            return "40K"
        }
    }
}

// MARK: - Miniature Type Enumeration

/// Enumeration representing the different types of miniatures
enum MiniatureType: String, CaseIterable, Identifiable {
    case troop = "troop"
    case character = "character"
    
    var id: String { rawValue }
    
    /// Human-readable display name for the miniature type
    var displayName: String {
        switch self {
        case .troop:
            return "Troop"
        case .character:
            return "Character"
        }
    }
    
    /// Icon name for the miniature type
    var iconName: String {
        switch self {
        case .troop:
            return "person.3.fill"
        case .character:
            return "crown.fill"
        }
    }
}

// MARK: - Progress Status Enumeration

/// Enumeration representing the painting progress status of a miniature
enum ProgressStatus: String, CaseIterable, Identifiable {
    case unpainted = "unpainted"
    case primed = "primed"
    case basecoated = "basecoated"
    case detailed = "detailed"
    case completed = "completed"
    
    var id: String { rawValue }
    
    /// Human-readable display name for the progress status
    var displayName: String {
        switch self {
        case .unpainted:
            return "Unpainted"
        case .primed:
            return "Primed"
        case .basecoated:
            return "Basecoated"
        case .detailed:
            return "Detailed"
        case .completed:
            return "Completed"
        }
    }
    
    /// Color associated with the progress status for UI display
    var color: Color {
        switch self {
        case .unpainted:
            return .gray
        case .primed:
            return .orange
        case .basecoated:
            return .yellow
        case .detailed:
            return .blue
        case .completed:
            return .green
        }
    }
    
    /// Progress percentage (0.0 to 1.0) for progress indicators
    var progressPercentage: Double {
        switch self {
        case .unpainted:
            return 0.0
        case .primed:
            return 0.2
        case .basecoated:
            return 0.4
        case .detailed:
            return 0.8
        case .completed:
            return 1.0
        }
    }
    
    /// Icon name for the progress status
    var iconName: String {
        switch self {
        case .unpainted:
            return "circle"
        case .primed:
            return "circle.fill"
        case .basecoated:
            return "circle.lefthalf.filled"
        case .detailed:
            return "circle.righthalf.filled"
        case .completed:
            return "checkmark.circle.fill"
        }
    }
}

// MARK: - Export Format Enumeration

/// Enumeration representing the available export formats
enum ExportFormat: String, CaseIterable, Identifiable {
    case json = "json"
    case csv = "csv"
    
    var id: String { rawValue }
    
    /// Human-readable display name for the export format
    var displayName: String {
        switch self {
        case .json:
            return "JSON"
        case .csv:
            return "CSV"
        }
    }
    
    /// File extension for the export format
    var fileExtension: String {
        return rawValue
    }
    
    /// MIME type for the export format
    var mimeType: String {
        switch self {
        case .json:
            return "application/json"
        case .csv:
            return "text/csv"
        }
    }
}

// MARK: - Photo Source Enumeration

/// Enumeration representing the source of a photo
enum PhotoSource: String, CaseIterable, Identifiable {
    case camera = "camera"
    case photoLibrary = "photo_library"
    
    var id: String { rawValue }
    
    /// Human-readable display name for the photo source
    var displayName: String {
        switch self {
        case .camera:
            return "Camera"
        case .photoLibrary:
            return "Photo Library"
        }
    }
    
    /// Icon name for the photo source
    var iconName: String {
        switch self {
        case .camera:
            return "camera.fill"
        case .photoLibrary:
            return "photo.on.rectangle"
        }
    }
}

// MARK: - Permission Type Enumeration

/// Enumeration representing the different types of permissions required by the app
enum PermissionType: String, CaseIterable, Identifiable {
    case camera = "camera"
    case photoLibrary = "photo_library"
    
    var id: String { rawValue }
    
    /// Human-readable display name for the permission type
    var displayName: String {
        switch self {
        case .camera:
            return "Camera"
        case .photoLibrary:
            return "Photo Library"
        }
    }
    
    /// Description of why the permission is needed
    var usageDescription: String {
        switch self {
        case .camera:
            return "This app needs camera access to capture photos of your miniatures for progress tracking."
        case .photoLibrary:
            return "This app needs photo library access to select existing photos of your miniatures."
        }
    }
}