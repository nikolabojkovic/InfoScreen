namespace FinancialApi.Dtos;

public record TransactionDto(
    int Id,
    string Date,
    string CreatedAt,
    string Description,
    int? CategoryId,
    decimal Amount,
    string PaymentMethod,
    string Type
);

public record CreateTransactionRequest(
    string Date,
    string Description,
    int? CategoryId,
    decimal Amount,
    string PaymentMethod,
    string Type
);

public record UpdateTransactionRequest(
    string Date,
    string Description,
    int? CategoryId,
    decimal Amount,
    string PaymentMethod,
    string Type
);
