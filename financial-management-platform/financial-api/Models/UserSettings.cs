namespace FinancialApi.Models;

public class UserSettings
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string Theme { get; set; } = "light";
    public bool SidebarExpanded { get; set; } = false;
    public decimal EurRate { get; set; } = 117;
    public string DataSource { get; set; } = "remote";
}
