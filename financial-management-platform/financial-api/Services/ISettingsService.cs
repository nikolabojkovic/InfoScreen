using FinancialApi.Dtos;

namespace FinancialApi.Services;

public interface ISettingsService
{
    Task<SettingsDto> GetAsync(int userId);
    Task<SettingsDto> UpsertAsync(int userId, SettingsDto request);
}
