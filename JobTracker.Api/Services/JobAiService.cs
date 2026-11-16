using JobTracker.Api.Contracts;
using JobTracker.Api.Models;

namespace JobTracker.Api.Services;

/// <summary>
/// All the AI features. Prompts live here so they are easy to read and tune.
/// </summary>
public class JobAiService
{
    private const int MaxInputChars = 12_000;
    private readonly IAiClient _ai;

    public JobAiService(IAiClient ai) => _ai = ai;

    public async Task<JobAnalysis> AnalyzeJobAsync(string jobDescription, CancellationToken ct = default)
    {
        const string system = """
            You extract structured data from job adverts. Reply with ONLY a JSON object, no other text.
            Use this exact shape:
            {"company": string|null, "role": string|null, "location": string|null, "salary": string|null,
             "seniority": string|null, "keySkills": [string], "summary": string}
            - keySkills: up to 12 concrete technical or professional skills from the advert.
            - summary: 2 sentences describing the role.
            - Use null when the advert does not say. Never invent a company name.
            """;

        var reply = await _ai.CompleteAsync(system, $"Job advert:\n{Clip(jobDescription)}", expectJson: true, ct);
        var result = AiJson.Parse<JobAnalysis>(reply);
        return result with { KeySkills = CleanList(result.KeySkills, 12) };
    }

    public async Task<MatchResult> MatchAsync(JobApplication job, UserProfile profile, CancellationToken ct = default)
    {
        EnsureJobDescription(job);
        EnsureCv(profile);

        const string system = """
            You are a strict, honest technical recruiter. Compare the candidate's CV with the job description.
            Reply with ONLY a JSON object, no other text, in this exact shape:
            {"score": number 0-100, "matchedSkills": [string], "missingSkills": [string],
             "suggestions": [string], "summary": string}
            - score: how well the CV fits the job's must-have requirements. Do not inflate it.
            - matchedSkills / missingSkills: up to 10 each, short skill names.
            - suggestions: 3 to 5 specific, practical changes to the CV for THIS job. Never suggest inventing experience.
            - summary: 2 sentences.
            """;

        var user = $"""
            JOB: {job.Role} at {job.Company}
            JOB DESCRIPTION:
            {Clip(job.JobDescription!)}

            CANDIDATE CV:
            {Clip(profile.CvText!)}
            """;

        var reply = await _ai.CompleteAsync(system, user, expectJson: true, ct);
        var r = AiJson.Parse<RawMatch>(reply);
        return new MatchResult(
            (int)Math.Round(Math.Clamp(r.Score, 0, 100)),
            CleanList(r.MatchedSkills, 10),
            CleanList(r.MissingSkills, 10),
            CleanList(r.Suggestions, 5),
            r.Summary?.Trim());
    }

    public async Task<TextResult> CoverLetterAsync(JobApplication job, UserProfile profile, string? tone, CancellationToken ct = default)
    {
        EnsureCv(profile);
        var style = string.IsNullOrWhiteSpace(tone) ? "professional and warm" : tone.Trim();

        var system = $"""
            You write concise cover letters (under 300 words) that sound like a real person, not a template.
            Tone: {style}. Use only facts from the CV; never invent employers, years, degrees or numbers.
            Connect 2-3 specific CV achievements to the job's needs. No placeholders like [Company].
            Reply with the letter text only, starting with "Dear Hiring Manager," and ending with the candidate's name.
            """;

        var user = $"""
            CANDIDATE NAME: {Fallback(profile.FullName, "the candidate")}
            JOB: {job.Role} at {job.Company}{(string.IsNullOrWhiteSpace(job.Location) ? "" : $" ({job.Location})")}
            JOB DESCRIPTION:
            {Clip(job.JobDescription ?? "(not provided - use the role title)")}

            CV:
            {Clip(profile.CvText!)}
            """;

        return new TextResult(await _ai.CompleteAsync(system, user, expectJson: false, ct));
    }

    public async Task<InterviewPrep> InterviewPrepAsync(JobApplication job, UserProfile? profile, CancellationToken ct = default)
    {
        const string system = """
            You are an interview coach. Prepare the candidate for this specific role.
            Reply with ONLY a JSON object, no other text, in this exact shape:
            {"questions": [{"question": string, "category": "Technical"|"Behavioral"|"Company"|"Role", "hint": string}],
             "tips": [string]}
            - 8 questions: mostly technical for the listed stack, plus 2 behavioral.
            - hint: one sentence on what a strong answer covers, using the candidate's own experience where possible.
            - tips: 3 short, practical tips.
            """;

        var user = $"""
            JOB: {job.Role} at {job.Company}
            JOB DESCRIPTION:
            {Clip(job.JobDescription ?? "(not provided - use the role title)")}

            CANDIDATE CV (may be empty):
            {Clip(profile?.CvText ?? "")}
            """;

        var reply = await _ai.CompleteAsync(system, user, expectJson: true, ct);
        var r = AiJson.Parse<InterviewPrep>(reply);
        var questions = (r.Questions ?? new List<InterviewQuestion>())
            .Where(q => !string.IsNullOrWhiteSpace(q.Question))
            .Take(10)
            .ToList();
        return new InterviewPrep(questions, CleanList(r.Tips, 5));
    }

