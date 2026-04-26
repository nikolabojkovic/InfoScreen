import Foundation

// MARK: - API Response Models

struct CategoryItem: Codable {
    var id: Int?
    var description: String
    var amount: Double
}

struct Category: Codable, Identifiable {
    var id: Int
    var date: String
    var name: String
    var icon: String        // stored as "color" in the API
    var budgetAmount: Double
    var items: [CategoryItem]
    var categoryType: String
    var sortIndex: Int

    enum CodingKeys: String, CodingKey {
        case id, date, name, budgetAmount, items, categoryType, sortIndex
        case icon = "color"
    }
}

// MARK: - Request Models

struct CreateCategoryItemRequest: Encodable {
    var description: String
    var amount: Double
}

struct CreateCategoryRequest: Encodable {
    var name: String
    var color: String           // icon emoji
    var budgetAmount: Double
    var items: [CreateCategoryItemRequest]
    var date: String?
    var categoryType: String?
}

struct UpdateCategoryItemRequest: Encodable {
    var id: Int?
    var description: String
    var amount: Double
}

struct UpdateCategoryRequest: Encodable {
    var name: String
    var color: String
    var budgetAmount: Double
    var items: [UpdateCategoryItemRequest]
}

struct ReorderCategoryRequest: Encodable {
    var id: Int
    var sortIndex: Int
}

struct SaveTemplateItemRequest: Encodable {
    var name: String
    var color: String
    var budgetAmount: Double
    var items: [CreateCategoryItemRequest]
    var sortIndex: Int
}

// MARK: - Budget summary (computed)

struct CategorySummary: Identifiable {
    var id: Int { category.id }
    var category: Category
    var budgetAmount: Double
    var actualAmount: Double
    var difference: Double          // budget - actual (positive = under budget)
    var differencePercent: Double
    var completionPercent: Double   // (actual / budget) * 100
}
