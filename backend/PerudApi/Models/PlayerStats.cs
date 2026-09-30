using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PerudApi.Models
{

    public class PlayerStats
    {
        [Key]
        public int Id { get; set; }

        public int Mmr { get; set; } = 0; 
        public int GamesPlayed { get; set; } = 0;
        public int Wins { get; set; } = 0;
        public int Losses { get; set; } = 0;
        public int CurrentWinStreak { get; set; } = 0;
        public int BestWinStreak { get; set; } = 0;

        public int SuccessfulDudo { get; set; } = 0;
        public int SuccessfulBluffs { get; set; } = 0;
        public int FailedDudo { get; set; } = 0;
        
        [ForeignKey("User")]
        public int UserId { get; set; }
        public User? User { get; set; }
    }
}