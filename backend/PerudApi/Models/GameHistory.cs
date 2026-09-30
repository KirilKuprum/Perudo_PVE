using System.ComponentModel.DataAnnotations;

namespace PerudApi.Models
{
    public class GameHistory
    {
        [Key]
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
        public string Difficulty { get; set; } = "Medium"; 
        public bool IsUserWinner { get; set; }
        public int MmrChange { get; set; } 
        public DateTime PlayedAt { get; set; } = DateTime.UtcNow;
        public int RoundsPlayed { get; set; }
    }
}