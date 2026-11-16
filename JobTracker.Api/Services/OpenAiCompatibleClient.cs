using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace JobTracker.Api.Services;

/// <summary>
/// Calls the /chat/completions endpoint that Ollama, OpenAI, Gemini and Groq all support.
/// Switching provider is a configuration change only.
/// </summary>
public class OpenAiCompatibleClient : IAiClient
{
    private readonly HttpClient _http;
    private readonly AiOptions _options;
    private readonly ILogger<OpenAiCompatibleClient> _logger;

    public OpenAiCompatibleClient(HttpClient http, IOptions<AiOptions> options, ILogger<OpenAiCompatibleClient> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
        _http.Timeout = TimeSpan.FromSeconds(_options.TimeoutSeconds);
    }

    public Task<string> CompleteAsync(string systemPrompt, string userPrompt, bool expectJson, CancellationToken ct = default) =>
        SendAsync([new ChatMessage("system", systemPrompt), new ChatMessage("user", userPrompt)], expectJson, ct);

    public Task<string> ChatAsync(string systemPrompt, IReadOnlyList<AiMessage> messages, CancellationToken ct = default)
    {
        var all = new List<ChatMessage> { new("system", systemPrompt) };
        all.AddRange(messages.Select(m => new ChatMessage(m.Role, m.Content)));
        return SendAsync(all, expectJson: false, ct);
    }

    private async Task<string> SendAsync(List<ChatMessage> messages, bool expectJson, CancellationToken ct)
    {
        if (!_options.IsConfigured)
            throw new AiException("AI is not configured. Set Ai__BaseUrl and Ai__Model.");

        var body = new ChatRequest
        {
            Model = _options.Model,
            Temperature = _options.Temperature,
            Messages = messages,
            ResponseFormat = expectJson && _options.JsonMode ? new ResponseFormat("json_object") : null
        };

        var url = _options.BaseUrl.TrimEnd('/') + "/chat/completions";
        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = JsonContent.Create(body, options: SerializerOptions)
        };
        if (!string.IsNullOrWhiteSpace(_options.ApiKey))
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, ct);
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            throw new AiException($"The AI provider did not answer within {_options.TimeoutSeconds} seconds.", ex);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Could not reach AI provider at {Url}", url);
            throw new AiException($"Could not reach the AI provider ({_options.Provider}). Is it running?", ex);
        }

        using (response)
        {
            var raw = await response.Content.ReadAsStringAsync(ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("AI provider returned {Status}: {Body}", (int)response.StatusCode, Truncate(raw, 500));
                throw new AiException($"The AI provider returned an error ({(int)response.StatusCode}).");
            }

            var parsed = JsonSerializer.Deserialize<ChatResponse>(raw, SerializerOptions);
            var content = parsed?.Choices?.FirstOrDefault()?.Message?.Content;
            if (string.IsNullOrWhiteSpace(content))
                throw new AiException("The AI provider returned an empty answer.");
            return content.Trim();
        }
    }

    private static string Truncate(string s, int max) => s.Length <= max ? s : s[..max] + "…";

    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private sealed class ChatRequest
    {
        public string Model { get; set; } = "";
        public List<ChatMessage> Messages { get; set; } = [];
        public double Temperature { get; set; }
        [JsonPropertyName("response_format")]
        public ResponseFormat? ResponseFormat { get; set; }
    }

    private sealed record ChatMessage(string Role, string Content);
    private sealed record ResponseFormat(string Type);

    private sealed class ChatResponse
    {
        public List<Choice>? Choices { get; set; }
    }

    private sealed class Choice
    {
        public ChatMessage? Message { get; set; }
    }
}
