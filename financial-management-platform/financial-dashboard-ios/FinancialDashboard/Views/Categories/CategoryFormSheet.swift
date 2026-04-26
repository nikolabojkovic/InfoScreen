import SwiftUI

// MARK: - Editable item (local form model)

struct EditableItem: Identifiable {
    var id = UUID()
    var apiId: Int?             // existing item id for updates
    var description: String = ""
    var amountText: String = ""

    var parsedAmount: Double { Double(amountText.replacingOccurrences(of: ",", with: ".")) ?? 0 }
    var isValid: Bool { !description.trimmingCharacters(in: .whitespaces).isEmpty && parsedAmount > 0 }
}

// MARK: - Shared form sheet (add & edit)

struct CategoryFormSheet: View {
    /// Pass `nil` for "Add" mode; pass an existing category for "Edit" mode.
    let existingCategory: Category?

    @EnvironmentObject private var finance: FinanceService
    @Environment(\.dismiss) private var dismiss

    @State private var name: String
    @State private var icon: String
    @State private var items: [EditableItem]
    @State private var showIconPicker = false
    @State private var isLoading = false
    @State private var errorMessage: String?

    init(existingCategory: Category? = nil) {
        self.existingCategory = existingCategory
        _name  = State(initialValue: existingCategory?.name ?? "")
        _icon  = State(initialValue: existingCategory?.icon ?? "📦")
        _items = State(initialValue: existingCategory?.items.map {
            EditableItem(apiId: $0.id, description: $0.description, amountText: formatAmount($0.amount))
        } ?? [])
    }

    private var isFormValid: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
            && !items.isEmpty
            && items.allSatisfy(\.isValid)
    }

    var body: some View {
        NavigationStack {
            Form {
                // ── Name & icon ───────────────────────────────────────────
                Section {
                    HStack(spacing: 12) {
                        Button {
                            showIconPicker = true
                        } label: {
                            Text(icon)
                                .font(.title)
                                .frame(width: 48, height: 48)
                                .background(Color(.secondarySystemBackground))
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                        .buttonStyle(.plain)

                        VStack(alignment: .leading, spacing: 2) {
                            Text("Name")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            TextField("Category name", text: $name)
                                .font(.body)
                        }
                    }
                    .padding(.vertical, 4)
                } header: {
                    Text("Category")
                }

                // ── Budget items ──────────────────────────────────────────
                Section {
                    ForEach($items) { $item in
                        HStack(spacing: 8) {
                            TextField("Description", text: $item.description)
                                .frame(maxWidth: .infinity)

                            TextField("Amount", text: $item.amountText)
                                .keyboardType(.decimalPad)
                                .frame(width: 80)
                                .multilineTextAlignment(.trailing)
                        }
                    }
                    .onDelete { indices in items.remove(atOffsets: indices) }

                    Button {
                        items.append(EditableItem())
                    } label: {
                        Label("Add Item", systemImage: "plus.circle.fill")
                    }
                } header: {
                    HStack {
                        Text("Budget Items")
                        Spacer()
                        if !items.isEmpty {
                            let total = items.reduce(0.0) { $0 + $1.parsedAmount }
                            Text(total.formatted(.number.precision(.fractionLength(2))) + " RSD")
                                .foregroundStyle(.secondary)
                                .font(.caption)
                        }
                    }
                } footer: {
                    if items.isEmpty {
                        Text("Add at least one budget item.")
                            .foregroundStyle(.red.opacity(0.8))
                    }
                }

                // ── Error banner ──────────────────────────────────────────
                if let error = errorMessage {
                    Section {
                        Label(error, systemImage: "exclamationmark.circle.fill")
                            .foregroundStyle(.red)
                            .font(.footnote)
                    }
                }
            }
            .navigationTitle(existingCategory == nil ? "Add Category" : "Edit Category")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .disabled(isLoading)
                }
                ToolbarItem(placement: .confirmationAction) {
                    if isLoading {
                        ProgressView()
                    } else {
                        Button("Save", action: save)
                            .disabled(!isFormValid)
                            .fontWeight(.semibold)
                    }
                }
            }
            .sheet(isPresented: $showIconPicker) {
                IconPickerView(selectedIcon: $icon)
            }
        }
    }

    // MARK: - Save

    private func save() {
        isLoading = true
        errorMessage = nil
        Task {
            do {
                if let existing = existingCategory {
                    let updateItems = items.map {
                        UpdateCategoryItemRequest(id: $0.apiId, description: $0.description, amount: $0.parsedAmount)
                    }
                    try await finance.updateCategory(
                        id: existing.id,
                        name: name.trimmingCharacters(in: .whitespaces),
                        icon: icon,
                        items: updateItems
                    )
                } else {
                    let createItems = items.map {
                        CreateCategoryItemRequest(description: $0.description, amount: $0.parsedAmount)
                    }
                    try await finance.addCategory(
                        name: name.trimmingCharacters(in: .whitespaces),
                        icon: icon,
                        items: createItems
                    )
                }
                dismiss()
            } catch let e as APIError {
                errorMessage = e.errorDescription
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

// MARK: - Helpers

private func formatAmount(_ value: Double) -> String {
    value == value.rounded() && !value.truncatingRemainder(dividingBy: 1).isNormal
        ? String(Int(value))
        : String(value)
}
