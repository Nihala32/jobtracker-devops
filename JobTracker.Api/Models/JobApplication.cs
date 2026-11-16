namespace JobTracker.Api.Models;

public class JobApplication
{
    public int Id { get; set; }
    public string Company { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = JobStatuses.Applied;
    public DateTime DateApplied { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }

    // Extra details
    public string? Location { get; set; }
    public string? JobUrl { get; set; }
    public string? Salary { get; set; }
    public string? Source { get; set; }
    public string? JobDescription { get; set; }
    public DateTime? FollowUpDate { get; set; }

    // Recruiter / hiring contact
    public string? RecruiterName { get; set; }
    public string? RecruiterEmail { get; set; }
    public string? RecruiterPhone { get; set; }
    public string? RecruiterLinkedIn { get; set; }

    // Filled in by the AI match feature
    public int? MatchScore { get; set; }
    public string? MatchSummary { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public static class JobStatuses
{
    public const string Saved = "Saved";
    public const string Applied = "Applied";
    public const string Interview = "Interview";
    public const string Offer = "Offer";
    public const string Rejected = "Rejected";

    public static readonly string[] All = [Saved, Applied, Interview, Offer, Rejected];

    public static bool IsValid(string? status) => status is not null && All.Contains(status);
}
