using FinancialApi.Dtos;
using FinancialApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace financial_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IncomesController : ControllerBase
{
    private readonly IIncomeService _incomeService;
    private readonly ICurrentUserService _currentUser;

    public IncomesController(IIncomeService incomeService, ICurrentUserService currentUser)
    {
        _incomeService = incomeService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<List<IncomeDto>>> GetAll([FromQuery] int? month, [FromQuery] int? year)
    {
        var userId = await _currentUser.GetUserIdAsync();
        if (userId == null) return Unauthorized();

        return Ok(await _incomeService.GetAllAsync(userId.Value, month, year));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<IncomeDto>> GetById(int id)
    {
        var userId = await _currentUser.GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var income = await _incomeService.GetByIdAsync(id, userId.Value);
        return income == null ? NotFound() : Ok(income);
    }

    [HttpPost]
    public async Task<ActionResult<IncomeDto>> Create([FromBody] CreateIncomeRequest request)
    {
        var userId = await _currentUser.GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var result = await _incomeService.CreateAsync(userId.Value, request);
        if (result.Error != null) return BadRequest(result.Error);

        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<IncomeDto>> Update(int id, [FromBody] UpdateIncomeRequest request)
    {
        var userId = await _currentUser.GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var result = await _incomeService.UpdateAsync(id, userId.Value, request);
        if (result.NotFound) return NotFound();
        if (result.Error != null) return BadRequest(result.Error);

        return Ok(result.Value);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = await _currentUser.GetUserIdAsync();
        if (userId == null) return Unauthorized();

        return await _incomeService.DeleteAsync(id, userId.Value) ? NoContent() : NotFound();
    }
}
