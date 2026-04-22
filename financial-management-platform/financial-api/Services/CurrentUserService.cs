using FinancialApi.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FinancialApi.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly FinancialDbContext _context;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor, FinancialDbContext context)
    {
        _httpContextAccessor = httpContextAccessor;
        _context = context;
    }

    public async Task<int?> GetUserIdAsync()
    {
        var principal = _httpContextAccessor.HttpContext?.User;
        var username = principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? principal?.FindFirst("sub")?.Value;

        if (username == null) return null;

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        return user?.Id;
    }
}
