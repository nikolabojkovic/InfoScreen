import SwiftUI

// MARK: - App-wide theme store

final class AppTheme: ObservableObject {
    static let shared = AppTheme()
    private static let key = "isDarkTheme"

    @Published var isDark: Bool

    private init() {
        if UserDefaults.standard.object(forKey: Self.key) != nil {
            isDark = UserDefaults.standard.bool(forKey: Self.key)
        } else {
            isDark = true          // default: dark
        }
    }

    func setDark(_ dark: Bool) {
        isDark = dark
        UserDefaults.standard.set(dark, forKey: Self.key)
    }
}

// MARK: - App entry point

@main
struct FinancialDashboardApp: App {
    @StateObject private var auth    = AuthService.shared
    @StateObject private var finance = FinanceService.shared
    @StateObject private var theme   = AppTheme.shared

    init() {
        applyAppearance(isDark: AppTheme.shared.isDark)
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(auth)
                .environmentObject(finance)
                .environmentObject(theme)
                .preferredColorScheme(theme.isDark ? .dark : .light)
                .tint(theme.isDark ? Color(hex: "27ddf5") : Color(hex: "2e7d32"))
                .onChange(of: theme.isDark) { _, isDark in
                    applyAppearance(isDark: isDark)
                }
        }
    }

    // Called on launch and on every theme toggle so existing nav bars pick up the new style.
    private func applyAppearance(isDark: Bool) {
        // MARK: Build appearance objects
        let tabBg    = isDark ? "02525b" : "b2dfb8"
        let active   = isDark ? "27ddf5" : "2e7d32"
        let inactive = isDark ? "8ea1ad" : "4a6e4a"
        let activeC   = UIColor(hex: active)
        let inactiveC = UIColor(hex: inactive)

        let tabApp = UITabBarAppearance()
        tabApp.configureWithOpaqueBackground()
        tabApp.backgroundColor = UIColor(hex: tabBg)
        tabApp.stackedLayoutAppearance.normal.iconColor            = inactiveC
        tabApp.stackedLayoutAppearance.normal.titleTextAttributes  = [.foregroundColor: inactiveC]
        tabApp.stackedLayoutAppearance.selected.iconColor           = activeC
        tabApp.stackedLayoutAppearance.selected.titleTextAttributes = [.foregroundColor: activeC]

        let navBg    = isDark ? "161d24" : "b2dfb8"
        let navTint  = isDark ? "27ddf5" : "2e7d32"
        let navTitle = isDark ? "ebf3f8" : "1a3d22"
        let navTintC = UIColor(hex: navTint)

        let navApp = UINavigationBarAppearance()
        navApp.configureWithOpaqueBackground()
        navApp.backgroundColor = UIColor(hex: navBg)
        let titleAttrs: [NSAttributedString.Key: Any] = [.foregroundColor: UIColor(hex: navTitle)]
        navApp.titleTextAttributes      = titleAttrs
        navApp.largeTitleTextAttributes = titleAttrs

        // MARK: Update appearance proxies (for newly created bars)
        UITabBar.appearance().standardAppearance   = tabApp
        UITabBar.appearance().scrollEdgeAppearance = tabApp
        UITabBar.appearance().tintColor            = activeC
        UINavigationBar.appearance().standardAppearance   = navApp
        UINavigationBar.appearance().scrollEdgeAppearance = navApp
        UINavigationBar.appearance().compactAppearance    = navApp
        UINavigationBar.appearance().tintColor            = navTintC

        // MARK: Push changes to already-live bars in the hierarchy
        for scene in UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }) {
            for window in scene.windows {
                applyToViewController(window.rootViewController,
                                      tabApp: tabApp, activeC: activeC,
                                      navApp: navApp, navTintC: navTintC)
            }
        }
    }

    private func applyToViewController(_ vc: UIViewController?,
                                       tabApp: UITabBarAppearance, activeC: UIColor,
                                       navApp: UINavigationBarAppearance, navTintC: UIColor) {
        guard let vc else { return }

        if let tab = vc as? UITabBarController {
            tab.tabBar.standardAppearance   = tabApp
            tab.tabBar.scrollEdgeAppearance = tabApp
            tab.tabBar.tintColor            = activeC
            tab.viewControllers?.forEach {
                applyToViewController($0, tabApp: tabApp, activeC: activeC,
                                      navApp: navApp, navTintC: navTintC)
            }
        }
        if let nav = vc as? UINavigationController {
            nav.navigationBar.standardAppearance   = navApp
            nav.navigationBar.scrollEdgeAppearance = navApp
            nav.navigationBar.compactAppearance    = navApp
            nav.navigationBar.tintColor            = navTintC
            nav.viewControllers.forEach {
                applyToViewController($0, tabApp: tabApp, activeC: activeC,
                                      navApp: navApp, navTintC: navTintC)
            }
        }
        vc.children.forEach {
            applyToViewController($0, tabApp: tabApp, activeC: activeC,
                                  navApp: navApp, navTintC: navTintC)
        }
        if let presented = vc.presentedViewController {
            applyToViewController(presented, tabApp: tabApp, activeC: activeC,
                                  navApp: navApp, navTintC: navTintC)
        }
    }
}

// MARK: - UIColor hex initialiser
private extension UIColor {
    convenience init(hex: String) {
        var int = UInt64()
        Scanner(string: hex.trimmingCharacters(in: .init(charactersIn: "#"))).scanHexInt64(&int)
        self.init(
            red:   CGFloat((int >> 16) & 0xFF) / 255,
            green: CGFloat((int >>  8) & 0xFF) / 255,
            blue:  CGFloat( int        & 0xFF) / 255,
            alpha: 1
        )
    }
}

// MARK: - SwiftUI Color hex initialiser
private extension Color {
    init(hex: String) {
        var int = UInt64()
        Scanner(string: hex.trimmingCharacters(in: .init(charactersIn: "#"))).scanHexInt64(&int)
        self.init(
            red:   Double((int >> 16) & 0xFF) / 255,
            green: Double((int >>  8) & 0xFF) / 255,
            blue:  Double( int        & 0xFF) / 255
        )
    }
}
