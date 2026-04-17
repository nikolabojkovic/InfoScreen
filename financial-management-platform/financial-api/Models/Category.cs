using System;
namespace FinancialApi.Models
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public decimal MonthlyBudget { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
        public DateTime Date { get; set; }
    }
}