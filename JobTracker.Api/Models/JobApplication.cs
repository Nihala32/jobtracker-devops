namespace JobTracker.Api.Models;

public class JobApplication
{
    public int Id { get; set; }
    public string Company { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = "Applied";
    public DateTime DateApplied { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
}