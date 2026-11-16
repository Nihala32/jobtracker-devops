using JobTracker.Api.Data;
using Microsoft.Extensions.Options;

namespace JobTracker.Api.Services;

/// <summary>In demo mode, resets the sample data every few hours (and on first start with an empty database).</summary>
public class DemoResetService(IServiceScopeFactory scopes, IOptions<DemoOptions> options, ILogger<DemoResetService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var demo = options.Value;
        if (!demo.Enabled) return;

        await ResetIfDueAsync(demo.ResetHours, stoppingToken);

        // Check every 15 minutes; the reset itself only happens when it is due.
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(15));
        while (await timer.WaitForNextTickAsync(stoppingToken))
            await ResetIfDueAsync(demo.ResetHours, stoppingToken);
    }

    private async Task ResetIfDueAsync(int resetHours, CancellationToken ct)
    {
        try
        {
            using var scope = scopes.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            if (await DemoData.ResetIfDueAsync(db, DateTime.UtcNow, resetHours, ct))
                logger.LogInformation("Demo data reset");
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Demo data reset failed");
        }
    }
}
