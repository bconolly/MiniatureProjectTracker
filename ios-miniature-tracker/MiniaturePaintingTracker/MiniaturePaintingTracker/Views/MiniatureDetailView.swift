//
//  MiniatureDetailView.swift
//  MiniaturePaintingTracker
//
//  Created on 22/1/2026.
//

import SwiftUI
import CoreData
import PhotosUI

struct MiniatureDetailView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss
    
    @ObservedObject var miniature: Miniature
    
    @State private var showingEditSheet = false
    @State private var showingDeleteAlert = false
    @State private var showingPhotoOptions = false
    @State private var showingImagePicker = false
    @State private var showingCamera = false
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var selectedPhoto: Photo?
    @State private var showingPhotoDetail = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Info Card
                infoCard
                
                // Progress Tracker
                progressSection
                
                // Photo Gallery
                photoSection
                
                // Notes Section
                if let notes = miniature.notes, !notes.isEmpty {
                    notesSection(notes)
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle(miniature.name ?? "Miniature")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    Button {
                        showingEditSheet = true
                    } label: {
                        Label("Edit Miniature", systemImage: "pencil")
                    }
                    
                    Divider()
                    
                    Button(role: .destructive) {
                        showingDeleteAlert = true
                    } label: {
                        Label("Delete Miniature", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showingEditSheet) {
            if let project = miniature.project {
                MiniatureFormView(project: project, mode: .edit(miniature))
            }
        }
        .alert("Delete Miniature?", isPresented: $showingDeleteAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                deleteMiniature()
            }
        } message: {
            Text("This will delete the miniature and all its photos. This action cannot be undone.")
        }
        .confirmationDialog("Add Photo", isPresented: $showingPhotoOptions) {
            Button("Take Photo") {
                showingCamera = true
            }
            Button("Choose from Library") {
                showingImagePicker = true
            }
            Button("Cancel", role: .cancel) { }
        }
        .photosPicker(isPresented: $showingImagePicker, selection: $selectedPhotoItem, matching: .images)
        .onChange(of: selectedPhotoItem) { oldValue, newValue in
            if let item = newValue {
                loadPhoto(from: item)
            }
        }
        .fullScreenCover(isPresented: $showingCamera) {
            CameraView { image in
                savePhoto(image)
            }
        }
        .fullScreenCover(item: $selectedPhoto) { photo in
            PhotoDetailView(photo: photo)
                .environment(\.managedObjectContext, viewContext)
        }
    }
    
    // MARK: - Info Card
    
    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: miniature.miniatureTypeEnum.iconName)
                    .font(.title2)
                    .foregroundStyle(.secondary)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(miniature.name ?? "Unknown")
                        .font(.title2)
                        .fontWeight(.bold)
                    Text(miniature.miniatureTypeEnum.displayName)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                StatusBadge(status: miniature.progressStatusEnum)
            }
            
            Divider()
            
            if let project = miniature.project {
                HStack {
                    Label(project.name ?? "Unknown Project", systemImage: "folder.fill")
                        .font(.subheadline)
                    Spacer()
                    GameSystemBadge(gameSystem: project.gameSystemEnum)
                }
                .foregroundStyle(.secondary)
            }
            
            HStack {
                if let createdAt = miniature.createdAt {
                    Label("Created \(createdAt.formatted(date: .abbreviated, time: .omitted))", systemImage: "calendar")
                        .font(.caption)
                }
                
                Spacer()
                
                if let updatedAt = miniature.updatedAt {
                    Label("Updated \(updatedAt.formatted(date: .abbreviated, time: .omitted))", systemImage: "clock")
                        .font(.caption)
                }
            }
            .foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
    
    // MARK: - Progress Section
    
    private var progressSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Progress")
                .font(.headline)
            
            VStack(spacing: 16) {
                // Progress bar
                VStack(spacing: 8) {
                    HStack {
                        Text(miniature.progressStatusEnum.displayName)
                            .fontWeight(.semibold)
                        Spacer()
                        Text("\(Int(miniature.progressStatusEnum.progressPercentage * 100))%")
                            .foregroundStyle(.secondary)
                    }
                    
                    ProgressView(value: miniature.progressStatusEnum.progressPercentage)
                        .tint(miniature.progressStatusEnum.color)
                }
                
                // Status buttons
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    ForEach(ProgressStatus.allCases, id: \.self) { status in
                        ProgressStatusButton(
                            status: status,
                            isSelected: miniature.progressStatusEnum == status
                        ) {
                            updateProgress(to: status)
                        }
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
    
    // MARK: - Photo Section
    
    private var photoSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Photos")
                    .font(.headline)
                Spacer()
                Button {
                    showingPhotoOptions = true
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                }
            }
            
            if miniature.photosArray.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "photo.on.rectangle.angled")
                        .font(.largeTitle)
                        .foregroundStyle(.secondary)
                    Text("No photos yet")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Text("Add photos to track your painting progress")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                    
                    Button("Add Photo") {
                        showingPhotoOptions = true
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 30)
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            } else {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                    ForEach(miniature.photosArray) { photo in
                        PhotoThumbnailView(photo: photo)
                            .onTapGesture {
                                selectedPhoto = photo
                            }
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
    }
    
    // MARK: - Notes Section
    
    private func notesSection(_ notes: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Notes")
                .font(.headline)
            
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
    
    private func updateProgress(to status: ProgressStatus) {
        miniature.progressStatusEnum = status
        
        do {
            try viewContext.save()
        } catch {
            print("Error updating progress: \(error)")
        }
    }
    
    private func deleteMiniature() {
        viewContext.delete(miniature)
        
        do {
            try viewContext.save()
            dismiss()
        } catch {
            print("Error deleting miniature: \(error)")
        }
    }
    
    private func loadPhoto(from item: PhotosPickerItem) {
        Task {
            guard let data = try? await item.loadTransferable(type: Data.self),
                  let uiImage = UIImage(data: data) else { return }
            
            await MainActor.run {
                savePhoto(uiImage)
            }
        }
    }
    
    private func savePhoto(_ image: UIImage) {
        guard let data = image.jpegData(compressionQuality: 0.8) else { return }
        
        // Save to documents directory
        let filename = Photo.generateUniqueFilename(withExtension: "jpg")
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(filename)
        
        do {
            try data.write(to: fileURL)
            
            _ = Photo.create(
                in: viewContext,
                filename: filename,
                filePath: filename,
                fileSize: Int64(data.count),
                mimeType: "image/jpeg",
                miniature: miniature
            )
            
            try viewContext.save()
        } catch {
            print("Error saving photo: \(error)")
        }
    }
}

// MARK: - Status Badge

struct StatusBadge: View {
    let status: ProgressStatus
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: status.iconName)
            Text(status.displayName)
        }
        .font(.caption)
        .fontWeight(.medium)
        .foregroundStyle(status.color)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(status.color.opacity(0.15))
        .clipShape(Capsule())
    }
}

