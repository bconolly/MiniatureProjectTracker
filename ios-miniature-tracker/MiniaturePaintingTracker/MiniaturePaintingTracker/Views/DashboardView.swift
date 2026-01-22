//
//  DashboardView.swift
//  MiniaturePaintingTracker
//
//  Created on 22/1/2026.
//

import SwiftUI
import CoreData

struct DashboardView: View {
    @Environment(\.managedObjectContext) private var viewContext
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Project.createdAt, ascending: false)],
        animation: .default)
    private var projects: FetchedResults<Project>
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Miniature.updatedAt, ascending: false)],
        animation: .default)
    private var miniatures: FetchedResults<Miniature>
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Welcome Header
                    welcomeHeader
                    
                    // Quick Stats
                    statsSection
                    
                    // Progress Overview
                    progressOverview
                    
                    // Recent Activity
                    recentActivitySection
                }
                .padding()
            }
            .navigationTitle("Dashboard")
            .background(Color(.systemGroupedBackground))
        }
    }
    
    // MARK: - Welcome Header
    
    private var welcomeHeader: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Welcome to")
                .font(.title2)
                .foregroundStyle(.secondary)
            Text("Miniature Painting Tracker")
                .font(.largeTitle)
                .fontWeight(.bold)
            Text("Track your hobby progress and painting recipes")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
    
    // MARK: - Stats Section
    
    private var statsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Stats")
                .font(.headline)
                .padding(.horizontal)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                StatCard(
                    title: "Projects",
                    value: "\(projects.count)",
                    icon: "folder.fill",
                    color: .blue
                )
                
                StatCard(
                    title: "Miniatures",
                    value: "\(miniatures.count)",
                    icon: "person.3.fill",
                    color: .purple
                )
                
                StatCard(
                    title: "Completed",
                    value: "\(completedCount)",
                    icon: "checkmark.circle.fill",
                    color: .green
                )
                
                StatCard(
                    title: "In Progress",
                    value: "\(inProgressCount)",
                    icon: "paintbrush.fill",
                    color: .orange
                )
            }
        }
    }
    
    // MARK: - Progress Overview
    
    private var progressOverview: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Progress Overview")
                .font(.headline)
                .padding(.horizontal)
            
            VStack(spacing: 8) {
                ForEach(ProgressStatus.allCases, id: \.self) { status in
                    ProgressRow(
                        status: status,
                        count: countForStatus(status),
                        total: miniatures.count
                    )
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }
    
    // MARK: - Recent Activity
    
    private var recentActivitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Activity")
                .font(.headline)
                .padding(.horizontal)
            
            if recentMiniatures.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "paintbrush.pointed")
                        .font(.largeTitle)
                        .foregroundStyle(.secondary)
                    Text("No miniatures yet")
                        .foregroundStyle(.secondary)
                    Text("Add a project and start tracking your painting progress!")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16))
            } else {
                VStack(spacing: 0) {
                    ForEach(recentMiniatures) { miniature in
                        RecentMiniatureRow(miniature: miniature)
                        if miniature != recentMiniatures.last {
                            Divider()
                        }
                    }
                }
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16))
            }
        }
    }
    
    // MARK: - Computed Properties
    
    private var completedCount: Int {
        miniatures.filter { $0.progressStatusEnum == .completed }.count
    }
    
    private var inProgressCount: Int {
        miniatures.filter { $0.progressStatusEnum != .unpainted && $0.progressStatusEnum != .completed }.count
    }
    
    private var recentMiniatures: [Miniature] {
        Array(miniatures.prefix(5))
    }
    
    private func countForStatus(_ status: ProgressStatus) -> Int {
        miniatures.filter { $0.progressStatusEnum == status }.count
    }
}

// MARK: - Stat Card

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundStyle(color)
                Spacer()
            }
            
            Text(value)
                .font(.title)
                .fontWeight(.bold)
            
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Progress Row

struct ProgressRow: View {
    let status: ProgressStatus
    let count: Int
    let total: Int
    
    var percentage: Double {
        guard total > 0 else { return 0 }
        return Double(count) / Double(total)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: status.iconName)
                    .foregroundStyle(status.color)
                Text(status.displayName)
                    .font(.subheadline)
                Spacer()
                Text("\(count)")
                    .font(.subheadline)
                    .fontWeight(.semibold)
            }
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(.systemGray5))
                        .frame(height: 6)
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(status.color)
                        .frame(width: geometry.size.width * percentage, height: 6)
                }
            }
            .frame(height: 6)
        }
    }
}

// MARK: - Recent Miniature Row

struct RecentMiniatureRow: View {
    let miniature: Miniature
    
    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(miniature.progressStatusEnum.color)
                .frame(width: 8, height: 8)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(miniature.name ?? "Unknown")
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                if let project = miniature.project {
                    Text(project.name ?? "Unknown Project")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            
            Spacer()
            
            Text(miniature.progressStatusEnum.displayName)
                .font(.caption)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(miniature.progressStatusEnum.color.opacity(0.2))
                .foregroundStyle(miniature.progressStatusEnum.color)
                .clipShape(Capsule())
        }
        .padding()
    }
}

#Preview {
    DashboardView()
        .environment(\.managedObjectContext, CoreDataManager.shared.persistentContainer.viewContext)
}
