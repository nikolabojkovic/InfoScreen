namespace FinancialApi.Services;

public interface IJwtService
{
    string GenerateToken(string username, string fullName);
}
