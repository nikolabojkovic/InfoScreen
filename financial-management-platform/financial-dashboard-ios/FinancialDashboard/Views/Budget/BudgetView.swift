import SwiftUI
import Charts

// MARK: - Category palette (matches Angular's 15-colour palette)

private let categoryPalette: [Color] = [
    Color(red: 0.306, green: 0.475, blue: 0.655),  // steel blue
    Color(red: 0.949, green: 0.557, blue: 0.169),  // orange
    Color(red: 0.882, green: 0.341, blue: 0.349),  // red
    Color(red: 0.463, green: 0.718, blue: 0.698),  // teal
    Color(red: 0.349, green: 0.631, blue: 0.310),  // green
    Color(red: 0.929, green: 0.788, blue: 0.282),  // yellow
    Color(red: 0.690, green: 0.478, blue: 0.631),  // purple
    Color(red: 1.000, green: 0.616, blue: 0.655),  // pink
    Color(red: 0.565, green: 0.459, blue: 0.373),  // brown
    Color(red: 0.729, green: 0.690, blue: 0.675),  // warm gray
    Color(red: 0.286, green: 0.596, blue: 0.580),  // dark teal
    Color(red: 0.525, green: 0.737, blue: 0.714),  // light teal
    Color(red: 0.827, green: 0.447, blue: 0.584),  // rose
    Color(red: 0.980, green: 0.749, blue: 0.824),  // light pink
    Color(red: 0.549, green: 0.820, blue: 0.478),  // light green
]

private func catColor(_ id: Int, in categories: [Category]) -> Color {
    let idx = categories.firstIndex(where: { $0.id == id }) ?? 0
    return categoryPalette[idx % categoryPalette.count]
}

private func rsd(_ v: Double) -> String {
    v.formatted(.number.precision(.fractionLength(2))) + " RSD"
}

// MARK: - Main view

