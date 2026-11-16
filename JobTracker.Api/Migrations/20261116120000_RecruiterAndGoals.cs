using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobTracker.Api.Migrations
{
    /// <inheritdoc />
    public partial class RecruiterAndGoals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RecruiterEmail",
                table: "JobApplications",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecruiterLinkedIn",
                table: "JobApplications",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecruiterName",
                table: "JobApplications",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecruiterPhone",
                table: "JobApplications",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WeeklyGoal",
                table: "UserProfiles",
                type: "int",
                nullable: false,
                defaultValue: 10);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "RecruiterEmail", table: "JobApplications");
            migrationBuilder.DropColumn(name: "RecruiterLinkedIn", table: "JobApplications");
            migrationBuilder.DropColumn(name: "RecruiterName", table: "JobApplications");
            migrationBuilder.DropColumn(name: "RecruiterPhone", table: "JobApplications");
            migrationBuilder.DropColumn(name: "WeeklyGoal", table: "UserProfiles");
        }
    }
}
