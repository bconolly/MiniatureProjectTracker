//
//  CoreDataServiceProtocol.swift
//  MiniaturePaintingTracker
//
//  Created by Kiro on 22/1/2026.
//

import Foundation
import CoreData

/// Protocol defining the interface for Core Data operations
protocol CoreDataServiceProtocol {
    /// Save changes to the managed object context
    /// - Throws: Core Data save errors
    func save() throws
    
    /// Fetch objects using a fetch request
    /// - Parameter request: The fetch request to execute
    /// - Returns: Array of fetched objects
    /// - Throws: Core Data fetch errors
    func fetch<T: NSManagedObject>(_ request: NSFetchRequest<T>) throws -> [T]
    
    /// Delete an object from the managed object context
    /// - Parameter object: The object to delete
    /// - Throws: Core Data delete errors
    func delete(_ object: NSManagedObject) throws
    
    /// Perform a task on a background context
    /// - Parameter block: The block to execute on the background context
    func performBackgroundTask(_ block: @escaping (NSManagedObjectContext) -> Void)
    
    /// Get the main managed object context for UI operations
    var viewContext: NSManagedObjectContext { get }
}