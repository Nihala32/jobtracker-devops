using JobTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<JobApplication> JobApplications => Set<JobApplication>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<JobApplication>(e =>
        {
            e.Property(j => j.Company).HasMaxLength(200);
            e.Property(j => j.Role).HasMaxLength(200);
            e.Property(j => j.Status).HasMaxLength(20);
            e.Property(j => j.Location).HasMaxLength(200);
            e.Property(j => j.JobUrl).HasMaxLength(1000);
            e.Property(j => j.Salary).HasMaxLength(100);
            e.Property(j => j.Source).HasMaxLength(100);
            e.Property(j => j.RecruiterName).HasMaxLength(200);
            e.Property(j => j.RecruiterEmail).HasMaxLength(200);
            e.Property(j => j.RecruiterPhone).HasMaxLength(50);
            e.Property(j => j.RecruiterLinkedIn).HasMaxLength(500);
            e.HasIndex(j => j.Status);
        });

        modelBuilder.Entity<UserProfile>(e =>
        {
            // Single profile row with a fixed Id of 1, so the database must not generate it.
            e.Property(p => p.Id).ValueGeneratedNever();
            e.Property(p => p.FullName).HasMaxLength(200);
            e.Property(p => p.Headline).HasMaxLength(300);
        });
    }
}
