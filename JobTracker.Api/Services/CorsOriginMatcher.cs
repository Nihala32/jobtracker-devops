using System.Text.RegularExpressions;

namespace JobTracker.Api.Services;

/// <summary>Checks a browser Origin against exact origins and simple * wildcard patterns.</summary>
public static class CorsOriginMatcher
{
    public static bool IsAllowed(string origin, IEnumerable<string> exactOrigins, IEnumerable<string> patterns)
    {
        if (string.IsNullOrWhiteSpace(origin)) return false;
        var o = origin.TrimEnd('/');

        if (exactOrigins.Any(e => string.Equals(e.TrimEnd('/'), o, StringComparison.OrdinalIgnoreCase)))
            return true;

        // '*' matches letters, digits and dashes only, so it can never cross a dot or slash.
        return patterns.Any(p =>
        {
            var regex = "^" + Regex.Escape(p.TrimEnd('/')).Replace("\\*", "[a-z0-9-]*") + "$";
            return Regex.IsMatch(o, regex, RegexOptions.IgnoreCase);
        });
    }
}
