using System.ComponentModel.DataAnnotations;
namespace PerudApi.Models
{
    public class GameStateDTO
    {
        public Guid Id { get; set; }
        public string Difficulty { get; set; } = string.Empty;
        public int Round { get; set; }
        public List<int> PlayerDice { get; set; } = new();
        public int AiDiceCount { get; set; }
        public int CurrentBidQuantity { get; set; }
        public int CurrentBidNominal { get; set; }
        public bool LastBidByPlayer { get; set; }
        public List<string> BidHistory { get; set; } = new();
        public bool IsPlayerTurn { get; set; }
        public bool IsGameEnded { get; set; }
        public bool? PlayerWon { get; set; }
    }
    public class StartGameDTO
    {
        public string Difficulty { get; set; } = "Medium";
    }

    public class BidDTO
    {
        [Range(1, 50)] public int Quantity { get; set; }
        [Range(1, 6)] public int Face { get; set; }
    }

    public class RoundResultDTO
    {
        public List<int> PlayerDice { get; set; } = new();
        public List<int> AiDice { get; set; } = new();
        public int BidQuantity { get; set; }
        public int BidFace { get; set; }
        public int ActualCount { get; set; }
        public bool BidWasTrue { get; set; }
        public bool CallerIsPlayer { get; set; }
        public bool PlayerLostDie { get; set; }
    }

    public class GameResponseDTO
    {
        public GameStateDTO State { get; set; } = new();
        public string? AiMessage { get; set; }
        public RoundResultDTO? RoundResult { get; set; }
    }
}
