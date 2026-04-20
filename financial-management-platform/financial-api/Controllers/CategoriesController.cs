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
public class CategoriesController : ControllerBase
{
    private readonly FinancialDbContext _context;

    public CategoriesController(FinancialDbContext context)
    {
        _context = context;
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public record CategoryItemDto(int Id, string Description, decimal Amount);

    public record CategoryDto(
        int Id,
        string Name,
        string Color,
        decimal BudgetAmount,
        List<CategoryItemDto> Items
    );

    public record CreateCategoryRequest(
        string Name,
        string Color,
        decimal BudgetAmount,
        List<CreateCategoryItemRequest> Items
    );

    public record CreateCategoryItemRequest(string Description, decimal Amount);

    public record UpdateCategoryRequest(
        string Name,
        string Color,
        decimal BudgetAmount,
        List<UpdateCategoryItemRequest> Items
    );

    public record UpdateCategoryItemRequest(int? Id, string Description, decimal Amount);

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<int?> GetUserIdAsync()
    {
        var username = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        if (username == null) return null;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        return user?.Id;
    }

    private static CategoryDto ToDto(Category c) => new(
        c.Id,
        c.Name,
        c.Color,
        c.BudgetAmount,
        c.Items.Select(i => new CategoryItemDto(i.Id, i.Description, i.Amount)).ToList()
    );

    // ── Endpoints ─────────────────────────────────────────────────────────────

    /// <summary>GET /api/categories — all categories for the current user</summary>
    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll()
    {
        var userId = await GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var categories = await _context.Categories
            .Include(c => c.Items)
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.Name)
            .ToListAsync();

        return Ok(categories.Select(ToDto));
    }

    /// <summary>GET /api/categories/{id}</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoryDto>> GetById(int id)
    {
        var userId = await GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var category = await _context.Categories
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (category == null) return NotFound();
        return Ok(ToDto(category));
    }

    /// <summary>POST /api/categories — create a new category</summary>
    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryRequest request)
    {
        var userId = await GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var category = new Category
        {
            Name = request.Name.Trim(),
            Color = request.Color,
            BudgetAmount = request.BudgetAmount,
            UserId = userId.Value,
            Items = request.Items.Select(i => new CategoryItem
            {
                Description = i.Description.Trim(),
                Amount = i.Amount,
                UserId = userId.Value,
            }).ToList()
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = category.Id }, ToDto(category));
    }

    /// <summary>PUT /api/categories/{id} — full update (replaces items)</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<CategoryDto>> Update(int id, [FromBody] UpdateCategoryRequest request)
    {
        var userId = await GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var category = await _context.Categories
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (category == null) return NotFound();

        category.Name = request.Name.Trim();
        category.Color = request.Color;
        category.BudgetAmount = request.BudgetAmount;

        // Replace items: remove deleted, update existing, add new
        var incomingIds = request.Items.Where(i => i.Id.HasValue).Select(i => i.Id!.Value).ToHashSet();
        var toRemove = category.Items.Where(i => !incomingIds.Contains(i.Id)).ToList();
        foreach (var item in toRemove) _context.CategoryItems.Remove(item);

        foreach (var req in request.Items)
        {
            if (req.Id.HasValue)
            {
                var existing = category.Items.FirstOrDefault(i => i.Id == req.Id.Value);
                if (existing != null)
                {
                    existing.Description = req.Description.Trim();
                    existing.Amount = req.Amount;
                }
            }
            else
            {
                category.Items.Add(new CategoryItem
                {
                    Description = req.Description.Trim(),
                    Amount = req.Amount,
                    UserId = userId.Value,
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(ToDto(category));
    }

    /// <summary>DELETE /api/categories/{id}</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = await GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (category == null) return NotFound();

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
