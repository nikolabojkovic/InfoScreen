using Microsoft.EntityFrameworkCore;
using FinancialApi.Models;

namespace FinancialApi.Data;

public class FinancialDbContext : DbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<CategoryItem> CategoryItems => Set<CategoryItem>();

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
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Username).HasMaxLength(100).IsRequired();
            entity.Property(u => u.Password).HasMaxLength(255).IsRequired();
            entity.Property(u => u.FullName).HasMaxLength(200).IsRequired();
            entity.HasIndex(u => u.Username).IsUnique();
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("Categories");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).HasMaxLength(200).IsRequired();
            entity.Property(c => c.Color).HasMaxLength(20).IsRequired().HasDefaultValue("#2196f3");
            entity.Property(c => c.BudgetAmount).HasColumnType("decimal(18,2)");
            entity.HasOne(c => c.User)
                  .WithMany(u => u.Categories)
                  .HasForeignKey(c => c.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CategoryItem>(entity =>
        {
            entity.ToTable("CategoryItems");
            entity.HasKey(ci => ci.Id);
            entity.Property(ci => ci.Description).HasMaxLength(500).IsRequired();
            entity.Property(ci => ci.Amount).HasColumnType("decimal(18,2)");
            entity.HasOne(ci => ci.Category)
                  .WithMany(c => c.Items)
                  .HasForeignKey(ci => ci.CategoryId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(ci => ci.User)
                  .WithMany(u => u.CategoryItems)
                  .HasForeignKey(ci => ci.UserId)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.ToTable("Transactions");
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Type).HasMaxLength(10).IsRequired();
            entity.Property(t => t.Description).HasMaxLength(500).IsRequired();
            entity.Property(t => t.PaymentMethod).HasMaxLength(20).IsRequired();
            entity.Property(t => t.Amount).HasColumnType("decimal(18,2)");
            entity.HasOne(t => t.User)
                  .WithMany(u => u.Transactions)
                  .HasForeignKey(t => t.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(t => t.Category)
                  .WithMany()
                  .HasForeignKey(t => t.CategoryId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
