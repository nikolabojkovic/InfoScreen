import SwiftUI

/// Main app shell shown after login.
struct MainTabView: View {
    @EnvironmentObject private var auth: AuthService
    @EnvironmentObject private var finance: FinanceService

    var body: some View {
        TabView {
            BudgetView()
                .tabItem {
                    Label("Budget", systemImage: "chart.pie.fill")
                }

            TransactionsView()
                .tabItem {
                    Label("Transactions", systemImage: "list.bullet.rectangle")
                }

            CategoriesView()
                .tabItem {
                    Label("Categories", systemImage: "tag.fill")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
        }
    }
}

// MARK: - Placeholder views (to be replaced with real implementations)

private struct BudgetPlaceholderView: View {
    var body: some View { EmptyView() }
}

private struct TransactionsPlaceholderView: View {
    var body: some View { EmptyView() }
}

private struct CategoriesPlaceholderView: View {
    var body: some View { EmptyView() }
}

private struct PlaceholderContent: View {
    let icon: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 56))
                .foregroundStyle(.tint)
            Text(title).font(.title2).fontWeight(.semibold)
            Text(subtitle).foregroundStyle(.secondary)
        }
    }
}

// MARK: - Settings view

struct SettingsView: View {
    @EnvironmentObject private var auth: AuthService
    @EnvironmentObject private var finance: FinanceService
    @EnvironmentObject private var theme: AppTheme

    // EUR rate editing state
    @State private var eurRateText: String = ""
    @State private var isEditingEur = false
    @FocusState private var eurFieldFocused: Bool

    var body: some View {
        NavigationStack {
            List {

                // MARK: Appearance
                Section("Appearance") {
                    Toggle(isOn: Binding(
                        get: { theme.isDark },
                        set: { theme.setDark($0) }
                    )) {
                        Label(
                            theme.isDark ? "Dark Mode" : "Light Mode",
                            systemImage: theme.isDark ? "moon.fill" : "sun.max.fill"
                        )
                    }
                }

                // MARK: Account
                Section("Account") {
                    LabeledContent("Username", value: auth.username)
                    if !auth.fullName.isEmpty {
                        LabeledContent("Full Name", value: auth.fullName)
                    }
                }

                // MARK: Currency
                Section {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("EUR Rate")
                            .font(.subheadline).foregroundStyle(.secondary)
                        HStack(spacing: 8) {
                            Text("1 EUR =")
                                .foregroundStyle(.secondary)
                            if isEditingEur {
                                TextField("Rate", text: $eurRateText)
                                    .keyboardType(.decimalPad)
                                    .focused($eurFieldFocused)
                                    .textFieldStyle(.roundedBorder)
                                    .frame(maxWidth: 110)
                            } else {
                                Text(String(format: "%.2f", finance.eurRate))
                                    .fontWeight(.semibold)
                            }
                            Text("RSD")
                                .foregroundStyle(.secondary)
                            Spacer()
                            if isEditingEur {
                                Button("Save") {
                                    let normalized = eurRateText.replacingOccurrences(of: ",", with: ".")
                                    if let rate = Double(normalized), rate > 0 {
                                        finance.setEurRate(rate)
                                    }
                                    isEditingEur = false
                                }
                                .buttonStyle(.borderedProminent)
                                .controlSize(.small)
                                Button("Cancel") {
                                    isEditingEur = false
                                }
                                .buttonStyle(.bordered)
                                .controlSize(.small)
                            } else {
                                Button("Edit") {
                                    eurRateText = String(format: "%.2f", finance.eurRate)
                                    isEditingEur = true
                                    eurFieldFocused = true
                                }
                                .buttonStyle(.bordered)
                                .controlSize(.small)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                } header: {
                    Text("Currency")
                }

                // MARK: Categories Template
                Section("Categories Template") {
                    if let tmpl = finance.templateCategories, !tmpl.isEmpty {
                        // Header row
                        HStack(spacing: 0) {
                            Text("Icon").font(.caption).foregroundStyle(.secondary).frame(width: 36, alignment: .leading)
                            Text("Name").font(.caption).foregroundStyle(.secondary).frame(maxWidth: .infinity, alignment: .leading)
                            Text("Budget (RSD)").font(.caption).foregroundStyle(.secondary).frame(width: 110, alignment: .trailing)
                            Text("EUR").font(.caption).foregroundStyle(.secondary).frame(width: 70, alignment: .trailing)
                        }
                        .listRowBackground(Color(.tertiarySystemGroupedBackground))

                        ForEach(tmpl) { cat in
                            HStack(spacing: 0) {
                                Text(cat.icon)
                                    .font(.title3)
                                    .frame(width: 36, alignment: .leading)
                                Text(cat.name)
                                    .font(.subheadline)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                Text(cat.budgetAmount.formatted(.number.precision(.fractionLength(2))))
                                    .font(.subheadline).fontWeight(.medium)
                                    .frame(width: 110, alignment: .trailing)
                                Text(finance.eurRate > 0
                                     ? (cat.budgetAmount / finance.eurRate).formatted(.number.precision(.fractionLength(2))) + " €"
                                     : "—")
                                    .font(.caption).foregroundStyle(.secondary)
                                    .frame(width: 70, alignment: .trailing)
                            }
                        }
                    } else {
                        Text("No template saved yet. Go to Categories and tap ··· → Save as Template.")
                            .font(.subheadline).foregroundStyle(.secondary)
                            .padding(.vertical, 4)
                    }
                }

                // MARK: Sign out
                Section {
                    Button(role: .destructive) {
                        auth.logout()
                    } label: {
                        Label("Sign Out", systemImage: "arrow.right.square")
                    }
                }
            }
            .navigationTitle("Settings")
            .task { try? await finance.loadTemplate() }
        }
    }
}

#Preview {
    MainTabView()
        .environmentObject(AuthService.shared)
}
