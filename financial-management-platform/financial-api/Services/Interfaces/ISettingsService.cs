using FinancialApi.Dtos;
using FinancialApi.Services;

namespace FinancialApi.Services.Interfaces;

public interface ISettingsService
{
    Task<SettingsDto> GetAsync(int userId);
    Task<SettingsDto> UpsertAsync(int userId, SettingsDto request);
}
