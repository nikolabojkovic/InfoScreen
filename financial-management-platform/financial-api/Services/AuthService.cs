using FinancialApi.Data;
using FinancialApi.Models;
using Microsoft.EntityFrameworkCore;

namespace FinancialApi.Services;

public class AuthService : IAuthService
{
    private readonly FinancialDbContext _context;
    private readonly IJwtService _jwtService;

    public AuthService(FinancialDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    public async Task<(bool Success, string? Error)> RegisterAsync(string username, string password, string? fullName)
    {
        if (await _context.Users.AnyAsync(u => u.Username == username))
            return (false, "Username already taken.");

        _context.Users.Add(new User
        {
            Username = username,
            Password = password,
            FullName = fullName ?? username,
            CreatedAt = DateTime.UtcNow,
        });

        await _context.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? Token, string? Error)> LoginAsync(string username, string password)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username && u.Password == password);
        if (user == null)
            return (false, null, "Invalid credentials.");

        var token = _jwtService.GenerateToken(user.Username, user.FullName ?? "");
        return (true, token, null);
    }
}
