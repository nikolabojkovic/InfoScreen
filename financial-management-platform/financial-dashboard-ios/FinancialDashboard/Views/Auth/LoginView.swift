import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var auth: AuthService

    @State private var username = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @Binding var showRegister: Bool

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Header
                VStack(spacing: 12) {
                    Image(systemName: "chart.bar.fill")
                        .font(.system(size: 52))
                        .foregroundStyle(.tint)
                    Text("Financial Dashboard")
                        .font(.title2)
                        .fontWeight(.bold)
                    Text("Sign in to your account")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 60)
                .padding(.bottom, 40)

                // Card
                VStack(spacing: 20) {
                    VStack(alignment: .leading, spacing: 6) {
                        Label("Username", systemImage: "person")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        TextField("Enter your username", text: $username)
                            .textContentType(.username)
                            .autocorrectionDisabled()
                            .textInputAutocapitalization(.never)
                            .padding(12)
                            .background(Color(.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Label("Password", systemImage: "lock")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        SecureField("Enter your password", text: $password)
                            .textContentType(.password)
                            .padding(12)
                            .background(Color(.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }

                    if let error = errorMessage {
                        HStack(spacing: 8) {
                            Image(systemName: "exclamationmark.circle.fill")
                            Text(error)
                                .font(.footnote)
                        }
                        .foregroundStyle(.red)
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.red.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }

                    Button(action: loginTapped) {
                        Group {
                            if isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text("Sign In")
                                    .fontWeight(.semibold)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                    }
                    .buttonStyle(.borderedProminent)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .disabled(isLoading || username.isEmpty || password.isEmpty)
                }
                .padding(24)
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .shadow(color: .black.opacity(0.06), radius: 12, x: 0, y: 4)
                .padding(.horizontal, 24)

                // Register link
                HStack(spacing: 4) {
                    Text("Don't have an account?")
                        .foregroundStyle(.secondary)
                    Button("Register") {
                        showRegister = true
                    }
                    .fontWeight(.semibold)
                }
                .font(.footnote)
                .padding(.top, 24)
            }
            .frame(maxWidth: 420)
            .frame(maxWidth: .infinity)
        }
        .background(Color(.secondarySystemBackground))
    }

    private func loginTapped() {
        guard !username.isEmpty, !password.isEmpty else { return }
        errorMessage = nil
        isLoading = true
        Task {
            do {
                try await auth.login(username: username, password: password)
            } catch let error as APIError {
                errorMessage = error.errorDescription
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

#Preview {
    LoginView(showRegister: .constant(false))
        .environmentObject(AuthService.shared)
}
