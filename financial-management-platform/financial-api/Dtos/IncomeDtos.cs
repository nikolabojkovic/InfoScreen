namespace FinancialApi.Dtos;

public record IncomeDto(
    int Id,
    string Date,
    string CreatedAt,
    string Description,
    decimal Amount,
    string PaymentMethod
);

public record CreateIncomeRequest(
    string Date,
    string Description,
    decimal Amount,
    string PaymentMethod
);

public record UpdateIncomeRequest(
    string Date,
    string Description,
    decimal Amount,
    string PaymentMethod
);
