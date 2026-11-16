namespace JobTracker.Api.Services;

/// <summary>
/// Settings for any OpenAI-compatible chat API: Ollama (local, free),
/// Google Gemini, Groq, OpenAI, Azure OpenAI and others.
/// Bound from the "Ai" section of configuration (env vars: Ai__BaseUrl, Ai__ApiKey, Ai__Model).
/// </summary>
public class AiOptions
{
    public const string Section = "Ai";

    public string Provider { get; set; } = "Ollama";
    public string BaseUrl { get; set; } = "http://localhost:11434/v1";
    public string? ApiKey { get; set; }
    public string Model { get; set; } = "llama3.2:3b";
    public bool JsonMode { get; set; } = true;
    public double Temperature { get; set; } = 0.3;
    public int TimeoutSeconds { get; set; } = 180;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(BaseUrl) && !string.IsNullOrWhiteSpace(Model);
}
