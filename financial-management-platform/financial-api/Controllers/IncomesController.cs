using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using FinancialApi.Data;
using FinancialApi.Models;

namespace financial_api.Controllers;

/// <summary>
/// Convenience endpoint that proxies to /api/transactions with type=income.
/// Prefer using /api/transactions?type=income directly.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IncomesController : ControllerBase
{
    private readonly FinancialDbContext _context;

    public IncomesController(FinancialDbContext context)
    {
        _context = context;
    }

    public record IncomeDto(
        int Id,
        string Date,
        string Description,
        decimal Amount,
        string PaymentMethod
    );

    public record CreateIncomeRequest(
        string Date,
        string Description,
        decimal Amount,
        string PaymentMethod
    );

    public record UpdateIncomeRequest(
        string Date,
        string Description,
        decimal Amount,
        string PaymentMethod
    );

    private async Task<int?> GetUserIdAsync()
    {
        var username = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        if (username == null) return null;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        return user?.Id;
    }

    private static IncomeDto ToDto(Transaction t) => new(
        t.Id,
        t.Date.ToString("yyyy-MM-dd"),
        t.Description,
        t.Amount,
        t.PaymentMethod
    );

    /// <summary>GET /api/incomes?month=3&amp;year=2026</summary>
    [HttpGet]
    public async Task<ActionResult<List<IncomeDto>>> GetAll(
        [FromQuery] int? month,
        [FromQuery] int? year)
    {
        var userId = await GetUserIdAsync();
        if (userId == null) return Unauthorized();

        IQueryable<Transaction> query = _context.Transactions
            .Where(t => t.UserId == userId && t.Type == "income");

        if (month.HasValue && year.HasValue)
            query = query.Where(t => t.Date.Month == month.Value && t.Date.Year == year.Value);
        else if (year.HasValue)
            query = query.Where(t => t.Date.Year == year.Value);

        var incomes = await query.OrderByDescending(t => t.Date).ToListAsync();
        return Ok(incomes.Select(ToDto));
    }

    /// <summary>GET /api/incomes/{id}</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<IncomeDto>> GetById(int id)
    {
        var userId = await GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var income = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId && t.Type == "income");

        if (income == null) return NotFound();
        return Ok(ToDto(income));
    }

    /// <summary>POST /api/incomes — create a new income transaction</summary>
    [HttpPost]
    public async Task<ActionResult<IncomeDto>> Create([FromBody] CreateIncomeRequest request)
    {
        var userId = await GetUserIdAsync();
        if (userId == null) return Unauthorized();

        if (!DateOnly.TryParse(request.Date, out var date))
            return BadRequest("Invalid date format. Use yyyy-MM-dd.");

        var transaction = new Transaction
        {
            Date = date,
            Type = "income",
            Description = request.Description.Trim(),
            CategoryId = null,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            UserId = userId.Value,
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = transaction.Id }, ToDto(transaction));
    }

    /// <summary>PUT /api/incomes/{id} — update an income transaction</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<IncomeDto>> Update(int id, [FromBody] UpdateIncomeRequest request)
    {
        var userId = await GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var income = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId && t.Type == "income");

        if (income == null) return NotFound();

        if (!DateOnly.TryParse(request.Date, out var date))
            return BadRequest("Invalid date format. Use yyyy-MM-dd.");

        income.Date = date;
        income.Description = request.Description.Trim();
        income.Amount = request.Amount;
        income.PaymentMethod = request.PaymentMethod;

        await _context.SaveChangesAsync();
        return Ok(ToDto(income));
    }

    /// <summary>DELETE /api/incomes/{id}</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = await GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var income = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId && t.Type == "income");

        if (income == null) return NotFound();

        _context.Transactions.Remove(income);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