struct BudgetView: View {
    @EnvironmentObject private var finance: FinanceService
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Group {
                if finance.isLoading && finance.categories.isEmpty {
                    ProgressView("Loading…")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    scrollContent
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Budget")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    BudgetMonthNav(finance: finance)
                }
            }
            .alert("Error", isPresented: Binding(
                get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } }
            )) {
                Button("OK") { errorMessage = nil }
            } message: { Text(errorMessage ?? "") }
            .task { await loadData() }
            .onChange(of: finance.selectedMonth) { _, _ in Task { await loadData() } }
            .onChange(of: finance.selectedYear)  { _, _ in Task { await loadData() } }
            .refreshable { await loadData() }
        }
    }

    private var scrollContent: some View {
        ScrollView {
            VStack(spacing: 16) {
                IncomeCard(finance: finance)

                let spending = finance.categorySummaries.filter { $0.actualAmount > 0 }
                if !spending.isEmpty {
                    DonutCard(
                        summaries: spending,
                        categories: finance.categories,
                        total: finance.monthTotal
                    )
                }

                let budgetData = finance.categorySummaries.filter {
                    $0.budgetAmount > 0 || $0.actualAmount > 0
                }
                if !budgetData.isEmpty {
                    BarChartCard(summaries: budgetData, categories: finance.categories)
                }

                SummaryGrid(finance: finance)

                if !finance.categorySummaries.isEmpty {
                    CategoryTableCard(
                        summaries: finance.categorySummaries,
                        categories: finance.categories,
                        totalBudget: finance.totalBudget,
                        totalActual: finance.monthTotal,
                        totalDiff: finance.totalBudget - finance.monthTotal
                    )
                }

                if finance.categories.isEmpty && finance.transactions.isEmpty {
                    ContentUnavailableView(
                        "No Data",
                        systemImage: "chart.pie",
                        description: Text("Add categories and transactions to see your budget summary")
                    )
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
    }

    private func loadData() async {
        do {
            async let c: () = finance.loadCategories()
            async let t: () = finance.loadTransactions()
            async let i: () = finance.loadIncomeRecords()
            _ = try await (c, t, i)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// MARK: - Income card

private struct IncomeCard: View {
    @ObservedObject var finance: FinanceService

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Label("Income", systemImage: "banknote")
                    .font(.headline)
                Spacer()
                Text(rsd(finance.totalIncome))
                    .font(.headline)
                    .foregroundStyle(.green)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)

            Divider()

            IncomeRow(icon: "🏦", label: "Bank Income",  value: finance.bankIncomeAmount,  color: .blue)
            IncomeRow(icon: "💵", label: "Cash Income",  value: finance.cashIncomeAmount,  color: .green)

            if finance.withdrawalAmount > 0 {
                Divider().padding(.leading, 16)
                IncomeRow(icon: "🔄", label: "Withdrawal", value: finance.withdrawalAmount, color: .orange)
            }

            if finance.bankIncomeAmount > 0 || finance.cashIncomeAmount > 0 {
                Divider()
                HStack(spacing: 20) {
                    BalanceChip(label: "Bank Balance", amount: finance.bankBalance)
                    BalanceChip(label: "Cash Balance", amount: finance.cashBalance)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
            }
        }
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

private struct IncomeRow: View {
    let icon: String
    let label: String
    let value: Double
    let color: Color

    var body: some View {
        HStack {
            Text(icon + "  " + label)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            Text(rsd(value))
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(color)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }
}

private struct BalanceChip: View {
    let label: String
    let amount: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(rsd(amount))
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(amount >= 0 ? Color.primary : Color.red)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Donut chart

private struct DonutCard: View {
    let summaries: [CategorySummary]
    let categories: [Category]
    let total: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Actual Spending", systemImage: "chart.pie.fill")
                .font(.headline)
                .padding(.horizontal, 16)
                .padding(.top, 14)

            Chart(summaries) { s in
                SectorMark(
                    angle: .value("Amount", s.actualAmount),
                    innerRadius: .ratio(0.58),
                    angularInset: 1.5
                )
                .cornerRadius(4)
                .foregroundStyle(catColor(s.category.id, in: categories))
            }
            .frame(height: 230)
            .chartBackground { proxy in
                GeometryReader { geo in
                    if let anchor = proxy.plotFrame {
                        let frame = geo[anchor]
                        VStack(spacing: 2) {
                            Text(rsd(total))
                                .font(.callout)
                                .fontWeight(.bold)
                                .multilineTextAlignment(.center)
                            Text("Outcome")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: frame.width * 0.52)
                        .position(x: frame.midX, y: frame.midY)
                    }
                }
            }
            .padding(.horizontal, 8)

            // Legend
            LazyVGrid(
                columns: [GridItem(.flexible()), GridItem(.flexible())],
                spacing: 6
            ) {
                ForEach(summaries) { s in
                    HStack(spacing: 6) {
                        Circle()
                            .fill(catColor(s.category.id, in: categories))
                            .frame(width: 9, height: 9)
                        Text(s.category.icon + " " + s.category.name)
                            .font(.caption)
                            .lineLimit(1)
                        Spacer()
                        Text(String(
                            format: "%.0f%%",
                            total > 0 ? s.actualAmount / total * 100 : 0
                        ))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 14)
        }
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Budget vs Actual bar chart

private struct BarChartCard: View {
    let summaries: [CategorySummary]
    let categories: [Category]

    private var maxVal: Double {
        summaries.map { max($0.budgetAmount, $0.actualAmount) }.max() ?? 1
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Label("Budget vs Actual", systemImage: "chart.bar.fill")
                .font(.headline)
                .padding(.horizontal, 16)
                .padding(.top, 14)
                .padding(.bottom, 12)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(alignment: .bottom, spacing: 20) {
                    ForEach(summaries) { s in
                        VStack(spacing: 4) {
                            HStack(alignment: .bottom, spacing: 5) {
                                if s.budgetAmount > 0 {
                                    BarColumn(
                                        value: s.budgetAmount,
                                        maxValue: maxVal,
                                        color: Color(.systemFill),
                                        maxHeight: 130
                                    )
                                }
                                BarColumn(
                                    value: s.actualAmount,
                                    maxValue: maxVal,
                                    color: catColor(s.category.id, in: categories),
                                    maxHeight: 130
                                )
                            }
                            .frame(height: 130)

                            Text(s.category.icon)
                                .font(.callout)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 6)
            }

            // Legend
            HStack(spacing: 20) {
                HStack(spacing: 6) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color(.systemFill))
                        .frame(width: 14, height: 10)
                    Text("Budget").font(.caption).foregroundStyle(.secondary)
                }
                HStack(spacing: 6) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.accentColor)
                        .frame(width: 14, height: 10)
                    Text("Actual").font(.caption).foregroundStyle(.secondary)
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 14)
        }
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

private struct BarColumn: View {
    let value: Double
    let maxValue: Double
    let color: Color
    let maxHeight: CGFloat

    private var height: CGFloat {
        max(CGFloat(value / maxValue) * maxHeight, value > 0 ? 3 : 0)
    }

    var body: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 0)
            RoundedRectangle(cornerRadius: 3)
                .fill(color)
                .frame(width: 16, height: height)
        }
    }
}

// MARK: - Summary cards grid

private struct SummaryGrid: View {
    @ObservedObject var finance: FinanceService

    var body: some View {
        VStack(spacing: 10) {
            // Actual balance (full width, most important)
            SummaryCard(
                title: "Actual Balance",
                value: finance.balanceVsActual,
                subtitle: "Income − Spending",
                valueColor: finance.balanceVsActual >= 0 ? .green : .red
            )

            // Total remaining (full width)
            SummaryCard(
                title: "Total Remaining Outcome",
                value: finance.totalRemaining,
                subtitle: "Unspent budget across all categories",
                valueColor: .primary
            )

            // Two half-width cards
            HStack(spacing: 10) {
                SummaryCard(
                    title: "Expected Savings",
                    value: finance.balanceVsBudget,
                    subtitle: "Income − Budget",
                    valueColor: .green
                )
                SummaryCard(
                    title: "Expected Balance",
                    value: finance.expectedBalance,
                    subtitle: "After remaining spend",
                    valueColor: finance.expectedBalance >= 0 ? .blue : .red
                )
            }

            // Projected overspend (full width)
            SummaryCard(
                title: "Projected Overspend",
                value: finance.projectedOverspend,
                subtitle: finance.projectedOverspend > 0
                    ? "Some categories are over budget"
                    : "No overspend projected ✓",
                valueColor: finance.projectedOverspend > 0 ? .red : .green
            )
        }
    }
}

private struct SummaryCard: View {
    let title: String
    let value: Double
    let subtitle: String
    let valueColor: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(rsd(abs(value)))
                .font(.title3)
                .fontWeight(.bold)
                .foregroundStyle(valueColor)
            Text(subtitle)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Category summary table

private struct CategoryTableCard: View {
    let summaries: [CategorySummary]
    let categories: [Category]
    let totalBudget: Double
    let totalActual: Double
    let totalDiff: Double

    private var totalCompletion: Double {
        totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Label("Category Summary", systemImage: "list.bullet.below.rectangle")
                .font(.headline)
                .padding(.horizontal, 16)
                .padding(.top, 14)
                .padding(.bottom, 8)

            Divider()

            ScrollView(.horizontal, showsIndicators: false) {
                VStack(spacing: 0) {
                    // Column headers
                    tableHeader

                    ForEach(summaries) { s in
                        Divider()
                        CategoryTableRow(summary: s, categories: categories)
                    }

                    // TOTAL footer
                    Divider()
                    totalRow
                        .background(Color(.tertiarySystemGroupedBackground))
                }
            }
        }
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var tableHeader: some View {
        HStack(spacing: 0) {
            Text("Category")
                .frame(width: 140, alignment: .leading)
            Text("Progress")
                .frame(width: 82, alignment: .center)
            Text("Remaining")
                .frame(width: 96, alignment: .trailing)
            Text("Actual")
                .frame(width: 88, alignment: .trailing)
            Text("Budget")
                .frame(width: 88, alignment: .trailing)
        }
        .font(.caption)
        .foregroundStyle(.secondary)
        .padding(.horizontal, 16)
        .padding(.vertical, 6)
        .background(Color(.tertiarySystemGroupedBackground))
    }

    private var totalRow: some View {
        HStack(spacing: 0) {
            Text("TOTAL")
                .font(.caption)
                .fontWeight(.bold)
                .frame(width: 140, alignment: .leading)
            ProgressCell(pct: totalCompletion, noBudget: totalBudget == 0)
                .frame(width: 82)
            AmountCell(value: totalDiff, colored: true)
                .frame(width: 96, alignment: .trailing)
            Text(rsd(totalActual))
                .font(.caption2)
                .fontWeight(.semibold)
                .frame(width: 88, alignment: .trailing)
            Text(rsd(totalBudget))
                .font(.caption2)
                .foregroundStyle(.secondary)
                .frame(width: 88, alignment: .trailing)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
    }
}

private struct CategoryTableRow: View {
    let summary: CategorySummary
    let categories: [Category]

    var body: some View {
        HStack(spacing: 0) {
            HStack(spacing: 6) {
                Text(summary.category.icon).font(.body)
                Text(summary.category.name)
                    .font(.caption)
                    .lineLimit(1)
            }
            .frame(width: 140, alignment: .leading)

            ProgressCell(
                pct: summary.completionPercent,
                noBudget: summary.budgetAmount == 0
            )
            .frame(width: 82)

            AmountCell(value: summary.difference, colored: true)
                .frame(width: 96, alignment: .trailing)

            Text(summary.actualAmount > 0 ? rsd(summary.actualAmount) : "—")
                .font(.caption2)
                .frame(width: 88, alignment: .trailing)

            Text(summary.budgetAmount > 0 ? rsd(summary.budgetAmount) : "—")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .frame(width: 88, alignment: .trailing)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
    }
}

private struct ProgressCell: View {
    let pct: Double
    let noBudget: Bool

    private var barColor: Color {
        if noBudget || pct == 0 { return .secondary }
        if pct < 80  { return .blue }
        if pct < 100 { return .orange }
        if pct <= 100 { return .green }
        return .red
    }

    var body: some View {
        VStack(spacing: 3) {
            if noBudget {
                Text("—").font(.caption2).foregroundStyle(.secondary)
            } else {
                Text(String(format: "%.0f%%", min(pct, 999)))
                    .font(.caption2)
                    .fontWeight(.medium)
                    .foregroundStyle(barColor)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color(.systemFill))
                        .frame(height: 5)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(barColor)
                        .frame(
                            width: geo.size.width * min(CGFloat(pct / 100), 1.0),
                            height: 5
                        )
                }
            }
            .frame(height: 5)
        }
        .padding(.horizontal, 4)
    }
}

private struct AmountCell: View {
    let value: Double
    let colored: Bool

    var body: some View {
        Text(value != 0 ? rsd(abs(value)) : "—")
            .font(.caption2)
            .foregroundStyle(
                colored
                    ? (value >= 0 ? Color.green : Color.red)
                    : Color.primary
            )
    }
}

// MARK: - Month navigator

private struct BudgetMonthNav: View {
    @ObservedObject var finance: FinanceService

    var body: some View {
        HStack(spacing: 2) {
            Button { finance.decrementMonth() } label: {
                Image(systemName: "chevron.left").imageScale(.small)
            }
            .buttonStyle(.plain)
            Text(finance.monthYearString)
                .font(.subheadline)
                .fontWeight(.medium)
                .frame(minWidth: 110)
                .lineLimit(1)
            Button { finance.incrementMonth() } label: {
                Image(systemName: "chevron.right").imageScale(.small)
            }
            .buttonStyle(.plain)
        }
    }
}

#Preview {
    BudgetView()
        .environmentObject(FinanceService.shared)
}
