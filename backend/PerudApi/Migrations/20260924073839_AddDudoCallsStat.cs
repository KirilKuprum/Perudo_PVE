using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PerudApi.Migrations
{
    /// <inheritdoc />
    public partial class AddDudoCallsStat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FailedDudoCalls",
                table: "GameStates",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SuccessfulDudoCalls",
                table: "GameStates",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FailedDudoCalls",
                table: "GameStates");

            migrationBuilder.DropColumn(
                name: "SuccessfulDudoCalls",
                table: "GameStates");
        }
    }
}
