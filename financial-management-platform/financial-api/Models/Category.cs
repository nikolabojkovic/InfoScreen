namespace FinancialApi.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#2196f3";
    public decimal BudgetAmount { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public ICollection<CategoryItem> Items { get; set; } = new List<CategoryItem>();
}