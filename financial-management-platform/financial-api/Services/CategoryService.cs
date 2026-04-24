using FinancialApi.Data;
using FinancialApi.Dtos;
using FinancialApi.Models;
using FinancialApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FinancialApi.Services;

public class CategoryService : ICategoryService
{
    private readonly FinancialDbContext _context;

    public CategoryService(FinancialDbContext context)
    {
        _context = context;
    }

    private static CategoryDto ToDto(Category c) => new(
        c.Id,
        c.Date.ToString("yyyy-MM-dd"),
        c.Name,
        c.Color,
        c.BudgetAmount,
        c.Items.Select(i => new CategoryItemDto(i.Id, i.Description, i.Amount)).ToList(),
        c.CategoryType,
        c.SortIndex
    );

    public async Task<List<CategoryDto>> GetAllAsync(int userId, int? month, int? year)
    {
        IQueryable<Category> query = _context.Categories
            .Include(c => c.Items)
            .Where(c => c.UserId == userId && c.CategoryType == "unit");

        if (month.HasValue && year.HasValue)
            query = query.Where(c => c.Date.Month == month.Value && c.Date.Year == year.Value);
        else if (year.HasValue)
            query = query.Where(c => c.Date.Year == year.Value);

        var categories = await query.OrderBy(c => c.SortIndex).ThenBy(c => c.Name).ToListAsync();
        return categories.Select(ToDto).ToList();
    }

    public async Task<List<CategoryDto>> GetTemplatesAsync(int userId)
    {
        var templates = await _context.Categories
            .Include(c => c.Items)
            .Where(c => c.UserId == userId && c.CategoryType == "template")
            .OrderBy(c => c.SortIndex).ThenBy(c => c.Name)
            .ToListAsync();
        return templates.Select(ToDto).ToList();
    }

    public async Task<List<CategoryDto>> SaveTemplatesAsync(int userId, List<SaveTemplateItemRequest> items)
    {
        // Delete existing templates for this user
        var existing = await _context.Categories
            .Where(c => c.UserId == userId && c.CategoryType == "template")
            .ToListAsync();
        _context.Categories.RemoveRange(existing);

        // Create new templates
        var templates = items.Select((item, index) => new Category
        {
            Name = item.Name.Trim(),
            Color = item.Color,
            BudgetAmount = item.BudgetAmount,
            SortIndex = item.SortIndex,
            UserId = userId,
            CategoryType = "template",
            Date = DateOnly.MinValue,
            CreatedAt = DateTime.UtcNow,
            Items = item.Items.Select(i => new CategoryItem
            {
                Description = i.Description.Trim(),
                Amount = i.Amount,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
            }).ToList(),
        }).ToList();

        _context.Categories.AddRange(templates);
        await _context.SaveChangesAsync();
        return templates.Select(ToDto).ToList();
    }

    public async Task<CategoryDto?> GetByIdAsync(int id, int userId)
    {
        var category = await _context.Categories
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        return category == null ? null : ToDto(category);
    }

    public async Task<CategoryDto> CreateAsync(int userId, CreateCategoryRequest request)
    {
        DateOnly date = DateOnly.FromDateTime(DateTime.UtcNow);
        if (!string.IsNullOrWhiteSpace(request.Date)
            && DateOnly.TryParse(request.Date, out var parsed))
        {
            date = parsed;
        }

        var category = new Category
        {
            Name = request.Name.Trim(),
            Color = request.Color,
            BudgetAmount = request.BudgetAmount,
            UserId = userId,
            CategoryType = (request.CategoryType ?? "unit") == "template" ? "template" : "unit",
            Date = date,
            SortIndex = await _context.Categories
                .Where(c => c.UserId == userId && c.CategoryType == ((request.CategoryType ?? "unit") == "template" ? "template" : "unit"))
                .CountAsync(),
            CreatedAt = DateTime.UtcNow,
            Items = request.Items.Select(i => new CategoryItem
            {
                Description = i.Description.Trim(),
                Amount = i.Amount,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
            }).ToList(),
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();
        return ToDto(category);
    }

    public async Task<ServiceResult<CategoryDto>> UpdateAsync(int id, int userId, UpdateCategoryRequest request)
    {
        var category = await _context.Categories
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (category == null) return ServiceResult<CategoryDto>.Miss();

        category.Name = request.Name.Trim();
        category.Color = request.Color;
        category.BudgetAmount = request.BudgetAmount;
        category.ModifiedAt = DateTime.UtcNow;

        var incomingIds = request.Items
            .Where(i => i.Id.HasValue)
            .Select(i => i.Id!.Value)
            .ToHashSet();

        var toRemove = category.Items.Where(i => !incomingIds.Contains(i.Id)).ToList();
        foreach (var item in toRemove)
            _context.CategoryItems.Remove(item);

        foreach (var req in request.Items)
        {
            if (req.Id.HasValue)
            {
                var existing = category.Items.FirstOrDefault(i => i.Id == req.Id.Value);
                if (existing != null)
                {
                    existing.Description = req.Description.Trim();
                    existing.Amount = req.Amount;
                    existing.ModifiedAt = DateTime.UtcNow;
                }
            }
            else
            {
                category.Items.Add(new CategoryItem
                {
                    Description = req.Description.Trim(),
                    Amount = req.Amount,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow,
                });
            }
        }

        await _context.SaveChangesAsync();
        return ServiceResult<CategoryDto>.Ok(ToDto(category));
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (category == null) return false;

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReorderAsync(int userId, List<ReorderCategoryRequest> requests)
    {
        var ids = requests.Select(r => r.Id).ToList();
        var categories = await _context.Categories
            .Where(c => c.UserId == userId && ids.Contains(c.Id))
            .ToListAsync();

        if (categories.Count == 0) return false;

        foreach (var req in requests)
        {
            var cat = categories.FirstOrDefault(c => c.Id == req.Id);
            if (cat != null)
            {
                cat.SortIndex = req.SortIndex;
                cat.ModifiedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
