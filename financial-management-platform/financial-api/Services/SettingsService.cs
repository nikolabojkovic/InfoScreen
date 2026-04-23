using FinancialApi.Data;
using FinancialApi.Dtos;
using FinancialApi.Models;
using FinancialApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FinancialApi.Services;

public class SettingsService : ISettingsService
{
    private readonly FinancialDbContext _context;

    public SettingsService(FinancialDbContext context)
    {
        _context = context;
    }

    private static SettingsDto ToDto(UserSettings s) =>
        new(s.Theme, s.SidebarExpanded, s.EurRate, s.DataSource);

    public async Task<SettingsDto> GetAsync(int userId)
    {
        var settings = await _context.UserSettings.FirstOrDefaultAsync(s => s.UserId == userId);
        return settings == null
            ? new SettingsDto("light", false, 117, "remote")
            : ToDto(settings);
    }

    public async Task<SettingsDto> UpsertAsync(int userId, SettingsDto request)
    {
        var settings = await _context.UserSettings.FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings == null)
        {
            settings = new UserSettings { UserId = userId, CreatedAt = DateTime.UtcNow };
            _context.UserSettings.Add(settings);
        }
        else
        {
            settings.ModifiedAt = DateTime.UtcNow;
        }

        settings.Theme = request.Theme == "dark" ? "dark" : "light";
        settings.SidebarExpanded = request.SidebarExpanded;
        settings.EurRate = request.EurRate > 0 ? request.EurRate : 117;
        settings.DataSource = request.DataSource == "remote" ? "remote" : "local";

        await _context.SaveChangesAsync();
        return ToDto(settings);
    }
}
