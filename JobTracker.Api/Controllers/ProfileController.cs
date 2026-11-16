using JobTracker.Api.Contracts;
using JobTracker.Api.Data;
using JobTracker.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private const int ProfileId = 1;
    private readonly AppDbContext _db;

    public ProfileController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<UserProfile>> Get() =>
        await _db.UserProfiles.FindAsync(ProfileId) ?? new UserProfile { Id = ProfileId };

    [HttpPut]
    public async Task<ActionResult<UserProfile>> Save(ProfileRequest request)
    {
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
