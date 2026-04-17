namespace FinancialApi.Models;

public class User
{
    public int Id { get; set; }

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public ICollection<Transaction> Transactions { get; set; }
    public ICollection<Income> Incomes { get; set; }
    public ICollection<Category> Categories { get; set; }
}