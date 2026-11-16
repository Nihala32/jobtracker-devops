using JobTracker.Api.Contracts;
using JobTracker.Api.Models;
using JobTracker.Api.Services;

namespace JobTracker.Tests;

public class JobAiServiceTests
{
    private static JobApplication Job(string? description = "We need Angular, .NET Core and SQL Server.") => new()
    {
        Id = 1, Company = "Acme", Role = "Full Stack Developer", JobDescription = description
    };

    private static UserProfile Profile(string? cv = "4 years with Angular, C#, .NET Core and SQL Server.") => new()
    {
        Id = 1, FullName = "Test User", CvText = cv
    };

    [Fact]
    public async Task Match_clamps_score_and_cleans_lists()
    {
        var ai = new FakeAiClient("""
            {"score": 140.6, "matchedSkills": ["Angular", "angular", " C# ", ""],
             "missingSkills": ["Azure"], "suggestions": ["Add metrics"], "summary": " Good fit. "}
            """);
        var service = new JobAiService(ai);

        var result = await service.MatchAsync(Job(), Profile());

        Assert.Equal(100, result.Score);
        Assert.Equal(new[] { "Angular", "C#" }, result.MatchedSkills);
        Assert.Equal("Good fit.", result.Summary);
        Assert.True(ai.LastExpectJson);
        Assert.Contains("Acme", ai.LastUserPrompt);
    }

    [Fact]
    public async Task Match_requires_a_job_description()
    {
        var service = new JobAiService(new FakeAiClient("{}"));

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.MatchAsync(Job(description: null), Profile()));
    }

    [Fact]
    public async Task Match_requires_a_cv()
    {
        var service = new JobAiService(new FakeAiClient("{}"));

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.MatchAsync(Job(), Profile(cv: " ")));
    }

    [Fact]
    public async Task AnalyzeJob_returns_parsed_fields()
    {
        var ai = new FakeAiClient("""
            {"company":"Emirates NBD","role":"Angular Developer","location":"Dubai","salary":null,
             "seniority":"Mid","keySkills":["Angular","TypeScript","RxJS"],"summary":"Build banking apps."}
            """);

        var result = await new JobAiService(ai).AnalyzeJobAsync("A long job advert for an Angular developer in Dubai...");

        Assert.Equal("Emirates NBD", result.Company);
        Assert.Equal("Dubai", result.Location);
        Assert.Null(result.Salary);
        Assert.Equal(3, result.KeySkills.Count);
    }

    [Fact]
    public async Task InterviewPrep_drops_empty_questions()
    {
        var ai = new FakeAiClient("""
            {"questions":[{"question":"What is RxJS?","category":"Technical","hint":"Observables"},
                          {"question":"","category":"Technical","hint":""}],
             "tips":["Research the company"]}
            """);

        var result = await new JobAiService(ai).InterviewPrepAsync(Job(), null);

        Assert.Single(result.Questions);
        Assert.Single(result.Tips);
    }

    [Fact]
    public async Task CoverLetter_uses_plain_text_and_candidate_name()
    {
        var ai = new FakeAiClient("Dear Hiring Manager, ...");

        var result = await new JobAiService(ai).CoverLetterAsync(Job(), Profile(), tone: "confident");

        Assert.StartsWith("Dear Hiring Manager", result.Text);
        Assert.False(ai.LastExpectJson);
        Assert.Contains("Test User", ai.LastUserPrompt);
        Assert.Contains("confident", ai.LastSystemPrompt);
    }

    [Fact]
    public async Task TailorCv_cleans_bullets_and_lists()
    {
        var ai = new FakeAiClient("""
            {"summary":" Angular developer. ","bullets":[{"suggested":"Built Angular dashboards","reason":"UI work"},{"suggested":" ","reason":"x"}],
             "keywordsToAdd":["RxJS","rxjs","NgRx"],"thingsToRemove":[]}
            """);

        var result = await new JobAiService(ai).TailorCvAsync(Job(), Profile());

        Assert.Equal("Angular developer.", result.Summary);
        Assert.Single(result.Bullets);
        Assert.Equal(new[] { "RxJS", "NgRx" }, result.KeywordsToAdd);
    }

    [Fact]
    public async Task TailorCv_requires_a_cv()
    {
        var service = new JobAiService(new FakeAiClient("{}"));

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.TailorCvAsync(Job(), Profile(cv: null)));
    }

    [Fact]
    public async Task Chat_sends_job_context_and_recent_history()
    {
        var ai = new FakeAiClient("Ask for AED 20,000.");
        var messages = Enumerable.Range(0, 15)
            .Select(i => new ChatMessage(i % 2 == 0 ? "user" : "assistant", $"message {i}"))
            .ToList();

        var result = await new JobAiService(ai).ChatAsync(Job(), Profile(), messages);

        Assert.Equal("Ask for AED 20,000.", result.Text);
        Assert.Contains("Acme", ai.LastSystemPrompt);
        Assert.Equal(12, ai.LastMessages!.Count);
    }

    [Fact]
    public async Task Chat_rejects_history_that_does_not_end_with_the_user()
    {
        var service = new JobAiService(new FakeAiClient("hi"));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ChatAsync(Job(), Profile(), [new ChatMessage("assistant", "hello")]));
    }
}
