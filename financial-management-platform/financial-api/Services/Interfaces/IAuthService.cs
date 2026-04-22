namespace FinancialApi.Services.Interfaces;

public interface IAuthService
{
    Task<(bool Success, string? Error)> RegisterAsync(string username, string password, string? fullName);
    Task<(bool Success, string? Token, string? Error)> LoginAsync(string username, string password);
}
