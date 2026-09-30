namespace PerudApi.Models
{
    public class ProfileDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int Mmr { get; set; }
        public int GamesPlayed { get; set; }
        public int Wins { get; set; }
        public int Losses { get; set; }
        public double WinRate { get; set; }
        public int CurrentWinStreak { get; set; }
        public List<GameHistoryDTO> RecentGames { get; set; } = new();
    }

    public class GameHistoryDTO
    {
        public string Difficulty { get; set; } = string.Empty;
        public bool IsUserWinner { get; set; }
        public int MmrChange { get; set; }
        public DateTime PlayedAt { get; set; }
    }

    public class LeaderboardEntryDTO
    {
        public int Rank { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Mmr { get; set; }
        public int GamesPlayed { get; set; }
        public int Wins { get; set; }
        public int Losses { get; set; }
    }
}