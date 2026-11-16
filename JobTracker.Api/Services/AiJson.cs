using System.Text.Json;

namespace JobTracker.Api.Services;

/// <summary>
/// Models sometimes wrap JSON in ```json fences or add a sentence before it.
/// This pulls out the first JSON object and deserializes it.
/// </summary>
public static class AiJson
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        AllowTrailingCommas = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString
    };

    public static string ExtractObject(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            throw new AiException("The AI answer was empty.");

        var start = text.IndexOf('{');
        var end = text.LastIndexOf('}');
        if (start < 0 || end <= start)
            throw new AiException("The AI answer did not contain JSON.");

        return text[start..(end + 1)];
    }

    public static T Parse<T>(string text)
    {
        try
        {
            return JsonSerializer.Deserialize<T>(ExtractObject(text), Options)
                   ?? throw new AiException("The AI answer could not be read.");
        }
        catch (JsonException ex)
        {
            throw new AiException("The AI answer was not valid JSON. Try again.", ex);
        }
    }
}
