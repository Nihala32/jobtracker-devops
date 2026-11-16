using JobTracker.Api.Contracts;
using JobTracker.Api.Models;

namespace JobTracker.Api.Services;

/// <summary>Pure calculations for the dashboard, kept free of the database so they are easy to unit test.</summary>
public static class JobStatsService
{
    public static JobStats Compute(IReadOnlyCollection<JobApplication> jobs, DateTime now, int weeks = 8)
    {
        var byStatus = JobStatuses.All.ToDictionary(s => s, s => jobs.Count(j => j.Status == s));

        // "Sent" = everything except jobs only saved for later.
        var sent = jobs.Count(j => j.Status != JobStatuses.Saved);
        var responded = byStatus[JobStatuses.Interview] + byStatus[JobStatuses.Offer] + byStatus[JobStatuses.Rejected];
        var interviewedOrBetter = byStatus[JobStatuses.Interview] + byStatus[JobStatuses.Offer];

        var scores = jobs.Where(j => j.MatchScore.HasValue).Select(j => j.MatchScore!.Value).ToList();

        var thisWeek = StartOfWeek(now);
        var weekly = Enumerable.Range(0, weeks)
            .Select(i => thisWeek.AddDays(-7 * (weeks - 1 - i)))
            .Select(start => new WeeklyCount(start, jobs.Count(j =>
                j.Status != JobStatuses.Saved && j.DateApplied >= start && j.DateApplied < start.AddDays(7))))
            .ToList();

        var sources = jobs
            .Where(j => !string.IsNullOrWhiteSpace(j.Source))
            .GroupBy(j => j.Source!.Trim(), StringComparer.OrdinalIgnoreCase)
            .Select(g => new SourceCount(g.Key, g.Count()))
            .OrderByDescending(s => s.Count)
            .Take(5)
            .ToList();

        var followUps = jobs
            .Where(j => j.FollowUpDate.HasValue && j.Status is not (JobStatuses.Rejected or JobStatuses.Offer))
            .Where(j => j.FollowUpDate!.Value.Date <= now.Date.AddDays(7))
            .OrderBy(j => j.FollowUpDate)
            .Select(j => new FollowUpItem(j.Id, j.Company, j.Role, j.FollowUpDate!.Value, j.FollowUpDate.Value.Date < now.Date))
            .ToList();

        return new JobStats(
            jobs.Count,
            byStatus,
            Percent(responded, sent),
            Percent(interviewedOrBetter, sent),
            Percent(byStatus[JobStatuses.Offer], sent),
            scores.Count == 0 ? null : Math.Round(scores.Average(), 1),
            weekly,
            sources,
            followUps);
    }

    public static DateTime StartOfWeek(DateTime date)
    {
        var diff = ((int)date.DayOfWeek + 6) % 7; // Monday = start
        return date.Date.AddDays(-diff);
    }

    private static double Percent(int part, int whole) =>
        whole == 0 ? 0 : Math.Round(100.0 * part / whole, 1);
}
