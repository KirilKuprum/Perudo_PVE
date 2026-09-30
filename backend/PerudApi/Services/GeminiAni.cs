using System.Text.Json;
using PerudApi.Models;

namespace PerudApi.Services
{
    public class GeminiAi : IAiPlayer
    {
        private readonly HttpClient _http;
        private readonly ILogger<GeminiAi> _logger;
        private readonly string? _apiKey;
        private readonly string _model;

        public GeminiAi(HttpClient http, IConfiguration config, ILogger<GeminiAi> logger)
        {
            _http = http;
            _logger = logger;
            _apiKey = config["Gemini:ApiKey"];
            _model = config["Gemini:Model"] ?? "gemini-2.5-flash";
        }

        public async Task<AiMove> DecideAsync(GameState s)
        {

            try
            {
                var prompt = BuildPrompt(s);
                var temperature = s.Difficulty switch { "Easy" => 0.5, "Hard" => 0.4, _ => 0.7 };

                var body = new GeminiRequest
                {
                    Contents = new() { new GeminiContent { Parts = new() { new GeminiPart { Text = prompt } } } },
                    GenerationConfig = new GeminiGenerationConfig { Temperature = temperature }
                };

                var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent";
                var request = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = JsonContent.Create(body)
                };
                request.Headers.Add("x-goog-api-key", _apiKey);

                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
                var response = await _http.SendAsync(request, cts.Token);

                if (!response.IsSuccessStatusCode)
                {
                    throw new InvalidOperationException($"Gemini повернув статус {response.StatusCode}");
                }

                var json = await response.Content.ReadFromJsonAsync<GeminiResponse>(cancellationToken: cts.Token);
                var text = json?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;
                if (string.IsNullOrWhiteSpace(text))
                    throw new InvalidOperationException($"Gemini повернув статус {response.StatusCode}");

                var move = JsonSerializer.Deserialize<GeminiMoveDto>(text,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (move == null) throw new InvalidOperationException($"Gemini повернув статус {response.StatusCode}");

                return Validate(s, move) ?? throw new InvalidOperationException($"Gemini повернув статус {response.StatusCode}");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Помилка виклику Gemini");
                throw new InvalidOperationException($"Gemini повернув статус {ex}");
            }
        }

        private static AiMove? Validate(GameState s, GeminiMoveDto move)
        {
            if (move.Action.Equals("dudo", StringComparison.OrdinalIgnoreCase))
            {
                if (s.CurrentBidQuantity == 0) return null;   
                return new AiMove(AiAction.Dudo, 0, 0,
                    string.IsNullOrWhiteSpace(move.Reasoning) ? "Не вірю!" : move.Reasoning);
            }

            if (!GameRules.IsLegalBid(s, move.Quantity, move.Face, out _)) return null;

            return new AiMove(AiAction.Bid, move.Quantity, move.Face,
                string.IsNullOrWhiteSpace(move.Reasoning)
                    ? $"Ставлю {move.Quantity} × {move.Face}."
                    : move.Reasoning);
        }

        private static string BuildPrompt(GameState s)
        {
            var style = s.Difficulty switch
            {
                "Easy" => "Грай максимально прямолінійно. Довіряй тільки власним костям і роби мінімально можливі ставки. Не блефуй.",
                "Hard" => "Грай розумно: рахуй ймовірності точно, блефуй, коли вигідно, зважай на історію ставок гравця.",
                _ => "Грай збалансовано: розумні ставки, помірний блеф."
            };

            var bidText = s.CurrentBidQuantity == 0
                ? "Ставок ще не було, ти ходиш першим."
                : $"Поточна ставка: {s.CurrentBidQuantity} x {s.CurrentBidNominal} (зробив {(s.LastBidByPlayer ? "гравець" : "ти")}).";

            var history = s.BidHistory.Count == 0 ? "немає" : string.Join(", ", s.BidHistory);

            return $$"""
                Ти граєш у Перудо проти людини. Рівень складності: {{s.Difficulty}}.
                {{style}}

                Твої кубики: [{{string.Join(",", s.AiDice)}}].
                Кількість кубиків гравця: {{s.PlayerDice.Count}} (значення тобі невідомі).
                {{bidText}}
                Історія ставок цього раунду: {{history}}.

                Правила: одиниці (1) є джокерами і рахуються до будь-якого номіналу, крім ставок
                безпосередньо на одиниці. Нова ставка має бути вищою: більша кількість, або та сама
                кількість з вищим номіналом. Загальна кількість кубиків у грі: {{GameRules.TotalDice(s)}}.

                Прийми рішення: підняти ставку (bid) або оскаржити її (dudo, можливо лише якщо ставка вже є).
                Поверни ЛИШЕ JSON без жодного тексту навколо:
                {"action":"bid"|"dudo","quantity":число,"face":число від 1 до 6,"reasoning":"Пиши ТІЛЬКИ ставку у форматі 1x1 або Не вірю", українською"}
                """;
        }
    }
}