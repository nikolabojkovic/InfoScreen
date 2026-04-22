namespace FinancialApi.Dtos;

public record TransactionDto(
    int Id,
    string CreatedAt,
    string Description,
    int? CategoryId,
    decimal Amount,
    string PaymentMethod,
    string Type
);

public record CreateTransactionRequest(
    string CreatedAt,
    string Description,
    int? CategoryId,
    decimal Amount,
    string PaymentMethod,
    string Type
);

public record UpdateTransactionRequest(
    string CreatedAt,
    string Description,
    int? CategoryId,
    decimal Amount,
    string PaymentMethod,
    string Type
);
