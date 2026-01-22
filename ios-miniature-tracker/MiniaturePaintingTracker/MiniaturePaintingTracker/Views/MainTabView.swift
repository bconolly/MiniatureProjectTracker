//
//  MainTabView.swift
//  MiniaturePaintingTracker
//
//  Created on 22/1/2026.
//

import SwiftUI
import CoreData

struct MainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "house.fill")
                }
                .tag(0)
            
            ProjectListView()
                .tabItem {
                    Label("Projects", systemImage: "folder.fill")
                }
                .tag(1)
            
            RecipeListView()
                .tabItem {
                    Label("Recipes", systemImage: "book.fill")
                }
                .tag(2)
        }
        .tint(.blue)
    }
}

#Preview {
    MainTabView()
        .environment(\.managedObjectContext, CoreDataManager.shared.persistentContainer.viewContext)
}
