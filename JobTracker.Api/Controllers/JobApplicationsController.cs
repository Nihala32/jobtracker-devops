using JobTracker.Api.Data;
using JobTracker.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobApplicationsController : ControllerBase
{
    private readonly AppDbContext _db;

    public JobApplicationsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<JobApplication>>> GetAll() =>
        await _db.JobApplications.OrderByDescending(j => j.DateApplied).ToListAsync();

    [HttpGet("{id}")]
    public async Task<ActionResult<JobApplication>> GetById(int id)
    {
        var job = await _db.JobApplications.FindAsync(id);
        return job is null ? NotFound() : job;
    }

    [HttpPost]
    public async Task<ActionResult<JobApplication>> Create(JobApplication job)
    {
        _db.JobApplications.Add(job);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = job.Id }, job);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, JobApplication job)
    {
        if (id != job.Id) return BadRequest();
        _db.Entry(job).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var job = await _db.JobApplications.FindAsync(id);
        if (job is null) return NotFound();
        _db.JobApplications.Remove(job);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}