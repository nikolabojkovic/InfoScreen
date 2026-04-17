using System;
namespace FinancialApi.Models
{
    public class Income
    {
        public int Id { get; set; }
        public string Description { get; set; }
        public string Type { get; set; } // BankAccount, Withdrawal, Cash
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
    }
}