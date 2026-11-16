using System.Globalization;
using System.Text;
using JobTracker.Api.Models;

namespace JobTracker.Api.Services;

public static class CsvExporter
{
    private static readonly string[] Header =
        ["Company", "Role", "Status", "Date Applied", "Location", "Salary", "Source", "Match Score", "Follow-up Date", "Job URL", "Notes"];

    public static string ToCsv(IEnumerable<JobApplication> jobs)
    {
        var sb = new StringBuilder();
        sb.AppendLine(string.Join(',', Header));
        foreach (var j in jobs)
        {
            sb.AppendLine(string.Join(',', new[]
            {
                j.Company, j.Role, j.Status,
                j.DateApplied.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                j.Location, j.Salary, j.Source,
                j.MatchScore?.ToString(CultureInfo.InvariantCulture),
                j.FollowUpDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                j.JobUrl, j.Notes
            }.Select(Escape)));
        }
        return sb.ToString();
    }

    public static string Escape(string? value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        // Stop spreadsheet formula injection (=, +, -, @ at the start of a cell).
        if ("=+-@".Contains(value[0])) value = "'" + value;
        var needsQuotes = value.IndexOfAny([',', '"', '\n', '\r']) >= 0;
        return needsQuotes ? "\"" + value.Replace("\"", "\"\"") + "\"" : value;
    }
}
