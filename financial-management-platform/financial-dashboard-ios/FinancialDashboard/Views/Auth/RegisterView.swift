import SwiftUI

struct RegisterView: View {
    @EnvironmentObject private var auth: AuthService

    @State private var username = ""
    @State private var fullName = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var successMessage: String?
    @Binding var showRegister: Bool

    private var passwordMismatch: Bool {
        !confirmPassword.isEmpty && password != confirmPassword
    }

    private var formValid: Bool {
        !username.isEmpty && !password.isEmpty && !confirmPassword.isEmpty
            && password == confirmPassword
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Header
                VStack(spacing: 12) {
                    Image(systemName: "person.badge.plus")
                        .font(.system(size: 52))
                        .foregroundStyle(.tint)
                    Text("Create Account")
                        .font(.title2)
                        .fontWeight(.bold)
                    Text("Register to get started")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.top, 60)
                .padding(.bottom, 40)

                // Card
                VStack(spacing: 20) {
                    FieldView(label: "Full Name (optional)", icon: "person.text.rectangle") {
                        TextField("John Doe", text: $fullName)
                            .textContentType(.name)
                            .autocorrectionDisabled()
                    }

                    FieldView(label: "Username", icon: "at") {
                        TextField("Choose a username", text: $username)
                            .textContentType(.newPassword)
                            .autocorrectionDisabled()
                            .textInputAutocapitalization(.never)
                    }

                    FieldView(label: "Password", icon: "lock") {
                        SecureField("At least 6 characters", text: $password)
                            .textContentType(.newPassword)
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Label("Confirm Password", systemImage: "lock.rotation")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        SecureField("Re-enter your password", text: $confirmPassword)
                            .textContentType(.newPassword)
                            .padding(12)
                            .background(Color(.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(passwordMismatch ? Color.red : Color.clear, lineWidth: 1.5)
                            )
                        if passwordMismatch {
                            Text("Passwords do not match")
                                .font(.caption)
                                .foregroundStyle(.red)
                        }
                    }

                    // Error / Success banners
                    if let error = errorMessage {
                        BannerView(message: error, style: .error)
                    }
                    if let success = successMessage {
                        BannerView(message: success, style: .success)
                    }

                    Button(action: registerTapped) {
                        Group {
                            if isLoading {
                                ProgressView().tint(.white)
                            } else {
                                Text("Create Account")
                                    .fontWeight(.semibold)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                    }
                    .buttonStyle(.borderedProminent)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .disabled(isLoading || !formValid)
                }
                .padding(24)
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .shadow(color: .black.opacity(0.06), radius: 12, x: 0, y: 4)
                .padding(.horizontal, 24)

                // Back to login
                HStack(spacing: 4) {
                    Text("Already have an account?")
                        .foregroundStyle(.secondary)
                    Button("Sign In") {
                        showRegister = false
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

    private func registerTapped() {
        guard formValid else { return }
        errorMessage = nil
        successMessage = nil
        isLoading = true
        Task {
            do {
                try await auth.register(username: username, password: password, fullName: fullName)
                successMessage = "Account created! You can now sign in."
                // Auto-navigate back to login after a short delay
                try? await Task.sleep(for: .seconds(1.5))
                showRegister = false
            } catch let error as APIError {
                errorMessage = error.errorDescription
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

// MARK: - Reusable sub-views

private struct FieldView<Content: View>: View {
    let label: String
    let icon: String
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Label(label, systemImage: icon)
                .font(.caption)
                .foregroundStyle(.secondary)
            content()
                .padding(12)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 10))
        }
    }
}

private enum BannerStyle { case error, success }

private struct BannerView: View {
    let message: String
    let style: BannerStyle

    private var color: Color { style == .error ? .red : .green }
    private var icon: String { style == .error ? "exclamationmark.circle.fill" : "checkmark.circle.fill" }

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
            Text(message).font(.footnote)
        }
        .foregroundStyle(color)
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

#Preview {
    RegisterView(showRegister: .constant(true))
        .environmentObject(AuthService.shared)
}
