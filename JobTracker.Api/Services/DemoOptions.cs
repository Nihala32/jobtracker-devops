namespace JobTracker.Api.Services;

/// <summary>
/// Public demo mode. When enabled the database holds sample data only, it is reset on a schedule,
/// the demo profile cannot be edited and AI usage is capped. Bound from the "Demo" config section.
/// </summary>
public class DemoOptions
{
    public const string Section = "Demo";

    public bool Enabled { get; set; }
    public int ResetHours { get; set; } = 6;
    public int MaxJobs { get; set; } = 50;
    public int AiRequestsPerMinutePerVisitor { get; set; } = 5;
    public int DailyAiLimit { get; set; } = 300;
    public string RepoUrl { get; set; } = "https://github.com/Nihala32/jobtracker-devops";
}
