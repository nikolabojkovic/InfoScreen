using FinancialApi.Data;
using FinancialApi.Dtos;
using FinancialApi.Models;
using FinancialApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FinancialApi.Services;

public class TransactionService : ITransactionService
{
    private readonly FinancialDbContext _context;

    public TransactionService(FinancialDbContext context)
    {
        _context = context;
    }

    private static TransactionDto ToDto(Transaction t) => new(
        t.Id,
        t.Date.ToString("yyyy-MM-dd"),
        t.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
        t.Description,
        t.CategoryId,
        t.Amount,
        t.PaymentMethod,
        t.Type
    );

    public async Task<List<TransactionDto>> GetAllAsync(int userId, int? month, int? year, string? type)
    {
        IQueryable<Transaction> query = _context.Transactions.Where(t => t.UserId == userId);

        if (!string.IsNullOrEmpty(type))
            query = query.Where(t => t.Type == type);

        if (month.HasValue && year.HasValue)
            query = query.Where(t => t.Date.Month == month.Value && t.Date.Year == year.Value);
        else if (year.HasValue)
            query = query.Where(t => t.Date.Year == year.Value);

        var transactions = await query.OrderByDescending(t => t.Date).ThenByDescending(t => t.Id).ToListAsync();
        return transactions.Select(ToDto).ToList();
    }

    public async Task<TransactionDto?> GetByIdAsync(int id, int userId)
    {
        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        return transaction == null ? null : ToDto(transaction);
    }

    public async Task<ServiceResult<TransactionDto>> CreateAsync(int userId, CreateTransactionRequest request)
    {
        if (request.Type != "income" && request.Type != "expense")
            return ServiceResult<TransactionDto>.Fail("Type must be 'income' or 'expense'.");

        if (!DateOnly.TryParse(request.Date, out var date))
            return ServiceResult<TransactionDto>.Fail("Invalid date format. Use yyyy-MM-dd.");

        if (request.Type == "expense")
        {
            if (!request.CategoryId.HasValue)
                return ServiceResult<TransactionDto>.Fail("CategoryId is required for expense transactions.");

            var categoryExists = await _context.Categories
                .AnyAsync(c => c.Id == request.CategoryId.Value && c.UserId == userId);
            if (!categoryExists)
                return ServiceResult<TransactionDto>.Fail("Category not found.");
        }

        var transaction = new Transaction
        {
            Date = date,
            CreatedAt = DateTime.UtcNow,
            Type = request.Type,
            Description = request.Description.Trim(),
            CategoryId = request.CategoryId,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            UserId = userId,
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();
        return ServiceResult<TransactionDto>.Ok(ToDto(transaction));
    }

    public async Task<ServiceResult<TransactionDto>> UpdateAsync(int id, int userId, UpdateTransactionRequest request)
    {
        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (transaction == null) return ServiceResult<TransactionDto>.Miss();

        if (request.Type != "income" && request.Type != "expense")
            return ServiceResult<TransactionDto>.Fail("Type must be 'income' or 'expense'.");

        if (!DateOnly.TryParse(request.Date, out var date))
            return ServiceResult<TransactionDto>.Fail("Invalid date format. Use yyyy-MM-dd.");

        if (request.Type == "expense")
        {
            if (!request.CategoryId.HasValue)
                return ServiceResult<TransactionDto>.Fail("CategoryId is required for expense transactions.");

            var categoryExists = await _context.Categories
                .AnyAsync(c => c.Id == request.CategoryId.Value && c.UserId == userId);
            if (!categoryExists)
                return ServiceResult<TransactionDto>.Fail("Category not found.");
        }

        transaction.Date = date;
        transaction.Type = request.Type;
        transaction.Description = request.Description.Trim();
        transaction.CategoryId = request.CategoryId;
        transaction.Amount = request.Amount;
        transaction.PaymentMethod = request.PaymentMethod;
        transaction.ModifiedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return ServiceResult<TransactionDto>.Ok(ToDto(transaction));
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var transaction = await _context.Transactions
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (transaction == null) return false;

        _context.Transactions.Remove(transaction);
        await _context.SaveChangesAsync();
        return true;
    }
}
