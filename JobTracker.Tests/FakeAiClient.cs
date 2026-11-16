using JobTracker.Api.Services;

namespace JobTracker.Tests;

/// <summary>Returns a canned answer and records the prompts, so tests never call a real AI.</summary>
public class FakeAiClient(string reply) : IAiClient
{
    public string? LastSystemPrompt { get; private set; }
    public string? LastUserPrompt { get; private set; }
    public bool? LastExpectJson { get; private set; }

    public Task<string> CompleteAsync(string systemPrompt, string userPrompt, bool expectJson, CancellationToken ct = default)
    {
        LastSystemPrompt = systemPrompt;
        LastUserPrompt = userPrompt;
        LastExpectJson = expectJson;
        return Task.FromResult(reply);
    }

    public IReadOnlyList<AiMessage>? LastMessages { get; private set; }

    public Task<string> ChatAsync(string systemPrompt, IReadOnlyList<AiMessage> messages, CancellationToken ct = default)
    {
        LastSystemPrompt = systemPrompt;
        LastMessages = messages;
        return Task.FromResult(reply);
    }
}
