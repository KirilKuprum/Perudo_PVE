using System.Text.Json.Serialization;

namespace PerudApi.Models
{
    public class GeminiRequest
    {
        [JsonPropertyName("contents")] public List<GeminiContent> Contents { get; set; } = new();
        [JsonPropertyName("generationConfig")] public GeminiGenerationConfig GenerationConfig { get; set; } = new();
    }

    public class GeminiContent
    {
        [JsonPropertyName("role")] public string Role { get; set; } = "user";
        [JsonPropertyName("parts")] public List<GeminiPart> Parts { get; set; } = new();
    }

    public class GeminiPart
    {
        [JsonPropertyName("text")] public string Text { get; set; } = string.Empty;
    }

    public class GeminiGenerationConfig
    {
        [JsonPropertyName("temperature")] public double Temperature { get; set; }
        [JsonPropertyName("responseMimeType")] public string ResponseMimeType { get; set; } = "application/json";
    }

    public class GeminiResponse
    {
        [JsonPropertyName("candidates")] public List<GeminiCandidate>? Candidates { get; set; }
    }

    public class GeminiCandidate
    {
        [JsonPropertyName("content")] public GeminiContent? Content { get; set; }
    }

    public class GeminiMoveDto
    {
        [JsonPropertyName("action")] public string Action { get; set; } = "bid";
        [JsonPropertyName("quantity")] public int Quantity { get; set; }
        [JsonPropertyName("face")] public int Face { get; set; }
        [JsonPropertyName("reasoning")] public string Reasoning { get; set; } = string.Empty;
    }
}