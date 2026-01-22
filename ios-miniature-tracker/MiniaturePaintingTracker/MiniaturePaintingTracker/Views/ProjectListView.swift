//
//  ProjectListView.swift
//  MiniaturePaintingTracker
//
//  Created on 22/1/2026.
//

import SwiftUI
import CoreData

struct ProjectListView: View {
    @Environment(\.managedObjectContext) private var viewContext
    
    @FetchRequest(
        sortDescriptors: [
            NSSortDescriptor(keyPath: \Project.gameSystem, ascending: true),
            NSSortDescriptor(keyPath: \Project.army, ascending: true),
            NSSortDescriptor(keyPath: \Project.name, ascending: true)
        ],
        animation: .default)
    private var projects: FetchedResults<Project>
    
    @State private var showingAddProject = false
    @State private var expandedSystems: Set<GameSystem> = Set(GameSystem.allCases)
    @State private var searchText = ""
    
    var body: some View {
        NavigationStack {
            Group {
                if projects.isEmpty {
                    emptyState
                } else {
                    projectList
                }
            }
            .navigationTitle("Projects")
            .searchable(text: $searchText, prompt: "Search projects")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showingAddProject = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddProject) {
                ProjectFormView(mode: .create)
            }
        }
    }
    
    // MARK: - Empty State
    
    private var emptyState: some View {
        ContentUnavailableView {
            Label("No Projects", systemImage: "folder")
        } description: {
            Text("Create your first project to start tracking your miniatures.")
        } actions: {
            Button("Create Project") {
                showingAddProject = true
            }
            .buttonStyle(.borderedProminent)
        }
    }
    
    // MARK: - Project List
    
    private var projectList: some View {
        List {
            ForEach(groupedProjects.keys.sorted(by: { $0.displayName < $1.displayName }), id: \.self) { gameSystem in
                Section {
                    DisclosureGroup(
                        isExpanded: Binding(
                            get: { expandedSystems.contains(gameSystem) },
                            set: { isExpanded in
                                if isExpanded {
                                    expandedSystems.insert(gameSystem)
                                } else {
                                    expandedSystems.remove(gameSystem)
                                }
                            }
                        )
                    ) {
                        ForEach(armiesForGameSystem(gameSystem), id: \.self) { army in
                            ArmySection(
                                army: army,
                                projects: projectsForArmy(gameSystem: gameSystem, army: army)
                            )
                        }
                    } label: {
                        HStack {
                            GameSystemBadge(gameSystem: gameSystem)
                            Text(gameSystem.displayName)
                                .font(.headline)
                            Spacer()
                            Text("\(countForGameSystem(gameSystem))")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .listStyle(.sidebar)
    }
    
    // MARK: - Computed Properties
    
    private var filteredProjects: [Project] {
        if searchText.isEmpty {
            return Array(projects)
        }
        return projects.filter { project in
            (project.name?.localizedCaseInsensitiveContains(searchText) ?? false) ||
            (project.army?.localizedCaseInsensitiveContains(searchText) ?? false)
        }
    }
    
    private var groupedProjects: [GameSystem: [Project]] {
        Dictionary(grouping: filteredProjects) { $0.gameSystemEnum }
    }
    
    private func armiesForGameSystem(_ gameSystem: GameSystem) -> [String] {
        let projectsForSystem = groupedProjects[gameSystem] ?? []
        let armies = Set(projectsForSystem.compactMap { $0.army })
        return armies.sorted()
    }
    
    private func projectsForArmy(gameSystem: GameSystem, army: String) -> [Project] {
        (groupedProjects[gameSystem] ?? []).filter { $0.army == army }
    }
    
    private func countForGameSystem(_ gameSystem: GameSystem) -> Int {
        (groupedProjects[gameSystem] ?? []).count
    }
}

// MARK: - Army Section

struct ArmySection: View {
    let army: String
    let projects: [Project]
    
    var body: some View {
        ForEach(projects) { project in
            NavigationLink(destination: ProjectDetailView(project: project)) {
                ProjectRowView(project: project)
            }
        }
    }
}

// MARK: - Game System Badge

struct GameSystemBadge: View {
    let gameSystem: GameSystem
    
    var color: Color {
        switch gameSystem {
        case .warhammer40k:
            return .red
        case .ageOfSigmar:
            return .blue
        case .horusHeresy:
            return .purple
        }
    }
    
    var body: some View {
        Text(gameSystem.abbreviation)
            .font(.caption)
            .fontWeight(.bold)
            .foregroundStyle(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color)
            .clipShape(RoundedRectangle(cornerRadius: 6))
    }
}

// MARK: - Project Row View

struct ProjectRowView: View {
    @ObservedObject var project: Project
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(project.name ?? "Unknown")
                    .font(.headline)
                
                Spacer()
                
                Text("\(project.miniatureCount) miniatures")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            HStack {
                Text(project.army ?? "")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                
                Spacer()
                
                // Progress indicator
                ProgressView(value: project.completionPercentage)
                    .frame(width: 60)
                    .tint(.green)
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    ProjectListView()
        .environment(\.managedObjectContext, CoreDataManager.shared.persistentContainer.viewContext)
}
