using Microsoft.EntityFrameworkCore;
using FinancialApi.Models;

namespace FinancialApi.Data;

public class FinancialDbContext : DbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Income> Incomes => Set<Income>();
    public DbSet<Category> Categories => Set<Category>();

    public FinancialDbContext(DbContextOptions<FinancialDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");

            entity.HasKey(user => user.Id);

            entity.Property(user => user.Username)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(user => user.Password)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(user => user.FullName)
                .HasMaxLength(200)
                .IsRequired();

            entity.HasIndex(user => user.Username)
                .IsUnique();

            entity.HasData(new User
            {
                Id = 1,
                Username = "admin",
                Password = "Admin123!",
                FullName = "Administrator",
            });
        });

        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.User)
            .WithMany(u => u.Transactions)
            .HasForeignKey(t => t.UserId);

        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.Category)
            .WithMany()
            .HasForeignKey(t => t.CategoryId);

        modelBuilder.Entity<Income>()
            .HasOne(i => i.User)
            .WithMany(u => u.Incomes)
            .HasForeignKey(i => i.UserId);

        modelBuilder.Entity<Category>()
            .HasOne(c => c.User)
            .WithMany(u => u.Categories)
            .HasForeignKey(c => c.UserId);
    }
}