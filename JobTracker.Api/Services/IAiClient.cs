namespace JobTracker.Api.Services;

public record AiMessage(string Role, string Content);

public interface IAiClient
{
    /// <summary>Sends one system + user prompt and returns the model's reply text.</summary>
    Task<string> CompleteAsync(string systemPrompt, string userPrompt, bool expectJson, CancellationToken ct = default);

    /// <summary>Sends a whole conversation (user / assistant turns) and returns the next assistant reply.</summary>
    Task<string> ChatAsync(string systemPrompt, IReadOnlyList<AiMessage> messages, CancellationToken ct = default);
}
