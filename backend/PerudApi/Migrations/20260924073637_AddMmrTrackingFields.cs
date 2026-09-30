using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PerudApi.Migrations
{
    /// <inheritdoc />
    public partial class AddMmrTrackingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BestWinStreak",
                table: "PlayerStats",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FailedDudo",
                table: "PlayerStats",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RoundsPlayed",
                table: "GameHistories",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BestWinStreak",
                table: "PlayerStats");

            migrationBuilder.DropColumn(
                name: "FailedDudo",
                table: "PlayerStats");

            migrationBuilder.DropColumn(
                name: "RoundsPlayed",
                table: "GameHistories");
        }
    }
}
