using JobTracker.Api.Models;
using JobTracker.Api.Services;

namespace JobTracker.Tests;

public class CsvExporterTests
{
    [Theory]
    [InlineData("plain", "plain")]
    [InlineData("a,b", "\"a,b\"")]
    [InlineData("say \"hi\"", "\"say \"\"hi\"\"\"")]
    [InlineData("=SUM(A1)", "'=SUM(A1)")]
    [InlineData(null, "")]
    public void Escape_handles_commas_quotes_and_formulas(string? input, string expected)
    {
        Assert.Equal(expected, CsvExporter.Escape(input));
    }

    [Fact]
    public void ToCsv_writes_header_and_one_row_per_job()
    {
        var csv = CsvExporter.ToCsv([new JobApplication { Company = "Acme", Role = "Dev", DateApplied = new DateTime(2026, 11, 1) }]);
        var lines = csv.Trim().Split(Environment.NewLine);

        Assert.Equal(2, lines.Length);
        Assert.StartsWith("Company,Role,Status", lines[0]);
        Assert.StartsWith("Acme,Dev,Applied,2026-11-01", lines[1]);
    }
}
