using JobTracker.Api.Models;
using JobTracker.Api.Services;

namespace JobTracker.Tests;

public class DemoTests
{
    [Fact]
    public void Daily_quota_blocks_after_the_limit_and_resets_the_next_day()
    {
        var now = new DateTime(2026, 11, 16, 10, 0, 0, DateTimeKind.Utc);
        var quota = new DailyAiQuota(new DemoOptions { Enabled = true, DailyAiLimit = 2 }, () => now);

        Assert.True(quota.TryConsume());
        Assert.True(quota.TryConsume());
        Assert.False(quota.TryConsume());

        now = now.AddDays(1);
        Assert.True(quota.TryConsume());
    }

    [Fact]
    public void Daily_quota_is_unlimited_outside_demo_mode()
    {
        var quota = new DailyAiQuota(new DemoOptions { Enabled = false, DailyAiLimit = 0 }, () => DateTime.UtcNow);

        Assert.True(quota.TryConsume());
    }

    [Fact]
    public void Demo_jobs_use_valid_statuses_and_recent_dates()
    {
        var now = new DateTime(2026, 11, 16, 0, 0, 0, DateTimeKind.Utc);
        var jobs = DemoData.Jobs(now);

        Assert.True(jobs.Count >= 6);
        Assert.True(jobs.All(j => JobStatuses.IsValid(j.Status)));
        Assert.True(jobs.All(j => j.DateApplied <= now && j.DateApplied > now.AddDays(-60)));
        Assert.True(jobs.All(j => !string.IsNullOrWhiteSpace(j.Company) && !string.IsNullOrWhiteSpace(j.Role)));
    }

    [Theory]
    [InlineData(1, false)]
    [InlineData(5, false)]
    [InlineData(6, true)]
    [InlineData(30, true)]
    public void Reset_is_due_only_after_the_reset_interval(int hoursSinceReset, bool expected)
    {
        var now = new DateTime(2026, 11, 16, 12, 0, 0, DateTimeKind.Utc);

        Assert.Equal(expected, DemoData.IsResetDue(now.AddHours(-hoursSinceReset), now, resetHours: 6));
    }
}
