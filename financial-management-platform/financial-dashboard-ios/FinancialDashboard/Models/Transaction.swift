import Foundation

// MARK: - Transaction (expense)

struct Transaction: Codable, Identifiable {
    var id: Int
    var date: String        // yyyy-MM-dd (user-selected date)
    var createdAt: String   // ISO 8601 datetime (server timestamp)
    var description: String
    var categoryId: Int?
    var amount: Double
    var paymentMethod: String  // "bank" | "cash"
    var type: String           // "expense"
}

// MARK: - Income record

struct IncomeRecord: Codable, Identifiable {
    var id: Int
    var date: String
    var createdAt: String
    var description: String
    var amount: Double
    var paymentMethod: String  // "bank" | "cash" | "withdrawal"
}

// MARK: - Request models

struct CreateTransactionRequest: Encodable {
    var date: String
    var description: String
    var categoryId: Int?
    var amount: Double
    var paymentMethod: String
    var type: String = "expense"
}

struct UpdateTransactionRequest: Encodable {
    var date: String
    var description: String
    var categoryId: Int?
    var amount: Double
    var paymentMethod: String
    var type: String = "expense"
}

struct CreateIncomeRequest: Encodable {
    var date: String
    var description: String
    var amount: Double
    var paymentMethod: String
}

struct UpdateIncomeRequest: Encodable {
    var date: String
    var description: String
    var amount: Double
    var paymentMethod: String
}
