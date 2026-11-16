using JobTracker.Api.Contracts;
using JobTracker.Api.Data;
using JobTracker.Api.Models;
using JobTracker.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace JobTracker.Api.Controllers;

[ApiController]
[Route("api/ai")]
[EnableRateLimiting("ai")]
public class AiController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JobAiService _ai;
    private readonly AiOptions _options;
    private readonly ILogger<AiController> _logger;

    public AiController(AppDbContext db, JobAiService ai, IOptions<AiOptions> options, ILogger<AiController> logger)
    {
        _db = db;
        _ai = ai;
        _options = options.Value;
        _logger = logger;
    }

    [HttpGet("status")]
    [DisableRateLimiting]
    public ActionResult<AiStatus> Status() =>
        new AiStatus(_options.IsConfigured, _options.Provider, _options.Model);

    [HttpPost("analyze-job")]
    public Task<IActionResult> AnalyzeJob(AnalyzeJobRequest request, CancellationToken ct) =>
        Run(() => _ai.AnalyzeJobAsync(request.JobDescription, ct));

    [HttpPost("jobs/{id:int}/match")]
    public async Task<IActionResult> Match(int id, CancellationToken ct)
    {
        var job = await _db.JobApplications.FindAsync([id], ct);
        if (job is null) return NotFound();
        var profile = await GetProfile(ct);

        return await Run(async () =>
        {
            var result = await _ai.MatchAsync(job, profile ?? new UserProfile(), ct);
            job.MatchScore = result.Score;
            job.MatchSummary = result.Summary;
            await _db.SaveChangesAsync(ct);
            return result;
        });
    }

    [HttpPost("jobs/{id:int}/cover-letter")]
    public async Task<IActionResult> CoverLetter(int id, [FromQuery] string? tone, CancellationToken ct)
    {
        var job = await _db.JobApplications.FindAsync([id], ct);
        if (job is null) return NotFound();
        var profile = await GetProfile(ct);
        return await Run(() => _ai.CoverLetterAsync(job, profile ?? new UserProfile(), tone, ct));
    }

    [HttpPost("jobs/{id:int}/interview-prep")]
    public async Task<IActionResult> InterviewPrep(int id, CancellationToken ct)
    {
        var job = await _db.JobApplications.FindAsync([id], ct);
        if (job is null) return NotFound();
        var profile = await GetProfile(ct);
        return await Run(() => _ai.InterviewPrepAsync(job, profile, ct));
    }

    [HttpPost("jobs/{id:int}/follow-up-email")]
    public async Task<IActionResult> FollowUpEmail(int id, CancellationToken ct)
    {
        var job = await _db.JobApplications.FindAsync([id], ct);
        if (job is null) return NotFound();
        var profile = await GetProfile(ct);
        return await Run(() => _ai.FollowUpEmailAsync(job, profile, ct));
    }

    [HttpPost("jobs/{id:int}/tailor-cv")]
    public async Task<IActionResult> TailorCv(int id, CancellationToken ct)
    {
        var job = await _db.JobApplications.FindAsync([id], ct);
        if (job is null) return NotFound();
        var profile = await GetProfile(ct);
        return await Run(() => _ai.TailorCvAsync(job, profile ?? new UserProfile(), ct));
    }

    [HttpPost("jobs/{id:int}/chat")]
    public async Task<IActionResult> Chat(int id, ChatRequest request, CancellationToken ct)
    {
        var job = await _db.JobApplications.FindAsync([id], ct);
        if (job is null) return NotFound();
        var profile = await GetProfile(ct);
        return await Run(() => _ai.ChatAsync(job, profile, request.Messages, ct));
    }

    private Task<UserProfile?> GetProfile(CancellationToken ct) =>
        _db.UserProfiles.FindAsync([1], ct).AsTask();

    /// <summary>Turns AI and validation failures into clear HTTP errors the UI can show.</summary>
    private async Task<IActionResult> Run<T>(Func<Task<T>> action)
    {
        try
        {
            return Ok(await action());
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (AiException ex)
        {
            _logger.LogWarning(ex, "AI request failed");
            return StatusCode(StatusCodes.Status502BadGateway, new { error = ex.Message });
        }
    }
}
