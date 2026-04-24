using FinancialApi.Dtos;
using FinancialApi.Services;

namespace FinancialApi.Services.Interfaces;

public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllAsync(int userId, int? month, int? year);
    Task<List<CategoryDto>> GetTemplatesAsync(int userId);
    Task<List<CategoryDto>> SaveTemplatesAsync(int userId, List<SaveTemplateItemRequest> items);
    Task<CategoryDto?> GetByIdAsync(int id, int userId);
    Task<CategoryDto> CreateAsync(int userId, CreateCategoryRequest request);
    Task<ServiceResult<CategoryDto>> UpdateAsync(int id, int userId, UpdateCategoryRequest request);
    Task<bool> DeleteAsync(int id, int userId);
    Task<bool> ReorderAsync(int userId, List<ReorderCategoryRequest> requests);
}
