import Foundation
import Security

// MARK: - Keychain helper

private enum Keychain {
    static let service = "com.example.FinancialDashboard"

    static func save(key: String, value: String) {
        guard let data = value.data(using: .utf8) else { return }
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: key
        ]
        SecItemDelete(query as CFDictionary)
        var newItem = query
        newItem[kSecValueData] = data
        SecItemAdd(newItem as CFDictionary, nil)
    }

    static func load(key: String) -> String? {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: key,
            kSecReturnData: true,
            kSecMatchLimit: kSecMatchLimitOne
        ]
        var result: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func delete(key: String) {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: key
        ]
        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - Auth DTOs

struct LoginRequest: Encodable {
    let username: String
    let password: String
}

struct LoginResponse: Decodable {
    let token: String
}

struct RegisterRequest: Encodable {
    let username: String
    let password: String
    let fullName: String?
}

struct RegisterResponse: Decodable {
    let message: String
}

// MARK: - JWT Claims helper

private struct JWTPayload: Decodable {
    let sub: String?
    let fullname: String?

    enum CodingKeys: String, CodingKey {
        case sub
        case fullname = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
    }
}

private func decodeJWTPayload(_ token: String) -> JWTPayload? {
    let parts = token.split(separator: ".")
    guard parts.count == 3 else { return nil }
    var base64 = String(parts[1])
    // Pad base64 string
    let remainder = base64.count % 4
    if remainder != 0 { base64 += String(repeating: "=", count: 4 - remainder) }
    guard let data = Data(base64Encoded: base64) else { return nil }
    return try? JSONDecoder().decode(JWTPayload.self, from: data)
}

// MARK: - AuthService

@MainActor
final class AuthService: ObservableObject {
    static let shared = AuthService()

    @Published private(set) var isLoggedIn: Bool = false
    @Published private(set) var username: String = ""
    @Published private(set) var fullName: String = ""

    private(set) var token: String? {
        didSet {
            isLoggedIn = token != nil
            if let t = token {
                let payload = decodeJWTPayload(t)
                username = payload?.sub ?? ""
                fullName = payload?.fullname ?? ""
                Keychain.save(key: "jwt_token", value: t)
            } else {
                username = ""
                fullName = ""
                Keychain.delete(key: "jwt_token")
            }
        }
    }

    private init() {
        if let saved = Keychain.load(key: "jwt_token") {
            token = saved
            isLoggedIn = true
            let payload = decodeJWTPayload(saved)
            username = payload?.sub ?? ""
            fullName = payload?.fullname ?? ""
        }
    }

    // MARK: - Public API

    func login(username: String, password: String) async throws {
        let body = LoginRequest(username: username, password: password)
        let response: LoginResponse = try await APIClient.shared.request(
            path: "/api/auth/login",
            method: .POST,
            body: body,
            authenticated: false
        )
        token = response.token
    }

    func register(username: String, password: String, fullName: String) async throws {
        let body = RegisterRequest(username: username, password: password, fullName: fullName.isEmpty ? nil : fullName)
        let _: RegisterResponse = try await APIClient.shared.request(
            path: "/api/auth/register",
            method: .POST,
            body: body,
            authenticated: false
        )
    }

    func logout() {
        token = nil
    }
}
