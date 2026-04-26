import SwiftUI

/// Root view — switches between auth flow and the main app shell.
struct ContentView: View {
    @EnvironmentObject private var auth: AuthService
    @State private var showRegister = false

    var body: some View {
        Group {
            if auth.isLoggedIn {
                MainTabView()
            } else {
                if showRegister {
                    RegisterView(showRegister: $showRegister)
                        .transition(.asymmetric(
                            insertion: .move(edge: .trailing),
                            removal: .move(edge: .trailing)
                        ))
                } else {
                    LoginView(showRegister: $showRegister)
                        .transition(.asymmetric(
                            insertion: .move(edge: .leading),
                            removal: .move(edge: .leading)
                        ))
                }
            }
        }
        .animation(.easeInOut(duration: 0.3), value: auth.isLoggedIn)
        .animation(.easeInOut(duration: 0.25), value: showRegister)
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthService.shared)
}
