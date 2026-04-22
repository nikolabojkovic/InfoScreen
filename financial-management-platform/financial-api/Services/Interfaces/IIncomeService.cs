using FinancialApi.Dtos;
using FinancialApi.Services;

namespace FinancialApi.Services.Interfaces;

public interface IIncomeService
{
    Task<List<IncomeDto>> GetAllAsync(int userId, int? month, int? year);
    Task<IncomeDto?> GetByIdAsync(int id, int userId);
    Task<ServiceResult<IncomeDto>> CreateAsync(int userId, CreateIncomeRequest request);
    Task<ServiceResult<IncomeDto>> UpdateAsync(int id, int userId, UpdateIncomeRequest request);
    Task<bool> DeleteAsync(int id, int userId);
}
