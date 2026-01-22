//
//  RecipeDetailView.swift
//  MiniaturePaintingTracker
//
//  Created on 22/1/2026.
//

import SwiftUI
import CoreData

struct RecipeDetailView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss
    
    @ObservedObject var recipe: Recipe
    
    @State private var showingEditSheet = false
    @State private var showingDeleteAlert = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header Card
                headerCard
                
                // Steps Section
                if !recipe.steps.isEmpty {
                    stepsSection
                }
                
                // Paints Section
                if !recipe.paintsUsed.isEmpty {
                    paintsSection
                }
                
                // Techniques Section
                if !recipe.techniques.isEmpty {
                    techniquesSection
                }
                
                // Notes Section
                if let notes = recipe.notes, !notes.isEmpty {
                    notesSection(notes)
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle(recipe.name ?? "Recipe")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    Button {
                        showingEditSheet = true
                    } label: {
                        Label("Edit Recipe", systemImage: "pencil")
                    }
                    
                    Divider()
                    
                    Button(role: .destructive) {
                        showingDeleteAlert = true
                    } label: {
                        Label("Delete Recipe", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showingEditSheet) {
            RecipeFormView(mode: .edit(recipe))
        }
        .alert("Delete Recipe?", isPresented: $showingDeleteAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                deleteRecipe()
            }
        } message: {
            Text("This action cannot be undone.")
        }
    }
    
    // MARK: - Header Card
    
    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: recipe.miniatureTypeEnum.iconName)
                    .font(.title2)
                    .foregroundStyle(.blue)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(recipe.name ?? "Unknown")
                        .font(.title2)
                        .fontWeight(.bold)
                    Text("\(recipe.miniatureTypeEnum.displayName) Recipe")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
            }
            
            Divider()
            
            HStack(spacing: 20) {
                StatItem(title: "Steps", value: "\(recipe.stepCount)", icon: "list.number")
                StatItem(title: "Paints", value: "\(recipe.paintCount)", icon: "paintpalette.fill")
                StatItem(title: "Techniques", value: "\(recipe.techniqueCount)", icon: "wand.and.stars")
            }
            
            if let createdAt = recipe.createdAt {
                HStack {
                    Label("Created \(createdAt.formatted(date: .abbreviated, time: .omitted))", systemImage: "calendar")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                    
                    Spacer()
                    
                    if let updatedAt = recipe.updatedAt {
                        Label("Updated \(updatedAt.formatted(date: .abbreviated, time: .omitted))", systemImage: "clock")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
    
    // MARK: - Steps Section
    
    private var stepsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "list.number")
                    .foregroundStyle(.blue)
                Text("Steps")
                    .font(.headline)
            }
            
            VStack(alignment: .leading, spacing: 0) {
                ForEach(Array(recipe.steps.enumerated()), id: \.offset) { index, step in
                    StepRow(stepNumber: index + 1, stepText: step, isLast: index == recipe.steps.count - 1)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
    
    // MARK: - Paints Section
    
    private var paintsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "paintpalette.fill")
                    .foregroundStyle(.purple)
                Text("Paints Used")
                    .font(.headline)
            }
            
            FlowLayout(spacing: 8) {
                ForEach(recipe.paintsUsed, id: \.self) { paint in
                    PaintChip(name: paint)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
    
    // MARK: - Techniques Section
    
    private var techniquesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "wand.and.stars")
                    .foregroundStyle(.orange)
                Text("Techniques")
                    .font(.headline)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                ForEach(recipe.techniques, id: \.self) { technique in
                    HStack(spacing: 12) {
                        Image(systemName: "paintbrush.pointed.fill")
                            .font(.caption)
                            .foregroundStyle(.orange)
                        Text(technique)
                            .font(.subheadline)
                        Spacer()
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
    
    // MARK: - Notes Section
    
    private func notesSection(_ notes: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "note.text")
                    .foregroundStyle(.green)
                Text("Notes")
                    .font(.headline)
            }
            
            Text(notes)
                .font(.body)
                .foregroundStyle(.secondary)
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
    
    // MARK: - Actions
    
    private func deleteRecipe() {
        viewContext.delete(recipe)
        
        do {
            try viewContext.save()
            dismiss()
        } catch {
            print("Error deleting recipe: \(error)")
        }
    }
}

// MARK: - Stat Item

struct StatItem: View {
    let title: String
    let value: String
    let icon: String
    
    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Step Row

struct StepRow: View {
    let stepNumber: Int
    let stepText: String
    let isLast: Bool
    
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            ZStack {
                Circle()
                    .fill(Color.blue)
                    .frame(width: 28, height: 28)
                Text("\(stepNumber)")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(stepText)
                    .font(.subheadline)
                
                if !isLast {
                    Rectangle()
                        .fill(Color(.systemGray4))
                        .frame(width: 2, height: 16)
                        .padding(.leading, 13)
                }
            }
            
            Spacer()
        }
    }
}

// MARK: - Paint Chip

struct PaintChip: View {
    let name: String
    
    var body: some View {
        Text(name)
            .font(.caption)
            .fontWeight(.medium)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.purple.opacity(0.15))
            .foregroundStyle(.purple)
            .clipShape(Capsule())
    }
}

// MARK: - Flow Layout

struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = layout(proposal: proposal, subviews: subviews)
        return result.size
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = layout(proposal: proposal, subviews: subviews)
        
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.positions[index].x,
                                       y: bounds.minY + result.positions[index].y),
                         proposal: .unspecified)
        }
    }
    
    private func layout(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, positions: [CGPoint]) {
        var positions: [CGPoint] = []
        var currentX: CGFloat = 0
        var currentY: CGFloat = 0
        var lineHeight: CGFloat = 0
        var maxWidth: CGFloat = 0
        
        let maxProposedWidth = proposal.width ?? .infinity
        
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            
            if currentX + size.width > maxProposedWidth && currentX > 0 {
                currentX = 0
                currentY += lineHeight + spacing
                lineHeight = 0
            }
            
            positions.append(CGPoint(x: currentX, y: currentY))
            
            lineHeight = max(lineHeight, size.height)
            currentX += size.width + spacing
            maxWidth = max(maxWidth, currentX)
        }
        
        return (CGSize(width: maxWidth, height: currentY + lineHeight), positions)
    }
}

#Preview {
    NavigationStack {
        RecipeDetailView(recipe: Recipe())
    }
    .environment(\.managedObjectContext, CoreDataManager.shared.persistentContainer.viewContext)
}
