using JobTracker.Api.Data;
using Microsoft.Extensions.Options;

namespace JobTracker.Api.Services;

/// <summary>In demo mode, resets the sample data when the app starts and then every few hours.</summary>
public class DemoResetService(IServiceScopeFactory scopes, IOptions<DemoOptions> options, ILogger<DemoResetService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var demo = options.Value;
        if (!demo.Enabled) return;

        await ResetAsync(stoppingToken);

        using var timer = new PeriodicTimer(TimeSpan.FromHours(Math.Max(1, demo.ResetHours)));
        while (await timer.WaitForNextTickAsync(stoppingToken))
            await ResetAsync(stoppingToken);
    }

    private async Task ResetAsync(CancellationToken ct)
    {
        try
        {
            using var scope = scopes.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await DemoData.ResetAsync(db, DateTime.UtcNow, ct);
            logger.LogInformation("Demo data reset");
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Demo data reset failed");
        }
    }
}
