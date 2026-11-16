using System.ComponentModel.DataAnnotations;

namespace JobTracker.Api.Contracts;

public record JobUpsertRequest(
    [Required, MaxLength(200)] string Company,
    [Required, MaxLength(200)] string Role,
    [MaxLength(20)] string? Status,
    DateTime? DateApplied,
    string? Notes,
    [MaxLength(200)] string? Location,
    [MaxLength(1000)] string? JobUrl,
    [MaxLength(100)] string? Salary,
    [MaxLength(100)] string? Source,
    string? JobDescription,
    DateTime? FollowUpDate,
    [MaxLength(200)] string? RecruiterName = null,
    [MaxLength(200), EmailAddress] string? RecruiterEmail = null,
    [MaxLength(50)] string? RecruiterPhone = null,
    [MaxLength(500)] string? RecruiterLinkedIn = null);

public record StatusUpdateRequest([Required] string Status);

public record ProfileRequest(
    [MaxLength(200)] string? FullName,
    [MaxLength(300)] string? Headline,
    string? Skills,
    string? CvText,
    [Range(1, 100)] int? WeeklyGoal = null);

public record WeeklyCount(DateTime WeekStart, int Count);
public record SourceCount(string Source, int Count);
public record FollowUpItem(int Id, string Company, string Role, DateTime FollowUpDate, bool Overdue);

public record JobStats(
    int Total,
    Dictionary<string, int> ByStatus,
    double ResponseRate,
    double InterviewRate,
    double OfferRate,
    double? AverageMatchScore,
    List<WeeklyCount> Weekly,
    List<SourceCount> TopSources,
    List<FollowUpItem> FollowUps);
