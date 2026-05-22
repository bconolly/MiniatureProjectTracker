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
    @State private var expandedSystems: Set<String> = Set(GameSystem.allCases.map { $0.rawValue })
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
            ForEach(sortedGameSystemKeys, id: \.self) { systemKey in
                Section {
                    DisclosureGroup(
                        isExpanded: Binding(
                            get: { expandedSystems.contains(systemKey) },
                            set: { isExpanded in
                                if isExpanded {
                                    expandedSystems.insert(systemKey)
                                } else {
                                    expandedSystems.remove(systemKey)
                                }
                            }
                        )
                    ) {
                        ForEach(armiesForGameSystem(systemKey), id: \.self) { army in
                            ArmySection(
                                army: army,
                                projects: projectsForArmy(gameSystemKey: systemKey, army: army)
                            )
                        }
                    } label: {
                        HStack {
                            GameSystemBadge(gameSystemKey: systemKey)
                            Text(GameSystemDisplay.displayName(for: systemKey))
                                .font(.headline)
                            Spacer()
                            Text("\(countForGameSystem(systemKey))")
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

    private var groupedProjects: [String: [Project]] {
        Dictionary(grouping: filteredProjects) { $0.gameSystemKey }
    }

    private var sortedGameSystemKeys: [String] {
        groupedProjects.keys.sorted { a, b in
            GameSystemDisplay.displayName(for: a)
                .localizedCaseInsensitiveCompare(GameSystemDisplay.displayName(for: b))
                == .orderedAscending
        }
    }

    private func armiesForGameSystem(_ systemKey: String) -> [String] {
        let projectsForSystem = groupedProjects[systemKey] ?? []
        let armies = Set(projectsForSystem.compactMap { $0.army })
        return armies.sorted()
    }

    private func projectsForArmy(gameSystemKey: String, army: String) -> [Project] {
        (groupedProjects[gameSystemKey] ?? []).filter { $0.army == army }
    }

    private func countForGameSystem(_ systemKey: String) -> Int {
        (groupedProjects[systemKey] ?? []).count
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
    let gameSystemKey: String

    /// Built-in convenience initializer.
    init(gameSystem: GameSystem) {
        self.gameSystemKey = gameSystem.rawValue
    }

    /// Generic initializer for raw keys (built-in raw value or custom name).
    init(gameSystemKey: String) {
        self.gameSystemKey = gameSystemKey
    }

    private var builtIn: GameSystem? {
        GameSystem(rawValue: gameSystemKey)
    }

    var color: Color {
        switch builtIn {
        case .warhammer40k:
            return .red
        case .ageOfSigmar:
            return .blue
        case .horusHeresy:
            return .purple
        case .none:
            // Stable, name-derived hue for custom game systems.
            return Self.customColor(for: gameSystemKey)
        }
    }

    private static func customColor(for key: String) -> Color {
        let palette: [Color] = [.teal, .indigo, .pink, .brown, .mint, .cyan]
        // FNV-1a 32-bit over UTF-8 bytes. Deterministic across launches and
        // never overflow-traps, unlike `abs(String.hashValue)`.
        var hash: UInt32 = 0x811c_9dc5
        for byte in key.utf8 {
            hash ^= UInt32(byte)
            hash &*= 0x0100_0193
        }
        return palette[Int(hash % UInt32(palette.count))]
    }

    var body: some View {
        Text(GameSystemDisplay.abbreviation(for: gameSystemKey))
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
                
                // Progress indicator with percentage
                HStack(spacing: 6) {
                    Text("\(Int(project.completionPercentage * 100))%")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundStyle(project.completionPercentage == 1.0 ? .green : .secondary)
                    
                    ProgressView(value: project.completionPercentage)
                        .frame(width: 60)
                        .tint(project.completionPercentage == 1.0 ? .green : .blue)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    ProjectListView()
        .environment(\.managedObjectContext, CoreDataManager.shared.persistentContainer.viewContext)
}
