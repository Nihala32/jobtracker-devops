using JobTracker.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace JobTracker.Api.Controllers;

[ApiController]
[Route("api/app")]
public class AppController(IOptions<DemoOptions> demo) : ControllerBase
{
    /// <summary>Tells the UI whether it is running as the public demo.</summary>
    [HttpGet("info")]
    public object Info() => new
    {
        demo = demo.Value.Enabled,
        resetHours = demo.Value.ResetHours,
        repoUrl = demo.Value.RepoUrl
    };
}
