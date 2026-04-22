using FinancialApi.Data;
using FinancialApi.Dtos;
using FinancialApi.Models;
using FinancialApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FinancialApi.Services;

public class IncomeService : IIncomeService
{
    private readonly FinancialDbContext _context;

    public IncomeService(FinancialDbContext context)
    {
        _context = context;
    }

    private static IncomeDto ToDto(Transaction t) => new(
        t.Id,
        t.CreatedAt.ToString("yyyy-MM-dd"),
        t.Description,
        t.Amount,
        t.PaymentMethod
    );

    public async Task<List<IncomeDto>> GetAllAsync(int userId, int? month, int? year)
    {
        IQueryable<Transaction> query = _context.Transactions
            .Where(t => t.UserId == userId && t.Type == "income");

        if (month.HasValue && year.HasValue)
            query = query.Where(t => t.CreatedAt.Month == month.Value && t.CreatedAt.Year == year.Value);
        else if (year.HasValue)
            query = query.Where(t => t.CreatedAt.Year == year.Value);

        var incomes = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
        return incomes.Select(ToDto).ToList();
    }

    public async Task<IncomeDto?> GetByIdAsync(int id, int userId)
    {
        var income = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId && t.Type == "income");

        return income == null ? null : ToDto(income);
    }

    public async Task<ServiceResult<IncomeDto>> CreateAsync(int userId, CreateIncomeRequest request)
    {
        if (!DateTime.TryParse(request.CreatedAt, out var createdAt))
            return ServiceResult<IncomeDto>.Fail("Invalid date format. Use yyyy-MM-dd.");

        var transaction = new Transaction
        {
            CreatedAt = DateTime.SpecifyKind(createdAt.Date, DateTimeKind.Utc),
            Type = "income",
            Description = request.Description.Trim(),
            CategoryId = null,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            UserId = userId,
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();
        return ServiceResult<IncomeDto>.Ok(ToDto(transaction));
    }

    public async Task<ServiceResult<IncomeDto>> UpdateAsync(int id, int userId, UpdateIncomeRequest request)
    {
        var income = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId && t.Type == "income");

        if (income == null) return ServiceResult<IncomeDto>.Miss();

        if (!DateTime.TryParse(request.CreatedAt, out var createdAt))
            return ServiceResult<IncomeDto>.Fail("Invalid date format. Use yyyy-MM-dd.");

        income.CreatedAt = DateTime.SpecifyKind(createdAt.Date, DateTimeKind.Utc);
        income.Description = request.Description.Trim();
        income.Amount = request.Amount;
        income.PaymentMethod = request.PaymentMethod;
        income.ModifiedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return ServiceResult<IncomeDto>.Ok(ToDto(income));
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var income = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId && t.Type == "income");

        if (income == null) return false;

        _context.Transactions.Remove(income);
        await _context.SaveChangesAsync();
        return true;
    }
}
