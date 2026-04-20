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
public class TransactionsController : ControllerBase
{
    private readonly FinancialDbContext _context;

    public TransactionsController(FinancialDbContext context)
    {
        _context = context;
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public record TransactionDto(
        int Id,
        string Date,          // yyyy-MM-dd
        string Description,
        int? CategoryId,
        decimal Amount,
        string PaymentMethod, // bank | cash
        string Type           // income | expense
    );

    public record CreateTransactionRequest(
        string Date,
        string Description,
        int? CategoryId,
        decimal Amount,
        string PaymentMethod, // bank | cash
        string Type           // income | expense
    );

    public record UpdateTransactionRequest(
        string Date,
        string Description,
        int? CategoryId,
        decimal Amount,
        string PaymentMethod,
        string Type
    );

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<int?> GetUserIdAsync()
    {
        var username = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        if (username == null) return null;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        return user?.Id;
    }

    private static TransactionDto ToDto(Transaction t) => new(
        t.Id,
        t.Date.ToString("yyyy-MM-dd"),
        t.Description,
        t.CategoryId,
        t.Amount,
        t.PaymentMethod,
        t.Type
    );

    // ── Endpoints ─────────────────────────────────────────────────────────────

    /// <summary>
    /// GET /api/transactions?month=3&amp;year=2026&amp;type=expense
    /// Returns all transactions for the current user, optionally filtered by month/year/type.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<TransactionDto>>> GetAll(
        [FromQuery] int? month,
        [FromQuery] int? year,
        [FromQuery] string? type)
    {
        var userId = await GetUserIdAsync();
        if (userId == null) return Unauthorized();

        IQueryable<Transaction> query = _context.Transactions
            .Where(t => t.UserId == userId);

        if (!string.IsNullOrEmpty(type))
            query = query.Where(t => t.Type == type);

        if (month.HasValue && year.HasValue)
            query = query.Where(t => t.Date.Month == month.Value && t.Date.Year == year.Value);
        else if (year.HasValue)
            query = query.Where(t => t.Date.Year == year.Value);

        var transactions = await query
            .OrderByDescending(t => t.Date)
            .ToListAsync();

        return Ok(transactions.Select(ToDto));
    }

    /// <summary>GET /api/transactions/{id}</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<TransactionDto>> GetById(int id)
    {
        var userId = await GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (transaction == null) return NotFound();
        return Ok(ToDto(transaction));
    }

    /// <summary>POST /api/transactions — create a new transaction</summary>
    [HttpPost]
    public async Task<ActionResult<TransactionDto>> Create([FromBody] CreateTransactionRequest request)
    {
        var userId = await GetUserIdAsync();
        if (userId == null) return Unauthorized();

        if (request.Type != "income" && request.Type != "expense")
            return BadRequest("Type must be 'income' or 'expense'.");

        if (!DateOnly.TryParse(request.Date, out var date))
            return BadRequest("Invalid date format. Use yyyy-MM-dd.");

        // Category is required for expense, optional for income
        if (request.Type == "expense")
        {
            if (!request.CategoryId.HasValue)
                return BadRequest("CategoryId is required for expense transactions.");

            var categoryExists = await _context.Categories
                .AnyAsync(c => c.Id == request.CategoryId.Value && c.UserId == userId);
            if (!categoryExists) return BadRequest("Category not found.");
        }

        var transaction = new Transaction
        {
            Date = date,
            Type = request.Type,
            Description = request.Description.Trim(),
            CategoryId = request.CategoryId,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            UserId = userId.Value,
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = transaction.Id }, ToDto(transaction));
    }

    /// <summary>PUT /api/transactions/{id} — update an existing transaction</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<TransactionDto>> Update(int id, [FromBody] UpdateTransactionRequest request)
    {
        var userId = await GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (transaction == null) return NotFound();

        if (request.Type != "income" && request.Type != "expense")
            return BadRequest("Type must be 'income' or 'expense'.");

        if (!DateOnly.TryParse(request.Date, out var date))
            return BadRequest("Invalid date format. Use yyyy-MM-dd.");

        if (request.Type == "expense")
        {
            if (!request.CategoryId.HasValue)
                return BadRequest("CategoryId is required for expense transactions.");

            var categoryExists = await _context.Categories
                .AnyAsync(c => c.Id == request.CategoryId.Value && c.UserId == userId);
            if (!categoryExists) return BadRequest("Category not found.");
        }

        transaction.Date = date;
        transaction.Type = request.Type;
        transaction.Description = request.Description.Trim();
        transaction.CategoryId = request.CategoryId;
        transaction.Amount = request.Amount;
        transaction.PaymentMethod = request.PaymentMethod;

        await _context.SaveChangesAsync();
        return Ok(ToDto(transaction));
    }

    /// <summary>DELETE /api/transactions/{id}</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = await GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (transaction == null) return NotFound();

        _context.Transactions.Remove(transaction);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
