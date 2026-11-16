using JobTracker.Api.Contracts;
using JobTracker.Api.Services;

namespace JobTracker.Tests;

public class AiJsonTests
{
    [Fact]
    public void Parse_reads_plain_json()
    {
        var result = AiJson.Parse<JobAnalysis>("""{"company":"Acme","role":"Dev","keySkills":["C#"]}""");

        Assert.Equal("Acme", result.Company);
        Assert.Equal("Dev", result.Role);
        Assert.Equal(new[] { "C#" }, result.KeySkills);
    }

    [Fact]
    public void Parse_ignores_markdown_fences_and_extra_text()
    {
        var reply = "Sure! Here it is:\n```json\n{\"company\":\"Acme\",\"role\":\"Dev\",\"keySkills\":[]}\n```\nGood luck!";

        var result = AiJson.Parse<JobAnalysis>(reply);

        Assert.Equal("Acme", result.Company);
    }

    [Fact]
    public void Parse_throws_AiException_when_there_is_no_json()
    {
        Assert.Throws<AiException>(() => AiJson.Parse<JobAnalysis>("I cannot help with that."));
    }

    [Fact]
    public void Parse_throws_AiException_for_broken_json()
    {
        Assert.Throws<AiException>(() => AiJson.Parse<JobAnalysis>("{\"company\": \"Acme\", }}"));
    }
}
