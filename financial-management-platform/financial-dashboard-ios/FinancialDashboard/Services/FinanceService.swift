import Foundation

@MainActor
final class FinanceService: ObservableObject {
    static let shared = FinanceService()

    @Published var categories: [Category] = []
    @Published var templateCategories: [Category]? = nil
    @Published var transactions: [Transaction] = []
    @Published var incomeRecords: [IncomeRecord] = []
    @Published var selectedMonth: Int
    @Published var selectedYear: Int
    @Published var isLoading = false
    @Published var errorMessage: String?

    private static let eurRateKey = "eurRate"
    @Published var eurRate: Double

    func setEurRate(_ rate: Double) {
        eurRate = rate
        UserDefaults.standard.set(rate, forKey: Self.eurRateKey)
    }

    private init() {
        let now = Date()
        let cal = Calendar.current
        selectedMonth = cal.component(.month, from: now)
        selectedYear = cal.component(.year, from: now)
        let stored = UserDefaults.standard.double(forKey: Self.eurRateKey)
        eurRate = stored > 0 ? stored : 117.0
    }

    // MARK: - Month/Year helpers

    var monthYearString: String {
        var comps = DateComponents()
        comps.month = selectedMonth
        comps.year = selectedYear
        comps.day = 1
        let date = Calendar.current.date(from: comps) ?? Date()
        let fmt = DateFormatter()
        fmt.dateFormat = "MMMM yyyy"
        return fmt.string(from: date)
    }

    var currentDateString: String {
        String(format: "%04d-%02d-01", selectedYear, selectedMonth)
    }

    func decrementMonth() {
        if selectedMonth == 1 { selectedMonth = 12; selectedYear -= 1 }
        else { selectedMonth -= 1 }
    }

    func incrementMonth() {
        if selectedMonth == 12 { selectedMonth = 1; selectedYear += 1 }
        else { selectedMonth += 1 }
    }

    // MARK: - Categories

    func loadCategories() async throws {
        isLoading = true
        defer { isLoading = false }
        let loaded: [Category] = try await APIClient.shared.request(
            path: "/api/categories?month=\(selectedMonth)&year=\(selectedYear)"
        )
        categories = loaded.sorted { $0.sortIndex < $1.sortIndex }
    }

    func addCategory(name: String, icon: String, items: [CreateCategoryItemRequest]) async throws {
        let budget = items.reduce(0.0) { $0 + $1.amount }
        let req = CreateCategoryRequest(
            name: name,
            color: icon,
            budgetAmount: budget,
            items: items,
            date: currentDateString,
            categoryType: "unit"
        )
        let created: Category = try await APIClient.shared.request(
            path: "/api/categories",
            method: .POST,
            body: req
        )
        categories.append(created)
        categories.sort { $0.sortIndex < $1.sortIndex }
    }

    func updateCategory(id: Int, name: String, icon: String, items: [UpdateCategoryItemRequest]) async throws {
        let budget = items.reduce(0.0) { $0 + $1.amount }
        let req = UpdateCategoryRequest(name: name, color: icon, budgetAmount: budget, items: items)
        let updated: Category = try await APIClient.shared.request(
            path: "/api/categories/\(id)",
            method: .PUT,
            body: req
        )
        if let idx = categories.firstIndex(where: { $0.id == id }) {
            categories[idx] = updated
        }
    }

    func deleteCategory(id: Int) async throws {
        try await APIClient.shared.requestVoid(
            path: "/api/categories/\(id)",
            method: .DELETE
        )
        categories.removeAll { $0.id == id }
    }

    func reorderCategories(_ orderedIds: [Int]) async throws {
        // Apply optimistic local reorder immediately
        var reordered: [Category] = []
        for id in orderedIds {
            if let cat = categories.first(where: { $0.id == id }) {
                reordered.append(cat)
            }
        }
        categories = reordered

        // Persist to API
        let reqs = orderedIds.enumerated().map { idx, id in
            ReorderCategoryRequest(id: id, sortIndex: idx)
        }
        try await APIClient.shared.requestVoid(
            path: "/api/categories/reorder",
            method: .POST,
            body: reqs
        )
    }

