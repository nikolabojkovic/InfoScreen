using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace financial_api.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryTypeField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CategoryType",
                table: "Categories",
                type: "varchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "unit")
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CategoryType",
                table: "Categories");
        }
    }
}
