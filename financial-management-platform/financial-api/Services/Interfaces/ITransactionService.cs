using FinancialApi.Dtos;
using FinancialApi.Services;

namespace FinancialApi.Services.Interfaces;

public interface ITransactionService
{
    Task<List<TransactionDto>> GetAllAsync(int userId, int? month, int? year, string? type);
    Task<TransactionDto?> GetByIdAsync(int id, int userId);
    Task<ServiceResult<TransactionDto>> CreateAsync(int userId, CreateTransactionRequest request);
    Task<ServiceResult<TransactionDto>> UpdateAsync(int id, int userId, UpdateTransactionRequest request);
    Task<bool> DeleteAsync(int id, int userId);
}
