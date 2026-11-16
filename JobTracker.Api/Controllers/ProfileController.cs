using JobTracker.Api.Contracts;
using JobTracker.Api.Data;
using JobTracker.Api.Models;
using JobTracker.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace JobTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private const int ProfileId = 1;
    private readonly AppDbContext _db;
    private readonly DemoOptions _demo;

    public ProfileController(AppDbContext db, IOptions<DemoOptions> demo)
    {
        _db = db;
        _demo = demo.Value;
    }

    [HttpGet]
    public async Task<ActionResult<UserProfile>> Get() =>
        await _db.UserProfiles.FindAsync(ProfileId) ?? new UserProfile { Id = ProfileId };

    [HttpPut]
    public async Task<ActionResult<UserProfile>> Save(ProfileRequest request)
    {
        if (_demo.Enabled)
            return StatusCode(StatusCodes.Status403Forbidden,
                new { error = "The demo profile can't be changed. Run the app locally to use your own CV." });

        var profile = await _db.UserProfiles.FindAsync(ProfileId);
        if (profile is null)
        {
            profile = new UserProfile { Id = ProfileId };
            _db.UserProfiles.Add(profile);
        }

        profile.FullName = request.FullName?.Trim() ?? "";
        profile.Headline = request.Headline?.Trim();
        profile.Skills = request.Skills?.Trim();
        profile.CvText = request.CvText?.Trim();
        if (request.WeeklyGoal.HasValue) profile.WeeklyGoal = request.WeeklyGoal.Value;
        profile.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return profile;
    }
}