    // MARK: - Templates

    func loadTemplate() async throws {
        let tmpl: [Category] = try await APIClient.shared.request(
            path: "/api/categories/template"
        )
        templateCategories = tmpl
    }

    func saveAsTemplate() async throws {
        let reqs = categories.enumerated().map { idx, cat in
            SaveTemplateItemRequest(
                name: cat.name,
                color: cat.icon,
                budgetAmount: cat.budgetAmount,
                items: cat.items.map { CreateCategoryItemRequest(description: $0.description, amount: $0.amount) },
                sortIndex: idx
            )
        }
        let saved: [Category] = try await APIClient.shared.request(
            path: "/api/categories/template",
            method: .POST,
            body: reqs
        )
        templateCategories = saved
    }

    func restoreFromTemplate() async throws {
        guard let template = templateCategories, !template.isEmpty else { return }
        for tmpl in template {
            let items = tmpl.items.map {
                CreateCategoryItemRequest(description: $0.description, amount: $0.amount)
            }
            let req = CreateCategoryRequest(
                name: tmpl.name,
                color: tmpl.icon,
                budgetAmount: tmpl.budgetAmount,
                items: items,
                date: currentDateString,
                categoryType: "unit"
            )
            let created: Category = try await APIClient.shared.request(
                path: "/api/categories",
                method: .POST,
                body: req
            )
            categories.append(created)
        }
        categories.sort { $0.sortIndex < $1.sortIndex }
    }

    // MARK: - Transactions

    func loadTransactions() async throws {
        isLoading = true
        defer { isLoading = false }
        let loaded: [Transaction] = try await APIClient.shared.request(
            path: "/api/transactions?month=\(selectedMonth)&year=\(selectedYear)&type=expense"
        )
        transactions = loaded.sorted { $0.date > $1.date }
    }

    func addTransaction(date: String, description: String, categoryId: Int, amount: Double, paymentMethod: String) async throws {
        let req = CreateTransactionRequest(
            date: date, description: description,
            categoryId: categoryId, amount: amount, paymentMethod: paymentMethod
        )
        let created: Transaction = try await APIClient.shared.request(
            path: "/api/transactions", method: .POST, body: req
        )
        transactions.insert(created, at: 0)
        transactions.sort { $0.date > $1.date }
    }

    func updateTransaction(id: Int, date: String, description: String, categoryId: Int, amount: Double, paymentMethod: String) async throws {
        let req = UpdateTransactionRequest(
            date: date, description: description,
            categoryId: categoryId, amount: amount, paymentMethod: paymentMethod
        )
        let updated: Transaction = try await APIClient.shared.request(
            path: "/api/transactions/\(id)", method: .PUT, body: req
        )
        if let idx = transactions.firstIndex(where: { $0.id == id }) {
            transactions[idx] = updated
        }
        transactions.sort { $0.date > $1.date }
    }

    func deleteTransaction(id: Int) async throws {
        try await APIClient.shared.requestVoid(path: "/api/transactions/\(id)", method: .DELETE)
        transactions.removeAll { $0.id == id }
    }

    // MARK: - Income

    func loadIncomeRecords() async throws {
        let loaded: [IncomeRecord] = try await APIClient.shared.request(
            path: "/api/incomes?month=\(selectedMonth)&year=\(selectedYear)"
        )
        incomeRecords = loaded.sorted { $0.date > $1.date }
    }

    func addIncomeRecord(date: String, description: String, amount: Double, paymentMethod: String) async throws {
        let req = CreateIncomeRequest(date: date, description: description, amount: amount, paymentMethod: paymentMethod)
        let created: IncomeRecord = try await APIClient.shared.request(
            path: "/api/incomes", method: .POST, body: req
        )
        incomeRecords.insert(created, at: 0)
        incomeRecords.sort { $0.date > $1.date }
    }

