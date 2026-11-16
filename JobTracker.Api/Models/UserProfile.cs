namespace JobTracker.Api.Models;

/// <summary>
/// The person using the tracker. There is a single row (Id = 1).
/// The CV text is what the AI compares job descriptions against.
/// </summary>
public class UserProfile
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Headline { get; set; }
    public string? Skills { get; set; }
    public string? CvText { get; set; }
    public int WeeklyGoal { get; set; } = 10;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
