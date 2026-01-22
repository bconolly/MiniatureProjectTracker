//
//  ProjectDetailView.swift
//  MiniaturePaintingTracker
//
//  Created on 22/1/2026.
//

import SwiftUI
import CoreData

struct ProjectDetailView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss
    
    @ObservedObject var project: Project
    
    @State private var showingEditSheet = false
    @State private var showingAddMiniature = false
    @State private var showingDeleteAlert = false
    @State private var miniatureToDelete: Miniature?
    
    var body: some View {
        List {
            // Project Info Section
            Section {
                projectInfoCard
            }
            .listRowInsets(EdgeInsets())
            .listRowBackground(Color.clear)
            
            // Progress Section
            Section("Progress Overview") {
                progressOverview
            }
            
            // Miniatures Section
            Section {
                if project.miniaturesArray.isEmpty {
                    emptyMiniaturesState
                } else {
                    ForEach(project.miniaturesArray) { miniature in
                        NavigationLink(destination: MiniatureDetailView(miniature: miniature)) {
                            MiniatureRowView(miniature: miniature)
                        }
                    }
                    .onDelete(perform: deleteMiniatures)
                }
            } header: {
                HStack {
                    Text("Miniatures")
                    Spacer()
                    Text("\(project.miniatureCount)")
                        .foregroundStyle(.secondary)
                }
            }
        }
        .navigationTitle(project.name ?? "Project")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    Button {
                        showingAddMiniature = true
                    } label: {
                        Label("Add Miniature", systemImage: "plus")
                    }
                    
                    Button {
                        showingEditSheet = true
                    } label: {
                        Label("Edit Project", systemImage: "pencil")
                    }
                    
                    Divider()
                    
                    Button(role: .destructive) {
                        showingDeleteAlert = true
                    } label: {
                        Label("Delete Project", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showingEditSheet) {
            ProjectFormView(mode: .edit(project))
        }
        .sheet(isPresented: $showingAddMiniature) {
            MiniatureFormView(project: project, mode: .create)
        }
        .alert("Delete Project?", isPresented: $showingDeleteAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                deleteProject()
            }
        } message: {
            Text("This will delete the project and all its miniatures. This action cannot be undone.")
        }
    }
    
    // MARK: - Project Info Card
    
    private var projectInfoCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                GameSystemBadge(gameSystem: project.gameSystemEnum)
                Text(project.gameSystemEnum.displayName)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(project.name ?? "Unknown")
                    .font(.title2)
                    .fontWeight(.bold)
                Text(project.army ?? "")
                    .font(.headline)
                    .foregroundStyle(.secondary)
            }
            
            if let description = project.projectDescription, !description.isEmpty {
                Text(description)
                    .font(.body)
                    .foregroundStyle(.secondary)
            }
            
            HStack {
                Label("\(project.miniatureCount) miniatures", systemImage: "person.3.fill")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                
                Spacer()
                
                if let createdAt = project.createdAt {
                    Label("Created \(createdAt.formatted(date: .abbreviated, time: .omitted))", systemImage: "calendar")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding()
    }
    
    // MARK: - Progress Overview
    
    private var progressOverview: some View {
        VStack(spacing: 12) {
            // Overall progress
            HStack {
                Text("Overall Completion")
                Spacer()
                Text("\(Int(project.completionPercentage * 100))%")
                    .fontWeight(.semibold)
            }
            
            ProgressView(value: project.completionPercentage)
                .tint(.green)
            
            // Status breakdown
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                ForEach(ProgressStatus.allCases, id: \.self) { status in
                    HStack {
                        Circle()
                            .fill(status.color)
                            .frame(width: 8, height: 8)
                        Text(status.displayName)
                            .font(.caption)
                        Spacer()
                        Text("\(project.progressSummary[status] ?? 0)")
                            .font(.caption)
                            .fontWeight(.semibold)
                    }
                }
            }
        }
    }
    
    // MARK: - Empty State
    
    private var emptyMiniaturesState: some View {
        VStack(spacing: 12) {
            Image(systemName: "paintbrush.pointed")
                .font(.largeTitle)
                .foregroundStyle(.secondary)
            Text("No miniatures yet")
                .font(.headline)
            Text("Add your first miniature to start tracking")
                .font(.caption)
                .foregroundStyle(.secondary)
            
            Button("Add Miniature") {
                showingAddMiniature = true
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.small)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
    }
    
    // MARK: - Actions
    
    private func deleteMiniatures(at offsets: IndexSet) {
        for index in offsets {
            let miniature = project.miniaturesArray[index]
            viewContext.delete(miniature)
        }
        
        do {
            try viewContext.save()
        } catch {
            print("Error deleting miniature: \(error)")
        }
    }
    
    private func deleteProject() {
        viewContext.delete(project)
        
        do {
            try viewContext.save()
            dismiss()
        } catch {
            print("Error deleting project: \(error)")
        }
    }
}

// MARK: - Miniature Row View

struct MiniatureRowView: View {
    @ObservedObject var miniature: Miniature
    
    var body: some View {
        HStack(spacing: 12) {
            // Status indicator
            Circle()
                .fill(miniature.progressStatusEnum.color)
                .frame(width: 12, height: 12)
            
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(miniature.name ?? "Unknown")
                        .font(.headline)
                    
                    Image(systemName: miniature.miniatureTypeEnum.iconName)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                Text(miniature.progressStatusEnum.displayName)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            // Progress bar
            ProgressView(value: miniature.progressStatusEnum.progressPercentage)
                .frame(width: 50)
                .tint(miniature.progressStatusEnum.color)
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    NavigationStack {
        ProjectDetailView(project: Project())
    }
    .environment(\.managedObjectContext, CoreDataManager.shared.persistentContainer.viewContext)
}
