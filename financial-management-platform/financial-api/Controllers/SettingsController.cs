using FinancialApi.Dtos;
using FinancialApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace financial_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;
    private readonly ICurrentUserService _currentUser;

    public SettingsController(ISettingsService settingsService, ICurrentUserService currentUser)
    {
        _settingsService = settingsService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<SettingsDto>> Get()
    {
        var userId = await _currentUser.GetUserIdAsync();
        if (userId == null) return Unauthorized();

        return Ok(await _settingsService.GetAsync(userId.Value));
    }

    [HttpPut]
    public async Task<ActionResult<SettingsDto>> Update([FromBody] SettingsDto request)
    {
        var userId = await _currentUser.GetUserIdAsync();
        if (userId == null) return Unauthorized();

        return Ok(await _settingsService.UpsertAsync(userId.Value, request));
    }
}
