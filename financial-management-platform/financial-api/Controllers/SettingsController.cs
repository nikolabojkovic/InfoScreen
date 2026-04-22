using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using FinancialApi.Data;
using FinancialApi.Models;

namespace financial_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly FinancialDbContext _context;

    public SettingsController(FinancialDbContext context)
    {
        _context = context;
    }

    public record SettingsDto(
        string Theme,
        bool SidebarExpanded,
        decimal EurRate,
        string DataSource
    );

    private async Task<int?> GetUserIdAsync()
    {
        var username = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        if (username == null) return null;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        return user?.Id;
    }

    private static SettingsDto ToDto(UserSettings s) => new(s.Theme, s.SidebarExpanded, s.EurRate, s.DataSource);

    /// <summary>GET /api/settings — get settings for current user</summary>
    [HttpGet]
    public async Task<ActionResult<SettingsDto>> Get()
    {
        var userId = await GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var settings = await _context.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings == null)
        {
            // Return defaults if not yet created
            return Ok(new SettingsDto("light", false, 117, "remote"));
        }

        return Ok(ToDto(settings));
    }

    /// <summary>PUT /api/settings — upsert settings for current user</summary>
    [HttpPut]
    public async Task<ActionResult<SettingsDto>> Update([FromBody] SettingsDto request)
    {
        var userId = await GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var settings = await _context.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings == null)
        {
            settings = new UserSettings { UserId = userId.Value };
            _context.UserSettings.Add(settings);
        }

        settings.Theme = request.Theme == "dark" ? "dark" : "light";
        settings.SidebarExpanded = request.SidebarExpanded;
        settings.EurRate = request.EurRate > 0 ? request.EurRate : 117;
        settings.DataSource = request.DataSource == "remote" ? "remote" : "local";

        await _context.SaveChangesAsync();
        return Ok(ToDto(settings));
    }
}
