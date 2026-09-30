using System.ComponentModel.DataAnnotations;
namespace PerudApi.Models
{
    public class GameState
    {
        public List<string> BidHistory { get; set; } = new();
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public int UserId { get; set; }
        public User? User { get; set; }

        public string Difficulty { get; set; } = "Medium";
        public int Round { get; set; } = 1;

        public List<int> PlayerDice { get; set; } = new();
        public List<int> AiDice { get; set; } = new();

        public int CurrentBidQuantity { get; set; }
        public int CurrentBidNominal { get; set; }
        public bool LastBidByPlayer { get; set; }

        public bool IsPlayerTurn { get; set; } = true;
        public bool IsGameEnded { get; set; }
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;

        public int SuccessfulDudoCalls { get; set; } = 0;
        public int FailedDudoCalls { get; set; } = 0;
    }
}