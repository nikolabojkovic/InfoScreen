namespace FinancialApi.Models;

public class Transaction
{
    public int Id { get; set; }
    public string Type { get; set; } = "expense"; // income | expense
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }
    public string PaymentMethod { get; set; } = string.Empty; // bank | cash
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ModifiedAt { get; set; }
}