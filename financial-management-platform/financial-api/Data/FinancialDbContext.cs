using Microsoft.EntityFrameworkCore;
using FinancialApi.Models;

namespace FinancialApi.Data;

public class FinancialDbContext : DbContext
{
    public DbSet<User> Users => Set<User>();

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
    }
}