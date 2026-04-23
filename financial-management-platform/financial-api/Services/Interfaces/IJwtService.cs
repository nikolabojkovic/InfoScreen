namespace FinancialApi.Services.Interfaces;

public interface IJwtService
{
    string GenerateToken(string username, string fullName);
}
