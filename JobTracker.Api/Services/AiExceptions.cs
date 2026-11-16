namespace JobTracker.Api.Services;

/// <summary>The AI provider failed, timed out or returned something we could not use.</summary>
public class AiException(string message, Exception? inner = null) : Exception(message, inner);
