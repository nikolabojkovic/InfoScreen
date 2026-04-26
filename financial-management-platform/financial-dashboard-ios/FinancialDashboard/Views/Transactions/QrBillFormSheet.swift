import SwiftUI

// MARK: - QR Bill review + save sheet

struct QrBillFormSheet: View {
    @EnvironmentObject private var finance: FinanceService
    @Environment(\.dismiss) private var dismiss

    let bill: ParsedQrBill

    @State private var amountText: String
    @State private var description: String
    @State private var selectedCategoryId: Int?
    @State private var paymentMethod = "bank"
    @State private var isSaving = false
    @State private var errorMessage: String?

    init(bill: ParsedQrBill) {
        self.bill = bill
        _amountText  = State(initialValue: bill.amount > 0
            ? String(format: "%.2f", bill.amount)
            : "")
        _description = State(initialValue: bill.recipient.isEmpty ? bill.description : bill.recipient)
    }

    private var normalizedAmount: String {
        amountText.replacingOccurrences(of: ",", with: ".")
    }

    private var isValid: Bool {
        guard let amt = Double(normalizedAmount), amt > 0 else { return false }
        return selectedCategoryId != nil
    }

    var body: some View {
        NavigationStack {
            Form {
                // MARK: Scanned info
                Section("Scanned Bill") {
                    if !bill.recipient.isEmpty {
                        LabeledContent("Recipient", value: bill.recipient)
                    }
                    if !bill.referenceNumber.isEmpty {
                        LabeledContent("Reference", value: bill.referenceNumber)
                    }
                    if !bill.paymentPurpose.isEmpty {
                        LabeledContent("Purpose", value: bill.paymentPurpose)
                    }
                    if !bill.account.isEmpty {
                        LabeledContent("Account", value: bill.account)
                    }
                }

                // MARK: Transaction details
                Section("Transaction Details") {
                    // Amount
                    HStack {
                        Text("Amount")
                        Spacer()
                        TextField("0.00", text: $amountText)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(maxWidth: 130)
                        Text("RSD").foregroundStyle(.secondary)
                    }

                    // Description
                    HStack {
                        Text("Description")
                        Spacer()
                        TextField("Description", text: $description)
                            .multilineTextAlignment(.trailing)
                    }

                    // Category
                    Picker("Category", selection: $selectedCategoryId) {
                        Text("Select…").tag(Optional<Int>(nil))
                        ForEach(finance.categories) { cat in
                            Text("\(cat.icon) \(cat.name)").tag(Optional(cat.id))
                        }
                    }
                    .pickerStyle(.navigationLink)

                    // Payment method
                    Picker("Payment Method", selection: $paymentMethod) {
                        Text("Bank").tag("bank")
                        Text("Cash").tag("cash")
                    }
                    .pickerStyle(.segmented)
                }

                if let err = errorMessage {
                    Section {
                        Text(err).foregroundStyle(.red).font(.footnote)
                    }
                }
            }
            .navigationTitle("Review QR Bill")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task { await save() }
                    }
                    .disabled(!isValid || isSaving)
                }
            }
        }
    }

    private func save() async {
        guard let amt = Double(normalizedAmount), let catId = selectedCategoryId else { return }
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        let dateStr = df.string(from: Date())
        let desc = description.trimmingCharacters(in: .whitespaces).isEmpty
            ? bill.description
            : description.trimmingCharacters(in: .whitespaces)
        isSaving = true
        do {
            try await finance.addTransaction(
                date: dateStr,
                description: desc,
                categoryId: catId,
                amount: amt,
                paymentMethod: paymentMethod
            )
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }
}
