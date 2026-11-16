using Microsoft.Extensions.Options;

namespace JobTracker.Api.Services;

/// <summary>
/// Caps the total number of AI calls per UTC day in demo mode, so a public demo
/// can never use up the AI provider's free quota.
/// </summary>
public class DailyAiQuota
{
    private readonly object _lock = new();
    private readonly Func<DateTime> _clock;
    private DateOnly _day;
    private int _count;

    public DailyAiQuota(IOptions<DemoOptions> options) : this(options.Value, () => DateTime.UtcNow) { }

    public DailyAiQuota(DemoOptions options, Func<DateTime> clock)
    {
        Options = options;
        _clock = clock;
        _day = DateOnly.FromDateTime(clock());
    }

    public DemoOptions Options { get; }

    /// <summary>Returns true and counts the call if the daily limit has not been reached.</summary>
    public bool TryConsume()
    {
        if (!Options.Enabled) return true;

        lock (_lock)
        {
            var today = DateOnly.FromDateTime(_clock());
            if (today != _day) { _day = today; _count = 0; }
            if (_count >= Options.DailyAiLimit) return false;
            _count++;
            return true;
        }
    }
}