    func updateIncomeRecord(id: Int, date: String, description: String, amount: Double, paymentMethod: String) async throws {
        let req = UpdateIncomeRequest(date: date, description: description, amount: amount, paymentMethod: paymentMethod)
        let updated: IncomeRecord = try await APIClient.shared.request(
            path: "/api/incomes/\(id)", method: .PUT, body: req
        )
        if let idx = incomeRecords.firstIndex(where: { $0.id == id }) {
            incomeRecords[idx] = updated
        }
        incomeRecords.sort { $0.date > $1.date }
    }

    func deleteIncomeRecord(id: Int) async throws {
        try await APIClient.shared.requestVoid(path: "/api/incomes/\(id)", method: .DELETE)
        incomeRecords.removeAll { $0.id == id }
    }

    // MARK: - Summary computed properties

    var monthTotal: Double {
        transactions.reduce(0) { $0 + $1.amount }
    }

    var totalIncome: Double {
        incomeRecords.filter { $0.paymentMethod != "withdrawal" }.reduce(0) { $0 + $1.amount }
    }

    var bankBalance: Double {
        let bankIncome = incomeRecords.filter { $0.paymentMethod == "bank" }.reduce(0.0) { $0 + $1.amount }
        let withdrawals = incomeRecords.filter { $0.paymentMethod == "withdrawal" }.reduce(0.0) { $0 + $1.amount }
        let bankExpenses = transactions.filter { $0.paymentMethod == "bank" }.reduce(0.0) { $0 + $1.amount }
        return bankIncome - bankExpenses - withdrawals
    }

    var cashBalance: Double {
        let cashIncome = incomeRecords.filter { $0.paymentMethod == "cash" }.reduce(0.0) { $0 + $1.amount }
        let withdrawals = incomeRecords.filter { $0.paymentMethod == "withdrawal" }.reduce(0.0) { $0 + $1.amount }
        let cashExpenses = transactions.filter { $0.paymentMethod == "cash" }.reduce(0.0) { $0 + $1.amount }
        return cashIncome + withdrawals - cashExpenses
    }

    // MARK: - Budget computed properties

    var bankIncomeAmount: Double {
        incomeRecords.filter { $0.paymentMethod == "bank" }.reduce(0.0) { $0 + $1.amount }
    }

    var cashIncomeAmount: Double {
        incomeRecords.filter { $0.paymentMethod == "cash" }.reduce(0.0) { $0 + $1.amount }
    }

    var withdrawalAmount: Double {
        incomeRecords.filter { $0.paymentMethod == "withdrawal" }.reduce(0.0) { $0 + $1.amount }
    }

    var bankOutcome: Double {
        transactions.filter { $0.paymentMethod == "bank" }.reduce(0.0) { $0 + $1.amount }
    }

    var cashOutcome: Double {
        transactions.filter { $0.paymentMethod == "cash" }.reduce(0.0) { $0 + $1.amount }
    }

    var categorySummaries: [CategorySummary] {
        categories.map { cat in
            let actual = transactions
                .filter { $0.categoryId == cat.id }
                .reduce(0.0) { $0 + $1.amount }
            let diff    = cat.budgetAmount - actual
            let completion = cat.budgetAmount > 0
                ? (actual / cat.budgetAmount) * 100
                : (actual > 0 ? 100.0 : 0.0)
            let diffPct = cat.budgetAmount > 0
                ? (diff / cat.budgetAmount) * 100
                : (actual > 0 ? -100.0 : 0.0)
            return CategorySummary(
                category: cat,
                budgetAmount: cat.budgetAmount,
                actualAmount: actual,
                difference: diff,
                differencePercent: diffPct,
                completionPercent: completion
            )
        }
    }

    var totalBudget: Double {
        categories.reduce(0.0) { $0 + $1.budgetAmount }
    }

    var balanceVsActual: Double  { totalIncome - monthTotal }
    var balanceVsBudget: Double  { max(totalIncome - totalBudget, 0) }

    var totalRemaining: Double {
        categorySummaries.reduce(0.0) { $0 + max($1.difference, 0) }
    }

    var projectedOverspend: Double {
        let neg = categorySummaries
            .filter { $0.difference < 0 }
            .reduce(0.0) { $0 + $1.difference }
        return abs(min(neg, 0))
    }

    var expectedBalance: Double { balanceVsActual - totalRemaining }
}
