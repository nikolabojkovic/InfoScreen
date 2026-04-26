import SwiftUI

// MARK: - Main view

struct TransactionsView: View {
    @EnvironmentObject private var finance: FinanceService

    @State private var activeTab = 0   // 0 = Outcome, 1 = Income
    @State private var filterCategoryId: Int? = nil

    // Outcome state
    @State private var showAddTransactionSheet = false
    @State private var editingTransaction: Transaction? = nil
    @State private var deletingTransaction: Transaction? = nil

    // Income state
    @State private var showAddIncomeSheet = false
    @State private var editingIncome: IncomeRecord? = nil
    @State private var deletingIncomeId: Int? = nil

    @State private var errorMessage: String? = nil

    // QR scanner state
    @State private var showQrScanner  = false
    @State private var scannedBill: ParsedQrBill? = nil

    // MARK: - Grouped transactions

    private struct TxGroup: Identifiable {
        var id: String { date }
        var date: String
        var items: [Transaction]
        var total: Double { items.reduce(0) { $0 + $1.amount } }
    }

    private var filteredTransactions: [Transaction] {
        guard let cid = filterCategoryId else { return finance.transactions }
        return finance.transactions.filter { $0.categoryId == cid }
    }

    private var transactionGroups: [TxGroup] {
        let grouped = Dictionary(grouping: filteredTransactions) { $0.date }
        return grouped
            .map { TxGroup(date: $0.key, items: $0.value.sorted { $0.id > $1.id }) }
            .sorted { $0.date > $1.date }
    }

    // MARK: - Body

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("", selection: $activeTab) {
                    Text("Outcome").tag(0)
                    Text("Income").tag(1)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Color(.systemGroupedBackground))

