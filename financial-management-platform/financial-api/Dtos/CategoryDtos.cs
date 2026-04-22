namespace FinancialApi.Dtos;

public record CategoryItemDto(int Id, string Description, decimal Amount);

public record CategoryDto(
    int Id,
    string Name,
    string Color,
    decimal BudgetAmount,
    List<CategoryItemDto> Items
);

public record CreateCategoryItemRequest(string Description, decimal Amount);

public record CreateCategoryRequest(
    string Name,
    string Color,
    decimal BudgetAmount,
    List<CreateCategoryItemRequest> Items
);

public record UpdateCategoryItemRequest(int? Id, string Description, decimal Amount);

public record UpdateCategoryRequest(
    string Name,
    string Color,
    decimal BudgetAmount,
    List<UpdateCategoryItemRequest> Items
);
