import Foundation

// MARK: - Type-erased Encodable wrapper
// Needed to encode protocol existentials (including arrays) with JSONEncoder
private struct AnyEncodable: Encodable {
    private let _encode: (Encoder) throws -> Void
    init(_ value: some Encodable) { _encode = value.encode(to:) }
    func encode(to encoder: Encoder) throws { try _encode(encoder) }
}

enum HTTPMethod: String {
    case GET, POST, PUT, DELETE
}

enum APIError: LocalizedError {
    case invalidURL
    case noData
    case decodingFailed(Error)
    case serverError(Int, String)
    case unauthorized
    case unknown(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL."
        case .noData: return "No data received."
        case .decodingFailed(let e): return "Decode error: \(e.localizedDescription)"
        case .serverError(let code, let msg): return "Server error \(code): \(msg)"
        case .unauthorized: return "Unauthorized. Please log in again."
        case .unknown(let e): return e.localizedDescription
        }
    }
}

final class APIClient {
    static let shared = APIClient()

    // Change this to your API base URL
    var baseURL: String = "https://financial-api.developer-tool.com"

    private init() {}

    // MARK: - Core request

    func request<T: Decodable>(
        path: String,
        method: HTTPMethod = .GET,
        body: Encodable? = nil,
        authenticated: Bool = true
    ) async throws -> T {
        guard let url = URL(string: baseURL + path) else {
            throw APIError.invalidURL
        }

        var req = URLRequest(url: url)
        req.httpMethod = method.rawValue
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if authenticated {
            let token = await AuthService.shared.token
            if let token {
                req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
        }

        if let body {
            req.httpBody = try JSONEncoder().encode(AnyEncodable(body))
        }

        let (data, response) = try await URLSession.shared.data(for: req)

        guard let http = response as? HTTPURLResponse else {
            throw APIError.noData
        }

        if http.statusCode == 401 {
            await AuthService.shared.logout()
            throw APIError.unauthorized
        }

        if !(200..<300).contains(http.statusCode) {
            let message = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw APIError.serverError(http.statusCode, message)
        }

        do {
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingFailed(error)
        }
    }

    // Variant for requests that return no body (204)
    func requestVoid(
        path: String,
        method: HTTPMethod = .DELETE,
        body: Encodable? = nil,
        authenticated: Bool = true
    ) async throws {
        guard let url = URL(string: baseURL + path) else {
            throw APIError.invalidURL
        }

        var req = URLRequest(url: url)
        req.httpMethod = method.rawValue
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if authenticated {
            let token = await AuthService.shared.token
            if let token {
                req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
        }

        if let body {
            req.httpBody = try JSONEncoder().encode(AnyEncodable(body))
        }

        let (data, response) = try await URLSession.shared.data(for: req)

        guard let http = response as? HTTPURLResponse else { return }

        if http.statusCode == 401 {
            await AuthService.shared.logout()
            throw APIError.unauthorized
        }

        if !(200..<300).contains(http.statusCode) {
            let message = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw APIError.serverError(http.statusCode, message)
        }
    }
}
