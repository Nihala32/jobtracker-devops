using JobTracker.Api.Data;
using JobTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Api.Services;

/// <summary>Sample data for the public demo. Companies and the candidate are fictional.</summary>
public static class DemoData
{
    public const string SampleCv = """
        ALEX MORGAN — Full Stack Developer (Demo profile)
        Dubai, UAE

        SUMMARY
        Full stack developer with 4 years of experience building enterprise web applications with Angular,
        .NET Core, C# and SQL Server. Comfortable across the stack, from responsive UIs to REST APIs and database design.

        EXPERIENCE
        Software Engineer — Sample Legal Tech Co. (2024 – present)
        - Built Angular modules for a legal operations platform used daily by law-firm staff
        - Designed REST APIs in .NET Core with Entity Framework Core and SQL Server
        - Implemented single sign-on and fixed authentication issues across environments
        - Worked in Agile sprints with Jira; reviewed pull requests and mentored a junior developer

        Junior Developer — Sample Marketing SaaS (2022 – 2024)
        - Developed features for a B2B email campaign platform in Angular and C#
        - Reduced page load times by 30% using lazy loading and OnPush change detection
        - Wrote stored procedures and optimised slow SQL queries

        SKILLS
        Angular, TypeScript, RxJS, NgRx, Kendo UI, HTML, CSS, C#, .NET Core, Entity Framework Core,
        SQL Server, REST APIs, Docker, GitHub Actions, Git, Jira, Agile/Scrum

        EDUCATION
        Bachelor of Computer Applications
        """;

    private const string SampleJd = """
        We are hiring a Full Stack Developer to build customer-facing web applications.
        Requirements: 3+ years with Angular and TypeScript, RxJS, .NET Core Web API, C#, SQL Server,
        Entity Framework Core, REST API design, Git. Nice to have: Docker, Azure, CI/CD pipelines, NgRx, unit testing.
        You will work in an Agile team, collaborate with designers and QA, and own features end to end.
        Location: Dubai (hybrid). Salary: AED 16,000 – 22,000 per month.
        """;

    /// <summary>
    /// Resets only if the data is missing or older than <paramref name="resetHours"/>.
    /// Safe to call from many app instances at once (serverless hosting starts several):
    /// the demo profile's UpdatedAt records when the last reset happened.
    /// </summary>
    public static async Task<bool> ResetIfDueAsync(AppDbContext db, DateTime now, int resetHours, CancellationToken ct = default)
    {
        var profile = await db.UserProfiles.AsNoTracking().FirstOrDefaultAsync(p => p.Id == 1, ct);
        if (profile is not null && !IsResetDue(profile.UpdatedAt, now, resetHours)) return false;

        await ResetAsync(db, now, ct);
        return true;
    }

    public static bool IsResetDue(DateTime lastReset, DateTime now, int resetHours) =>
        now - lastReset >= TimeSpan.FromHours(Math.Max(1, resetHours));

    /// <summary>Wipes all data and inserts fresh sample data. Dates are relative to now so the demo always looks current.</summary>
    public static async Task ResetAsync(AppDbContext db, DateTime now, CancellationToken ct = default)
    {
        await db.JobApplications.ExecuteDeleteAsync(ct);
        await db.UserProfiles.ExecuteDeleteAsync(ct);

        db.UserProfiles.Add(new UserProfile
        {
            Id = 1,
            FullName = "Alex Morgan",
            Headline = "Full Stack Developer · Angular & .NET (demo profile)",
            Skills = "Angular, TypeScript, RxJS, C#, .NET Core, SQL Server, Docker",
            CvText = SampleCv,
            WeeklyGoal = 5,
            UpdatedAt = now
        });

        db.JobApplications.AddRange(Jobs(now));
        await db.SaveChangesAsync(ct);
    }

    public static List<JobApplication> Jobs(DateTime now)
    {
        DateTime Ago(int days) => now.Date.AddDays(-days);
        return
        [
            new() { Company = "Falcon Digital Bank", Role = "Senior Angular Developer", Status = JobStatuses.Interview, DateApplied = Ago(6),
                    Location = "Dubai (hybrid)", Salary = "AED 20,000 – 24,000", Source = "LinkedIn", JobDescription = SampleJd,
                    FollowUpDate = Ago(-1), MatchScore = 82, MatchSummary = "Strong match on Angular, .NET Core and SQL Server. Azure and NgRx experience would strengthen the application.",
                    RecruiterName = "Sara Haddad", RecruiterEmail = "sara.haddad@example.com", Notes = "Technical interview with the frontend lead." },
            new() { Company = "Oasis Logistics", Role = "Full Stack Engineer (.NET / Angular)", Status = JobStatuses.Applied, DateApplied = Ago(4),
                    Location = "Dubai", Salary = "AED 18,000", Source = "Bayt", JobDescription = SampleJd, FollowUpDate = Ago(1), MatchScore = 74 },
            new() { Company = "Pearl Health Tech", Role = ".NET Developer", Status = JobStatuses.Applied, DateApplied = Ago(9),
                    Location = "Abu Dhabi", Source = "LinkedIn", JobDescription = SampleJd, MatchScore = 61 },
            new() { Company = "Dune Retail Group", Role = "Frontend Developer", Status = JobStatuses.Rejected, DateApplied = Ago(21),
                    Location = "Dubai", Source = "Indeed", MatchScore = 48, Notes = "Needed React; ask for feedback." },
            new() { Company = "Skyline PropTech", Role = "Software Engineer", Status = JobStatuses.Saved, DateApplied = Ago(3),
                    Location = "Dubai", Source = "Company website", JobDescription = SampleJd },
            new() { Company = "Marina Cloud Services", Role = "Full Stack Developer", Status = JobStatuses.Offer, DateApplied = Ago(28),
                    Location = "Dubai (remote-friendly)", Salary = "AED 21,000", Source = "Referral", JobDescription = SampleJd, MatchScore = 88,
                    RecruiterName = "Omar Khalil", RecruiterEmail = "omar.k@example.com" },
            new() { Company = "Gulf Insurance Systems", Role = "Angular Developer", Status = JobStatuses.Applied, DateApplied = Ago(13),
                    Location = "Abu Dhabi", Source = "Naukrigulf", JobDescription = SampleJd },
            new() { Company = "Atlas EdTech", Role = "Junior Full Stack Developer", Status = JobStatuses.Saved, DateApplied = Ago(1),
                    Location = "Sharjah", Source = "LinkedIn" }
        ];
    }
}