// MARK: - Progress Status Button

struct ProgressStatusButton: View {
    let status: ProgressStatus
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: status.iconName)
                    .font(.title3)
                Text(status.displayName)
                    .font(.caption2)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(isSelected ? status.color.opacity(0.2) : Color(.systemGray6))
            .foregroundStyle(isSelected ? status.color : .secondary)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(isSelected ? status.color : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Photo Thumbnail View

struct PhotoThumbnailView: View {
    let photo: Photo
    
    var body: some View {
        Group {
            if photo.fileExists, let uiImage = UIImage(contentsOfFile: photo.fileURL.path) {
                Image(uiImage: uiImage)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } else {
                Rectangle()
                    .fill(Color(.systemGray4))
                    .overlay {
                        Image(systemName: "photo")
                            .foregroundStyle(.secondary)
                    }
            }
        }
        .frame(height: 100)
        .clipped()
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .contentShape(Rectangle())
    }
}

// MARK: - Photo Detail View

struct PhotoDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.managedObjectContext) private var viewContext
    
    let photo: Photo
    @State private var showingDeleteAlert = false
    @State private var loadedImage: UIImage?
    
    var body: some View {
        NavigationStack {
            VStack {
                Spacer()
                
                if let image = loadedImage {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .padding()
                } else {
                    VStack(spacing: 16) {
                        Image(systemName: "photo.badge.exclamationmark")
                            .font(.system(size: 60))
                            .foregroundStyle(.gray)
                        Text("Photo not found")
                            .foregroundStyle(.gray)
                        Text(photo.filePath ?? "No path")
                            .font(.caption2)
                            .foregroundStyle(.gray)
                    }
                }
                
                Spacer()
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.black)
            .navigationTitle("Photo")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .primaryAction) {
                    Button(role: .destructive) {
                        showingDeleteAlert = true
                    } label: {
                        Image(systemName: "trash")
                            .foregroundStyle(.red)
                    }
                }
            }
            .alert("Delete Photo?", isPresented: $showingDeleteAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    deletePhoto()
                }
            } message: {
                Text("This photo will be permanently deleted.")
            }
        }
        .onAppear {
            loadImage()
        }
    }
    
    private func loadImage() {
        guard let filePath = photo.filePath else { return }
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsPath.appendingPathComponent(filePath)
        
        if FileManager.default.fileExists(atPath: fileURL.path),
           let image = UIImage(contentsOfFile: fileURL.path) {
            loadedImage = image
        }
    }
    
    private func deletePhoto() {
        // Delete file from disk
        if let filePath = photo.filePath {
            let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let fileURL = documentsPath.appendingPathComponent(filePath)
            try? FileManager.default.removeItem(at: fileURL)
        }
        
        viewContext.delete(photo)
        
        do {
            try viewContext.save()
            dismiss()
        } catch {
            print("Error deleting photo: \(error)")
        }
    }
}

// MARK: - Camera View

struct CameraView: UIViewControllerRepresentable {
    let onCapture: (UIImage) -> Void
    @Environment(\.dismiss) private var dismiss
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraView
        
        init(_ parent: CameraView) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.onCapture(image)
            }
            parent.dismiss()
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}

#Preview {
    NavigationStack {
        MiniatureDetailView(miniature: Miniature())
    }
    .environment(\.managedObjectContext, CoreDataManager.shared.persistentContainer.viewContext)
}