    public async Task<TextResult> FollowUpEmailAsync(JobApplication job, UserProfile? profile, CancellationToken ct = default)
    {
        const string system = """
            You write short, polite follow-up emails (under 120 words) for job applications.
            Match the stage: after applying, ask about next steps; after an interview, thank them and restate interest;
            after an offer, ask clarifying questions. Reply with "Subject: ..." on the first line, then the email body.
            """;

        var days = (int)(DateTime.UtcNow - job.DateApplied).TotalDays;
        var user = $"""
            CANDIDATE NAME: {Fallback(profile?.FullName, "the candidate")}
            JOB: {job.Role} at {job.Company}
            CURRENT STAGE: {job.Status}
            DAYS SINCE APPLYING: {days}
            NOTES: {job.Notes ?? "none"}
            """;

        return new TextResult(await _ai.CompleteAsync(system, user, expectJson: false, ct));
    }

    // Models sometimes return 82.5 instead of 82, so read the score as a double first.
    private sealed record RawMatch(
        double Score, List<string>? MatchedSkills, List<string>? MissingSkills, List<string>? Suggestions, string? Summary);

    public async Task<CvTailoring> TailorCvAsync(JobApplication job, UserProfile profile, CancellationToken ct = default)
    {
        EnsureJobDescription(job);
        EnsureCv(profile);

        const string system = """
            You are an expert CV writer for software developers. Tailor the candidate's CV to the job below.
            Rules: use ONLY facts already in the CV. Never invent employers, dates, numbers, tools or achievements.
            You may reword, reorder, and emphasise existing experience using the job's language.
            Reply with ONLY a JSON object, no other text, in this exact shape:
            {"summary": string, "bullets": [{"suggested": string, "reason": string}],
             "keywordsToAdd": [string], "thingsToRemove": [string]}
            - summary: a 3-sentence professional summary aimed at this job.
            - bullets: 5 to 7 rewritten experience bullet points, each starting with a strong verb.
              reason: one short sentence on which job requirement it targets.
            - keywordsToAdd: up to 8 job keywords the candidate genuinely has (per the CV) but does not state clearly.
            - thingsToRemove: up to 4 parts of the CV that are irrelevant for this job.
            """;

        var user = $"""
            JOB: {job.Role} at {job.Company}
            JOB DESCRIPTION:
            {Clip(job.JobDescription!)}

            CURRENT CV:
            {Clip(profile.CvText!)}
            """;

        var reply = await _ai.CompleteAsync(system, user, expectJson: true, ct);
        var r = AiJson.Parse<CvTailoring>(reply);
        var bullets = (r.Bullets ?? new List<CvBullet>())
            .Where(b => !string.IsNullOrWhiteSpace(b.Suggested))
            .Select(b => new CvBullet(b.Suggested.Trim(), b.Reason?.Trim()))
            .Take(8)
            .ToList();
        return new CvTailoring(r.Summary?.Trim(), bullets, CleanList(r.KeywordsToAdd, 8), CleanList(r.ThingsToRemove, 4));
    }

    public async Task<TextResult> ChatAsync(JobApplication job, UserProfile? profile, IReadOnlyList<ChatMessage> messages, CancellationToken ct = default)
    {
        var system = $"""
            You are a friendly, practical career coach helping {Fallback(profile?.FullName, "the candidate")} with ONE job application.
            Answer questions about this job, the company, salary negotiation, the candidate's fit and how to prepare.
            Be concise (under 200 words unless asked for more). Use short paragraphs or bullet points.
            If you do not know a fact about the company, say so instead of guessing.
            Use only facts from the CV about the candidate; never invent experience.

            JOB: {job.Role} at {job.Company}{(string.IsNullOrWhiteSpace(job.Location) ? "" : $" ({job.Location})")}
            STATUS: {job.Status}
            SALARY: {job.Salary ?? "not stated"}
            JOB DESCRIPTION:
            {Clip(job.JobDescription ?? "(not provided)")}

            CANDIDATE CV:
            {Clip(profile?.CvText ?? "(not provided)")}
            """;

        // Keep the last 12 turns so long chats stay within the model's context.
        var history = messages
            .TakeLast(12)
            .Select(m => new AiMessage(m.Role, m.Content.Length > 4000 ? m.Content[..4000] : m.Content))
            .ToList();

        if (history.Count == 0 || history[^1].Role != "user")
            throw new InvalidOperationException("The last message must be from you.");

        return new TextResult(await _ai.ChatAsync(system, history, ct));
    }

    private static void EnsureJobDescription(JobApplication job)
    {
        if (string.IsNullOrWhiteSpace(job.JobDescription))
            throw new InvalidOperationException("Add the job description to this application first.");
    }

    private static void EnsureCv(UserProfile? profile)
    {
        if (string.IsNullOrWhiteSpace(profile?.CvText))
            throw new InvalidOperationException("Paste your CV on the Profile page first.");
    }

    private static string Clip(string text) =>
        text.Length <= MaxInputChars ? text : text[..MaxInputChars];

    private static string Fallback(string? value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

    internal static List<string> CleanList(IEnumerable<string>? items, int max) =>
        (items ?? Enumerable.Empty<string>())
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(max)
            .ToList();
}
