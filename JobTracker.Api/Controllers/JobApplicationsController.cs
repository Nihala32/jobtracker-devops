using System.Text;
using JobTracker.Api.Contracts;
using JobTracker.Api.Data;
using JobTracker.Api.Models;
using JobTracker.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace JobTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobApplicationsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly DemoOptions _demo;

    public JobApplicationsController(AppDbContext db, IOptions<DemoOptions> demo)
    {
        _db = db;
        _demo = demo.Value;
    }

    [HttpGet]
    public async Task<ActionResult<List<JobApplication>>> GetAll() =>
        await _db.JobApplications.AsNoTracking().OrderByDescending(j => j.DateApplied).ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<JobApplication>> GetById(int id)
    {
        var job = await _db.JobApplications.FindAsync(id);
        return job is null ? NotFound() : job;
    }

    [HttpPost]
    public async Task<ActionResult<JobApplication>> Create(JobUpsertRequest request)
    {
        if (request.Status is not null && !JobStatuses.IsValid(request.Status))
            return BadRequest(new { error = $"Status must be one of: {string.Join(", ", JobStatuses.All)}" });

        if (_demo.Enabled && await _db.JobApplications.CountAsync() >= _demo.MaxJobs)
            return BadRequest(new { error = $"The demo is limited to {_demo.MaxJobs} applications. It resets every {_demo.ResetHours} hours." });

        var job = new JobApplication { DateApplied = request.DateApplied ?? DateTime.UtcNow };
        Apply(job, request);
        _db.JobApplications.Add(job);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = job.Id }, job);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, JobUpsertRequest request)
    {
        if (request.Status is not null && !JobStatuses.IsValid(request.Status))
            return BadRequest(new { error = $"Status must be one of: {string.Join(", ", JobStatuses.All)}" });

        var job = await _db.JobApplications.FindAsync(id);
        if (job is null) return NotFound();

        // A new job description makes the old match score out of date.
        if (!string.Equals(job.JobDescription, request.JobDescription, StringComparison.Ordinal))
        {
            job.MatchScore = null;
            job.MatchSummary = null;
        }

        Apply(job, request);
        if (request.DateApplied.HasValue) job.DateApplied = request.DateApplied.Value;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, StatusUpdateRequest request)
    {
        if (!JobStatuses.IsValid(request.Status))
            return BadRequest(new { error = $"Status must be one of: {string.Join(", ", JobStatuses.All)}" });

        var job = await _db.JobApplications.FindAsync(id);
        if (job is null) return NotFound();

        job.Status = request.Status;
        job.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var job = await _db.JobApplications.FindAsync(id);
        if (job is null) return NotFound();
        _db.JobApplications.Remove(job);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<ActionResult<JobStats>> Stats()
    {
        var jobs = await _db.JobApplications.AsNoTracking().ToListAsync();
        return JobStatsService.Compute(jobs, DateTime.UtcNow);
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        var jobs = await _db.JobApplications.AsNoTracking().OrderByDescending(j => j.DateApplied).ToListAsync();
        var csv = CsvExporter.ToCsv(jobs);
        // UTF-8 with BOM so Excel shows Arabic and other characters correctly.
        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv)).ToArray();
        return File(bytes, "text/csv", $"job-applications-{DateTime.UtcNow:yyyy-MM-dd}.csv");
    }

    private static void Apply(JobApplication job, JobUpsertRequest r)
    {
        job.Company = r.Company.Trim();
        job.Role = r.Role.Trim();
        job.Status = r.Status ?? job.Status;
        job.Notes = Clean(r.Notes);
        job.Location = Clean(r.Location);
        job.JobUrl = Clean(r.JobUrl);
        job.Salary = Clean(r.Salary);
        job.Source = Clean(r.Source);
        job.JobDescription = Clean(r.JobDescription);
        job.FollowUpDate = r.FollowUpDate;
        job.RecruiterName = Clean(r.RecruiterName);
        job.RecruiterEmail = Clean(r.RecruiterEmail);
        job.RecruiterPhone = Clean(r.RecruiterPhone);
        job.RecruiterLinkedIn = Clean(r.RecruiterLinkedIn);
        job.UpdatedAt = DateTime.UtcNow;
    }

    private static string? Clean(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();
}
