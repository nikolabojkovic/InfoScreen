import SwiftUI

struct IncomeFormSheet: View {
    @EnvironmentObject private var finance: FinanceService
    @Environment(\.dismiss) private var dismiss

    let existingRecord: IncomeRecord?

    @State private var selectedDate: Date
    @State private var amountText: String
    @State private var paymentMethod: String
    @State private var description: String
    @State private var isSaving = false
    @State private var errorMessage: String?

    init(existingRecord: IncomeRecord? = nil) {
        self.existingRecord = existingRecord
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        if let rec = existingRecord {
            _selectedDate  = State(initialValue: df.date(from: rec.date) ?? Date())
            _amountText    = State(initialValue: rec.amount.truncatingRemainder(dividingBy: 1) == 0
                                   ? String(Int(rec.amount))
                                   : String(format: "%.2f", rec.amount))
            _paymentMethod = State(initialValue: rec.paymentMethod)
            _description   = State(initialValue: rec.description)
        } else {
            _selectedDate  = State(initialValue: Date())
            _amountText    = State(initialValue: "")
            _paymentMethod = State(initialValue: "bank")
            _description   = State(initialValue: "")
        }
    }

    private var normalizedAmount: String { amountText.replacingOccurrences(of: ",", with: ".") }

    private var isValid: Bool {
        guard let amt = Double(normalizedAmount), amt > 0 else { return false }
        return !description.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Date") {
                    DatePicker("Date", selection: $selectedDate, displayedComponents: .date)
                        .datePickerStyle(.graphical)
                }

                Section("Amount (RSD)") {
                    TextField("0", text: $amountText)
                        .keyboardType(.decimalPad)
                }

                Section("Type") {
                    Picker("Type", selection: $paymentMethod) {
                        Text("Bank Account").tag("bank")
                        Text("Cash").tag("cash")
                        Text("Withdrawal").tag("withdrawal")
                    }
                    .pickerStyle(.segmented)
                    .listRowInsets(.init(top: 10, leading: 16, bottom: 10, trailing: 16))
                }

                Section("Description") {
                    TextField("Income description", text: $description)
                }
            }
            .navigationTitle(existingRecord == nil ? "Add Income" : "Edit Income")
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
            if existingRecord == nil {
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
        guard let amt = Double(normalizedAmount) else { return }
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        let dateStr = df.string(from: selectedDate)
        let desc    = description.trimmingCharacters(in: .whitespaces)

        isSaving = true
        defer { isSaving = false }

        do {
            if let rec = existingRecord {
                try await finance.updateIncomeRecord(
                    id: rec.id, date: dateStr, description: desc,
                    amount: amt, paymentMethod: paymentMethod
                )
            } else {
                try await finance.addIncomeRecord(
                    date: dateStr, description: desc,
                    amount: amt, paymentMethod: paymentMethod
                )
            }
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    IncomeFormSheet()
        .environmentObject(FinanceService.shared)
}
