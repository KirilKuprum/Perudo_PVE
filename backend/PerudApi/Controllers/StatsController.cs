using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PerudApi.DbContexts;
using PerudApi.Models;

namespace PerudApi.Controllers
{
    [ApiController]
    [Route("api")]
    public class StatsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public StatsController(AppDbContext db) => _db = db;

        [Authorize]
        [HttpGet("profile")]
        public async Task<ActionResult<ProfileDTO>> Profile()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var user = await _db.Users
                .Include(u => u.Stats)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user?.Stats == null) return NotFound();

            var recentGames = await _db.GameHistories
                .Where(g => g.UserId == userId)
                .OrderByDescending(g => g.PlayedAt)
                .Take(10)
                .Select(g => new GameHistoryDTO
                {
                    Difficulty = g.Difficulty,
                    IsUserWinner = g.IsUserWinner,
                    MmrChange = g.MmrChange,
                    PlayedAt = g.PlayedAt
                })
                .ToListAsync();

            var s = user.Stats;
            return Ok(new ProfileDTO
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Mmr = s.Mmr,
                GamesPlayed = s.GamesPlayed,
                Wins = s.Wins,
                Losses = s.Losses,
                WinRate = s.GamesPlayed == 0 ? 0 : Math.Round(100.0 * s.Wins / s.GamesPlayed, 1),
                CurrentWinStreak = s.CurrentWinStreak,
                RecentGames = recentGames
            });
        }

        [HttpGet("leaderboard")]
        public async Task<ActionResult<List<LeaderboardEntryDTO>>> Leaderboard([FromQuery] int take = 20)
        {
            take = Math.Clamp(take, 1, 100);

            var top = await _db.PlayerStats
                .OrderByDescending(s => s.Mmr)
                .Take(take)
                .Select(s => new LeaderboardEntryDTO
                {
                    Name = s.User!.Name,
                    Mmr = s.Mmr,
                    GamesPlayed = s.GamesPlayed,
                    Wins = s.Wins,
                    Losses = s.Losses
                })
                .ToListAsync();

            for (int i = 0; i < top.Count; i++) top[i].Rank = i + 1;
            return Ok(top);
        }
    }
}