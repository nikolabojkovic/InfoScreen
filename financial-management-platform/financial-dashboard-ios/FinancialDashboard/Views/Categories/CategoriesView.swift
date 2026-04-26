import SwiftUI

struct CategoriesView: View {
    @EnvironmentObject private var finance: FinanceService

    @State private var showAddSheet = false
    @State private var editingCategory: Category? = nil
    @State private var deletingCategory: Category? = nil
    @State private var showSaveTemplateConfirm = false
    @State private var showRestoreConfirm = false
    @State private var editMode: EditMode = .inactive
    @State private var errorMessage: String?

    private var hasTemplate: Bool {
        !(finance.templateCategories?.isEmpty ?? true)
    }

    var body: some View {
        NavigationStack {
            Group {
                if finance.isLoading && finance.categories.isEmpty {
                    ProgressView("Loading categories…")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    categoryList
                }
            }
            .navigationTitle("Categories")
            .toolbar { toolbarContent }
            .environment(\.editMode, $editMode)
            // Sheets
            .sheet(isPresented: $showAddSheet) {
                CategoryFormSheet()
                    .environmentObject(finance)
            }
            .sheet(item: $editingCategory) { cat in
                CategoryFormSheet(existingCategory: cat)
                    .environmentObject(finance)
            }
            // Delete confirmation
            .confirmationDialog(
                "Delete \"\(deletingCategory?.name ?? "")\"?",
                isPresented: Binding(get: { deletingCategory != nil }, set: { if !$0 { deletingCategory = nil } }),
                titleVisibility: .visible
            ) {
                Button("Delete", role: .destructive) {
                    guard let cat = deletingCategory else { return }
                    deletingCategory = nil
                    Task { try? await finance.deleteCategory(id: cat.id) }
                }
                Button("Cancel", role: .cancel) { deletingCategory = nil }
            } message: {
                Text("This will permanently delete the category.")
            }
            // Save template confirmation
            .confirmationDialog(
                hasTemplate ? "Overwrite Template?" : "Save as Template?",
                isPresented: $showSaveTemplateConfirm,
                titleVisibility: .visible
            ) {
                Button(hasTemplate ? "Overwrite" : "Save") {
                    Task {
                        do { try await finance.saveAsTemplate() }
                        catch { errorMessage = error.localizedDescription }
                    }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                if hasTemplate { Text("This will overwrite the existing template.") }
            }
            // Restore template confirmation
            .confirmationDialog(
                "Restore from Template?",
                isPresented: $showRestoreConfirm,
                titleVisibility: .visible
            ) {
                Button("Restore") {
                    Task {
                        do { try await finance.restoreFromTemplate() }
                        catch { errorMessage = error.localizedDescription }
                    }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Template categories will be added to the current month. Existing categories are kept.")
            }
            // Error alert
            .alert("Error", isPresented: Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })) {
                Button("OK") { errorMessage = nil }
            } message: {
                Text(errorMessage ?? "")
            }
            .task { await loadData() }
            .onChange(of: finance.selectedMonth) { _, _ in Task { await loadData() } }
            .onChange(of: finance.selectedYear)  { _, _ in Task { await loadData() } }
            .refreshable { await loadData() }
        }
    }

    // MARK: - Category list

    private var categoryList: some View {
        List {
            if finance.categories.isEmpty {
                ContentUnavailableView(
                    "No Categories",
                    systemImage: "tag",
                    description: Text("Tap + to add your first category")
                )
            } else {
                ForEach(finance.categories) { cat in
                    CategoryRow(category: cat)
                        .contentShape(Rectangle())
                        .onTapGesture {
                            if editMode == .inactive {
                                editingCategory = cat
                            }
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                            Button(role: .destructive) {
                                deletingCategory = cat
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                            Button {
                                editingCategory = cat
                            } label: {
                                Label("Edit", systemImage: "pencil")
                            }
                            .tint(.blue)
                        }
                }
                .onMove { from, to in
                    var cats = finance.categories
                    cats.move(fromOffsets: from, toOffset: to)
                    Task { try? await finance.reorderCategories(cats.map(\.id)) }
                }
            }
        }
        .listStyle(.insetGrouped)
    }

    // MARK: - Toolbar

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        // Month navigator (leading)
        ToolbarItem(placement: .topBarLeading) {
            MonthNavigator(finance: finance)
        }

        // Actions menu + Add (trailing)
        ToolbarItemGroup(placement: .topBarTrailing) {
            Menu {
                Button {
                    withAnimation { editMode = editMode == .active ? .inactive : .active }
                } label: {
                    Label(
                        editMode == .active ? "Done Reordering" : "Reorder",
                        systemImage: editMode == .active ? "checkmark" : "arrow.up.arrow.down"
                    )
                }
                .disabled(finance.categories.count < 2)

                Divider()

                Button {
                    showSaveTemplateConfirm = true
                } label: {
                    Label("Save as Template", systemImage: "square.and.arrow.down")
                }
                .disabled(finance.categories.isEmpty)

                Button {
                    showRestoreConfirm = true
                } label: {
                    Label("Restore from Template", systemImage: "square.and.arrow.up")
                }
                .disabled(!hasTemplate)
            } label: {
                Image(systemName: "ellipsis.circle")
            }

            Button {
                showAddSheet = true
            } label: {
                Image(systemName: "plus")
            }
        }
    }

    // MARK: - Data loading

    private func loadData() async {
        do {
            async let cats: () = finance.loadCategories()
            async let tmpl: () = finance.loadTemplate()
            try await cats
            try await tmpl
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// MARK: - Category row

private struct CategoryRow: View {
    let category: Category

    var body: some View {
        HStack(spacing: 12) {
            Text(category.icon)
                .font(.title2)
                .frame(width: 38, height: 38)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 2) {
                Text(category.name)
                    .font(.body)
                    .fontWeight(.medium)

                if !category.items.isEmpty {
                    Text("\(category.items.count) item\(category.items.count == 1 ? "" : "s")")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(category.budgetAmount.formatted(.number.precision(.fractionLength(2))) + " RSD")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.primary)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Month navigator

private struct MonthNavigator: View {
    @ObservedObject var finance: FinanceService

    var body: some View {
        HStack(spacing: 2) {
            Button { finance.decrementMonth() } label: {
                Image(systemName: "chevron.left")
                    .imageScale(.small)
            }
            .buttonStyle(.plain)

            Text(finance.monthYearString)
                .font(.subheadline)
                .fontWeight(.medium)
                .frame(minWidth: 110)
                .lineLimit(1)

            Button { finance.incrementMonth() } label: {
                Image(systemName: "chevron.right")
                    .imageScale(.small)
            }
            .buttonStyle(.plain)
        }
    }
}

#Preview {
    CategoriesView()
        .environmentObject(FinanceService.shared)
}