                if activeTab == 0 {
                    outcomeList
                } else {
                    incomeList
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Transactions")
            .toolbar { toolbarContent }
            // Sheets
            .sheet(isPresented: $showAddTransactionSheet) {
                TransactionFormSheet()
                    .environmentObject(finance)
            }
            .sheet(item: $editingTransaction) { tx in
                TransactionFormSheet(existingTransaction: tx)
                    .environmentObject(finance)
            }
            .sheet(isPresented: $showAddIncomeSheet) {
                IncomeFormSheet()
                    .environmentObject(finance)
            }
            .sheet(item: $editingIncome) { rec in
                IncomeFormSheet(existingRecord: rec)
                    .environmentObject(finance)
            }
            // QR scanner
            .fullScreenCover(isPresented: $showQrScanner) {
                QrScannerView(
                    onScan: { raw in
                        showQrScanner = false
                        if let bill = QrParser.parse(raw) {
                            scannedBill = bill
                        } else {
                            errorMessage = "Could not parse QR code."
                        }
                    },
                    onCancel: { showQrScanner = false }
                )
                .ignoresSafeArea()
            }
            .sheet(item: Binding(
                get: { scannedBill },
                set: { scannedBill = $0 }
            )) { bill in
                QrBillFormSheet(bill: bill)
                    .environmentObject(finance)
            }
            // Delete transaction
            .confirmationDialog(
                "Delete transaction?",
                isPresented: Binding(
                    get: { deletingTransaction != nil },
                    set: { if !$0 { deletingTransaction = nil } }
                ),
                titleVisibility: .visible
            ) {
                Button("Delete", role: .destructive) {
                    guard let tx = deletingTransaction else { return }
                    deletingTransaction = nil
                    Task { try? await finance.deleteTransaction(id: tx.id) }
                }
                Button("Cancel", role: .cancel) { deletingTransaction = nil }
            } message: { Text("This action cannot be undone.") }
            // Delete income
            .confirmationDialog(
                "Delete income record?",
                isPresented: Binding(
                    get: { deletingIncomeId != nil },
                    set: { if !$0 { deletingIncomeId = nil } }
                ),
                titleVisibility: .visible
            ) {
                Button("Delete", role: .destructive) {
                    guard let id = deletingIncomeId else { return }
                    deletingIncomeId = nil
                    Task { try? await finance.deleteIncomeRecord(id: id) }
                }
                Button("Cancel", role: .cancel) { deletingIncomeId = nil }
            } message: { Text("This action cannot be undone.") }
            // Error
            .alert("Error", isPresented: Binding(
                get: { errorMessage != nil },
                set: { if !$0 { errorMessage = nil } }
            )) {
                Button("OK") { errorMessage = nil }
            } message: { Text(errorMessage ?? "") }
            .task { await loadData() }
            .onChange(of: finance.selectedMonth) { _, _ in Task { await loadData() } }
            .onChange(of: finance.selectedYear)  { _, _ in Task { await loadData() } }
            .refreshable { await loadData() }
        }
    }

    // MARK: - Outcome list

    @ViewBuilder
    private var outcomeList: some View {
        if finance.isLoading && finance.transactions.isEmpty {
            ProgressView("Loading…").frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if filteredTransactions.isEmpty {
            ContentUnavailableView(
                "No Transactions",
                systemImage: "cart",
                description: Text(filterCategoryId != nil
                    ? "No transactions for this category"
                    : "Tap + to add your first transaction")
            )
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color(.systemGroupedBackground))
        } else {
            List {
                ForEach(transactionGroups) { group in
                    Section {
                        ForEach(group.items) { tx in
                            let cat = finance.categories.first { $0.id == tx.categoryId }
                            TransactionRow(transaction: tx, category: cat)
                                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                    Button(role: .destructive) {
                                        deletingTransaction = tx
                                    } label: { Label("Delete", systemImage: "trash") }

                                    Button { editingTransaction = tx } label: {
                                        Label("Edit", systemImage: "pencil")
                                    }
                                    .tint(.blue)
                                }
                        }
                    } header: {
                        HStack {
                            Text(formatDate(group.date))
                            Spacer()
                            Text(amountString(group.total))
                                .fontWeight(.semibold)
                        }
                        .textCase(nil)
                    }
                }

                // Month total footer
                Section {
                    HStack {
                        Text("Month Total")
                            .fontWeight(.medium)
                        Spacer()
                        Text(amountString(finance.monthTotal))
                            .fontWeight(.bold)
                    }
                }
            }
            .listStyle(.insetGrouped)
        }
    }

    // MARK: - Income list

    @ViewBuilder
    private var incomeList: some View {
        if finance.incomeRecords.isEmpty {
            ContentUnavailableView(
                "No Income Records",
                systemImage: "banknote",
                description: Text("Tap + to add income")
            )
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color(.systemGroupedBackground))
        } else {
            List {
                Section("Records") {
                    ForEach(finance.incomeRecords) { rec in
                        IncomeRow(record: rec)
                            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                Button(role: .destructive) {
                                    deletingIncomeId = rec.id
                                } label: { Label("Delete", systemImage: "trash") }

                                Button { editingIncome = rec } label: {
                                    Label("Edit", systemImage: "pencil")
                                }
                                .tint(.blue)
                            }
                    }
                }

                Section("Summary") {
                    IncomeSummaryRow(label: "Total Income",  amount: finance.totalIncome,  color: .green)
                    IncomeSummaryRow(label: "Bank Balance",  amount: finance.bankBalance,
                                    color: finance.bankBalance  >= 0 ? .blue   : .red)
                    IncomeSummaryRow(label: "Cash Balance",  amount: finance.cashBalance,
                                    color: finance.cashBalance  >= 0 ? .orange : .red)
                }
            }
            .listStyle(.insetGrouped)
        }
    }

    // MARK: - Toolbar

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItem(placement: .topBarLeading) {
            TxMonthNavigator(finance: finance)
        }

        ToolbarItemGroup(placement: .topBarTrailing) {
            if activeTab == 0 {
                Menu {
                    Button {
                        filterCategoryId = nil
                    } label: {
                        Label("All Categories", systemImage: filterCategoryId == nil ? "checkmark" : "tag")
                    }
                    if !finance.categories.isEmpty {
                        Divider()
                        ForEach(finance.categories) { cat in
                            Button {
                                filterCategoryId = filterCategoryId == cat.id ? nil : cat.id
                            } label: {
                                Label(
                                    "\(cat.icon) \(cat.name)",
                                    systemImage: filterCategoryId == cat.id ? "checkmark" : "tag"
                                )
                            }
                        }
                    }
                } label: {
                    Image(systemName: filterCategoryId != nil
                        ? "line.3.horizontal.decrease.circle.fill"
                        : "line.3.horizontal.decrease.circle")
                }
            }

            if activeTab == 0 {
                Button {
                    showQrScanner = true
                } label: {
                    Image(systemName: "qrcode.viewfinder")
                }
            }

            Button {
                if activeTab == 0 { showAddTransactionSheet = true }
                else              { showAddIncomeSheet = true }
            } label: {
                Image(systemName: "plus")
            }
        }
    }

    // MARK: - Helpers

    private func loadData() async {
        do {
            async let txns: () = finance.loadTransactions()
            async let inc: ()  = finance.loadIncomeRecords()
            async let cats: () = finance.loadCategories()
            _ = try await (txns, inc, cats)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func formatDate(_ s: String) -> String {
        let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
        guard let d = df.date(from: s) else { return s }
        let out = DateFormatter(); out.dateStyle = .medium
        return out.string(from: d)
    }

    private func amountString(_ v: Double) -> String {
        v.formatted(.number.precision(.fractionLength(2))) + " RSD"
    }
}

// MARK: - Transaction row

private struct TransactionRow: View {
    let transaction: Transaction
    let category: Category?

    var body: some View {
        HStack(spacing: 12) {
            if let cat = category {
                Text(cat.icon)
                    .font(.title3)
                    .frame(width: 36, height: 36)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            } else {
                Image(systemName: "questionmark.circle.fill")
                    .foregroundStyle(.secondary)
                    .font(.title3)
                    .frame(width: 36, height: 36)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(category?.name ?? "Unknown")
                    .font(.body).fontWeight(.medium)
                if !transaction.description.isEmpty {
                    Text(transaction.description)
                        .font(.caption).foregroundStyle(.secondary).lineLimit(1)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(transaction.amount.formatted(.number.precision(.fractionLength(2))) + " RSD")
                    .font(.subheadline).fontWeight(.semibold)

                Text(transaction.paymentMethod == "bank" ? "Bank" : "Cash")
                    .font(.caption2).fontWeight(.medium)
                    .padding(.horizontal, 7).padding(.vertical, 2)
                    .background(transaction.paymentMethod == "bank"
                        ? Color.blue.opacity(0.15) : Color.orange.opacity(0.15))
                    .foregroundStyle(transaction.paymentMethod == "bank" ? .blue : .orange)
                    .clipShape(Capsule())
            }
        }
        .padding(.vertical, 2)
    }
}

// MARK: - Income row

private struct IncomeRow: View {
    let record: IncomeRecord

    private var methodLabel: String {
        switch record.paymentMethod {
        case "bank": return "Bank"
        case "cash": return "Cash"
        case "withdrawal": return "Withdrawal"
        default: return record.paymentMethod.capitalized
        }
    }

    private var methodColor: Color {
        switch record.paymentMethod {
        case "bank": return .blue
        case "cash": return .green
        case "withdrawal": return .orange
        default: return .secondary
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(record.description.isEmpty ? "(no description)" : record.description)
                    .font(.body).fontWeight(.medium)
                    .foregroundStyle(record.description.isEmpty ? .secondary : .primary)
                Text(formatCreatedAt(record.createdAt))
                    .font(.caption).foregroundStyle(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(record.amount.formatted(.number.precision(.fractionLength(2))) + " RSD")
                    .font(.subheadline).fontWeight(.semibold)
                    .foregroundStyle(record.paymentMethod == "withdrawal" ? .orange : .green)

                Text(methodLabel)
                    .font(.caption2).fontWeight(.medium)
                    .padding(.horizontal, 7).padding(.vertical, 2)
                    .background(methodColor.opacity(0.15))
                    .foregroundStyle(methodColor)
                    .clipShape(Capsule())
            }
        }
        .padding(.vertical, 2)
    }

    private func formatCreatedAt(_ s: String) -> String {
        let df = ISO8601DateFormatter()
        df.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        var d = df.date(from: s)
        if d == nil { df.formatOptions = [.withInternetDateTime]; d = df.date(from: s) }
        guard let date = d else { return s }
        let out = DateFormatter(); out.dateFormat = "dd.MM.yyyy HH:mm"
        return out.string(from: date)
    }
}

// MARK: - Income summary row

private struct IncomeSummaryRow: View {
    let label: String
    let amount: Double
    let color: Color

    var body: some View {
        HStack {
            Text(label).fontWeight(.medium)
            Spacer()
            Text(amount.formatted(.number.precision(.fractionLength(2))) + " RSD")
                .fontWeight(.bold).foregroundStyle(color)
        }
    }
}

// MARK: - Month navigator (transactions-scoped)

private struct TxMonthNavigator: View {
    @ObservedObject var finance: FinanceService

    var body: some View {
        HStack(spacing: 2) {
            Button { finance.decrementMonth() } label: {
                Image(systemName: "chevron.left").imageScale(.small)
            }
            .buttonStyle(.plain)

            Text(finance.monthYearString)
                .font(.subheadline).fontWeight(.medium)
                .frame(minWidth: 110).lineLimit(1)

            Button { finance.incrementMonth() } label: {
                Image(systemName: "chevron.right").imageScale(.small)
            }
            .buttonStyle(.plain)
        }
    }
}

#Preview {
    TransactionsView()
        .environmentObject(FinanceService.shared)
}
