namespace FinancialApi.Dtos;

public record CategoryItemDto(int Id, string Description, decimal Amount);

public record CategoryDto(
    int Id,
    string Date,
    string Name,
    string Color,
    decimal BudgetAmount,
    List<CategoryItemDto> Items,
    string CategoryType,
    int SortIndex
);

public record CreateCategoryItemRequest(string Description, decimal Amount);

public record CreateCategoryRequest(
    string Name,
    string Color,
    decimal BudgetAmount,
    List<CreateCategoryItemRequest> Items,
    string? Date,
    string? CategoryType = "unit"
);

public record SaveTemplateItemRequest(string Name, string Color, decimal BudgetAmount, List<CreateCategoryItemRequest> Items, int SortIndex = 0);

public record UpdateCategoryItemRequest(int? Id, string Description, decimal Amount);

public record UpdateCategoryRequest(
    string Name,
    string Color,
    decimal BudgetAmount,
    List<UpdateCategoryItemRequest> Items
);

public record ReorderCategoryRequest(int Id, int SortIndex);
