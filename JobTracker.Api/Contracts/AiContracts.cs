using System.ComponentModel.DataAnnotations;

namespace JobTracker.Api.Contracts;

public record AnalyzeJobRequest([Required, MinLength(30)] string JobDescription);

public record JobAnalysis(
    string? Company,
    string? Role,
    string? Location,
    string? Salary,
    string? Seniority,
    List<string> KeySkills,
    string? Summary);

public record MatchResult(
    int Score,
    List<string> MatchedSkills,
    List<string> MissingSkills,
    List<string> Suggestions,
    string? Summary);

public record InterviewQuestion(string Question, string? Category, string? Hint);

public record InterviewPrep(List<InterviewQuestion> Questions, List<string> Tips);

public record TextResult(string Text);

public record CvBullet(string Suggested, string? Reason);

public record CvTailoring(
    string? Summary,
    List<CvBullet> Bullets,
    List<string> KeywordsToAdd,
    List<string> ThingsToRemove);

public record ChatMessage(
    [Required, RegularExpression("^(user|assistant)$")] string Role,
    [Required, MaxLength(4000)] string Content);

public record ChatRequest([Required, MinLength(1), MaxLength(20)] List<ChatMessage> Messages);

public record AiStatus(bool Configured, string Provider, string Model);
