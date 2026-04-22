namespace FinancialApi.Dtos;

public record IncomeDto(
    int Id,
    string CreatedAt,
    string Description,
    decimal Amount,
    string PaymentMethod
);

public record CreateIncomeRequest(
    string CreatedAt,
    string Description,
    decimal Amount,
    string PaymentMethod
);

public record UpdateIncomeRequest(
    string CreatedAt,
    string Description,
    decimal Amount,
    string PaymentMethod
);
