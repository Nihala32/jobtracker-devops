using JobTracker.Api.Services;

namespace JobTracker.Tests;

public class CorsOriginMatcherTests
{
    private static readonly string[] Exact = ["http://localhost:4200"];
    private static readonly string[] Patterns = ["https://jobtracker*.vercel.app"];

    [Theory]
    [InlineData("http://localhost:4200", true)]
    [InlineData("https://jobtracker-ui.vercel.app", true)]
    [InlineData("https://jobtracker-8qxatglzf-nihala1.vercel.app", true)]
    [InlineData("https://evil.vercel.app", false)]
    [InlineData("https://jobtracker.evil.com", false)]
    [InlineData("https://jobtracker-x.vercel.app.evil.com", false)]
    [InlineData("http://jobtracker-ui.vercel.app", false)]
    [InlineData("", false)]
    public void Matches_exact_origins_and_safe_wildcards(string origin, bool expected)
    {
        Assert.Equal(expected, CorsOriginMatcher.IsAllowed(origin, Exact, Patterns));
    }
}
