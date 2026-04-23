using FinancialApi.Dtos;
using FinancialApi.Services;

namespace FinancialApi.Services.Interfaces;

public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllAsync(int userId, int? month, int? year);
    Task<CategoryDto?> GetByIdAsync(int id, int userId);
    Task<CategoryDto> CreateAsync(int userId, CreateCategoryRequest request);
    Task<ServiceResult<CategoryDto>> UpdateAsync(int id, int userId, UpdateCategoryRequest request);
    Task<bool> DeleteAsync(int id, int userId);
}
