using JobTracker.Api.Data;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace JobTracker.Api.Services;

public class DatabaseHealthCheck(AppDbContext db) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken ct = default) =>
        await db.Database.CanConnectAsync(ct)
            ? HealthCheckResult.Healthy("Database reachable")
            : HealthCheckResult.Unhealthy("Database not reachable");
}
