using JobTracker.Api.Models;
using JobTracker.Api.Services;

namespace JobTracker.Tests;

public class JobStatsServiceTests
{
    private static readonly DateTime Now = new(2026, 11, 18, 10, 0, 0, DateTimeKind.Utc); // a Wednesday

    private static JobApplication Job(string status, int daysAgo = 1, string? source = null, int? score = null, DateTime? followUp = null) => new()
    {
        Company = "C", Role = "R", Status = status, DateApplied = Now.AddDays(-daysAgo),
        Source = source, MatchScore = score, FollowUpDate = followUp
    };

    [Fact]
    public void Empty_list_gives_zero_rates()
    {
        var stats = JobStatsService.Compute([], Now);

        Assert.Equal(0, stats.Total);
        Assert.Equal(0.0, stats.ResponseRate);
        Assert.Null(stats.AverageMatchScore);
        Assert.Equal(8, stats.Weekly.Count);
    }

    [Fact]
    public void Rates_ignore_saved_jobs()
    {
        var jobs = new List<JobApplication>
        {
            Job(JobStatuses.Saved), Job(JobStatuses.Applied), Job(JobStatuses.Applied),
            Job(JobStatuses.Interview), Job(JobStatuses.Rejected)
        };

        var stats = JobStatsService.Compute(jobs, Now);

        Assert.Equal(5, stats.Total);
        Assert.Equal(50.0, stats.ResponseRate);   // 2 of 4 sent got a reply
        Assert.Equal(25.0, stats.InterviewRate);  // 1 of 4
        Assert.Equal(1, stats.ByStatus[JobStatuses.Saved]);
    }

    [Fact]
    public void Average_match_score_and_top_sources()
    {
        var jobs = new List<JobApplication>
        {
            Job(JobStatuses.Applied, source: "LinkedIn", score: 80),
            Job(JobStatuses.Applied, source: "linkedin", score: 60),
            Job(JobStatuses.Applied, source: "Indeed")
        };

        var stats = JobStatsService.Compute(jobs, Now);

        Assert.Equal(70.0, stats.AverageMatchScore!.Value);
        Assert.Equal(2, stats.TopSources[0].Count);
    }

    [Fact]
    public void Follow_ups_include_overdue_and_next_7_days_only()
    {
        var jobs = new List<JobApplication>
        {
            Job(JobStatuses.Applied, followUp: Now.AddDays(-2)),
            Job(JobStatuses.Applied, followUp: Now.AddDays(3)),
            Job(JobStatuses.Applied, followUp: Now.AddDays(30)),
            Job(JobStatuses.Rejected, followUp: Now.AddDays(-1))
        };

        var stats = JobStatsService.Compute(jobs, Now);

        Assert.Equal(2, stats.FollowUps.Count);
        Assert.True(stats.FollowUps[0].Overdue);
        Assert.False(stats.FollowUps[1].Overdue);
    }

    [Fact]
    public void Weekly_counts_put_this_weeks_jobs_in_the_last_bucket()
    {
        var stats = JobStatsService.Compute([Job(JobStatuses.Applied, daysAgo: 1), Job(JobStatuses.Applied, daysAgo: 8)], Now);

        Assert.Equal(1, stats.Weekly[^1].Count);
        Assert.Equal(1, stats.Weekly[^2].Count);
        Assert.Equal(DayOfWeek.Monday, stats.Weekly[^1].WeekStart.DayOfWeek);
    }
}
