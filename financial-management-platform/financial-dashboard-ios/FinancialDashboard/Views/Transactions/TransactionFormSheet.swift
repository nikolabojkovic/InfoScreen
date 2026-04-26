import SwiftUI

struct TransactionFormSheet: View {
    @EnvironmentObject private var finance: FinanceService
    @Environment(\.dismiss) private var dismiss

    let existingTransaction: Transaction?

    @State private var selectedDate: Date
    @State private var selectedCategoryId: Int?
    @State private var paymentMethod: String
    @State private var amountText: String
    @State private var description: String
    @State private var isSaving = false
    @State private var errorMessage: String?

    init(existingTransaction: Transaction? = nil) {
        self.existingTransaction = existingTransaction
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        if let tx = existingTransaction {
            _selectedDate        = State(initialValue: df.date(from: tx.date) ?? Date())
            _selectedCategoryId  = State(initialValue: tx.categoryId)
            _paymentMethod       = State(initialValue: tx.paymentMethod)
            _amountText          = State(initialValue: tx.amount.truncatingRemainder(dividingBy: 1) == 0
                                        ? String(Int(tx.amount))
                                        : String(format: "%.2f", tx.amount))
            _description         = State(initialValue: tx.description)
        } else {
            _selectedDate        = State(initialValue: Date())
            _selectedCategoryId  = State(initialValue: nil)
            _paymentMethod       = State(initialValue: "bank")
            _amountText          = State(initialValue: "")
            _description         = State(initialValue: "")
        }
    }

    private var normalizedAmount: String { amountText.replacingOccurrences(of: ",", with: ".") }

    private var isValid: Bool {
        guard let amt = Double(normalizedAmount), amt > 0 else { return false }
        return selectedCategoryId != nil && !description.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Date") {
                    DatePicker("Date", selection: $selectedDate, displayedComponents: .date)
                        .datePickerStyle(.graphical)
                }

                Section("Category") {
                    if finance.categories.isEmpty {
                        Text("No categories — add one first")
                            .foregroundStyle(.secondary)
                    } else {
                        Picker("Category", selection: $selectedCategoryId) {
                            Text("Select category").tag(nil as Int?)
                            ForEach(finance.categories) { cat in
                                Text("\(cat.icon)  \(cat.name)").tag(cat.id as Int?)
                            }
                        }
                        .pickerStyle(.navigationLink)
                    }
                }

                Section("Payment Method") {
                    Picker("Payment Method", selection: $paymentMethod) {
                        Text("Bank Account").tag("bank")
                        Text("Cash").tag("cash")
                    }
                    .pickerStyle(.segmented)
                    .listRowInsets(.init(top: 10, leading: 16, bottom: 10, trailing: 16))
                }

                Section("Amount (RSD)") {
                    TextField("0", text: $amountText)
                        .keyboardType(.decimalPad)
                }

                Section("Description") {
                    TextField("What was this for?", text: $description)
                }
            }
            .navigationTitle(existingTransaction == nil ? "Add Transaction" : "Edit Transaction")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { Task { await save() } }
                        .disabled(!isValid || isSaving)
                }
            }
            .alert("Error", isPresented: Binding(
                get: { errorMessage != nil },
                set: { if !$0 { errorMessage = nil } }
            )) {
                Button("OK") { errorMessage = nil }
            } message: { Text(errorMessage ?? "") }
        }
        .onAppear {
            // Default to smart date when adding a new transaction
            if existingTransaction == nil {
                let cal = Calendar.current
                let now = Date()
                if finance.selectedMonth == cal.component(.month, from: now),
                   finance.selectedYear  == cal.component(.year,  from: now) {
                    selectedDate = now
                } else {
                    var comps = DateComponents()
                    comps.year = finance.selectedYear
                    comps.month = finance.selectedMonth
                    comps.day = 1
                    selectedDate = cal.date(from: comps) ?? now
                }
            }
        }
    }

    private func save() async {
        guard let amt = Double(normalizedAmount), let catId = selectedCategoryId else { return }
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        let dateStr = df.string(from: selectedDate)
        let desc    = description.trimmingCharacters(in: .whitespaces)

        isSaving = true
        defer { isSaving = false }

        do {
            if let tx = existingTransaction {
                try await finance.updateTransaction(
                    id: tx.id, date: dateStr, description: desc,
                    categoryId: catId, amount: amt, paymentMethod: paymentMethod
                )
            } else {
                try await finance.addTransaction(
                    date: dateStr, description: desc,
                    categoryId: catId, amount: amt, paymentMethod: paymentMethod
                )
            }
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    TransactionFormSheet()
        .environmentObject(FinanceService.shared)
}
