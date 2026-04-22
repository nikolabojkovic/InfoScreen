namespace FinancialApi.Services.Interfaces;

public interface ICurrentUserService
{
    /// <summary>Returns the DB user ID for the current JWT principal, or null if not authenticated.</summary>
    Task<int?> GetUserIdAsync();
}
