using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PerudApi.DbContexts;
using PerudApi.Models;
using PerudApi.Services;

namespace PerudApi.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/game")]
    public class GameController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IAiPlayer _ai;

        public GameController(AppDbContext db, IAiPlayer ai)
        {
            _db = db;
            _ai = ai;
        }

        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost("start")]
        public async Task<ActionResult<GameStateDTO>> Start(StartGameDTO dto)
        {
            var difficulty = dto.Difficulty is "Easy" or "Medium" or "Hard" ? dto.Difficulty : "Medium";

            var old = await _db.GameStates.Where(g => g.UserId == UserId && !g.IsGameEnded).ToListAsync();
            _db.GameStates.RemoveRange(old);

            var state = new GameState
            {
                UserId = UserId,
                Difficulty = difficulty,
                PlayerDice = GameRules.Roll(GameRules.StartDice),
                AiDice = GameRules.Roll(GameRules.StartDice),
                IsPlayerTurn = true
            };

            _db.GameStates.Add(state);
            await _db.SaveChangesAsync();
            return Ok(ToDto(state));
        }

        [HttpGet("current")]
        public async Task<ActionResult<GameStateDTO>> Current()
        {
            var state = await GetActiveGame();
            if (state == null) return NotFound(new { message = "Активної гри немає" });
            return Ok(ToDto(state));
        }

        [HttpPost("bid")]
        public async Task<ActionResult<GameResponseDTO>> Bid(BidDTO dto)
        {
            var state = await GetActiveGame();
            if (state == null) return NotFound(new { message = "Активної гри немає" });
            if (!state.IsPlayerTurn) return BadRequest(new { message = "Зараз не ваш хід" });

            if (!GameRules.IsLegalBid(state, dto.Quantity, dto.Face, out var error))
                return BadRequest(new { message = error });

            GameRules.ApplyBid(state, dto.Quantity, dto.Face, byPlayer: true);
            var response = await PlayAiTurnIfNeeded(state);
            return Ok(response);
        }

        [HttpPost("dudo")]
        public async Task<ActionResult<GameResponseDTO>> Dudo()
        {
            var state = await GetActiveGame();
            if (state == null) return NotFound(new { message = "Активної гри немає" });
            if (!state.IsPlayerTurn) return BadRequest(new { message = "Зараз не ваш хід" });
            if (state.CurrentBidQuantity == 0) return BadRequest(new { message = "Ще немає ставки, яку можна оскаржити" });

            var roundResult = GameRules.ResolveDudo(state, callerIsPlayer: true);
            await FinalizeIfEnded(state);

            var response = new GameResponseDTO { State = ToDto(state), RoundResult = roundResult };

            if (!state.IsGameEnded)
                response = await PlayAiTurnIfNeeded(state, response);
            else
                await _db.SaveChangesAsync();

            return Ok(response);
        }

        private async Task<GameResponseDTO> PlayAiTurnIfNeeded(GameState state, GameResponseDTO? response = null)
        {
            response ??= new GameResponseDTO { State = ToDto(state) };

            while (!state.IsPlayerTurn && !state.IsGameEnded)
            {
                var move = await _ai.DecideAsync(state);
                response.AiMessage = move.Message;

                if (move.Action == AiAction.Dudo)
                {
                    var roundResult = GameRules.ResolveDudo(state, callerIsPlayer: false);
                    await FinalizeIfEnded(state);
                    response.RoundResult = roundResult;
                }
                else
                {
                    GameRules.ApplyBid(state, move.Quantity, move.Face, byPlayer: false);
                }
            }

            await _db.SaveChangesAsync();
            response.State = ToDto(state);
            return response;
        }

        private async Task FinalizeIfEnded(GameState state)
        {
            if (!state.IsGameEnded) return;

            bool playerWon = state.PlayerDice.Count > 0;

            var stats = await _db.PlayerStats.FirstAsync(s => s.UserId == state.UserId);
            
            int winStreakAfter = playerWon ? stats.CurrentWinStreak + 1 : 0;
            int mmrChange = CalculateMmrChange(state, playerWon, winStreakAfter);

            stats.GamesPlayed++;
            stats.Mmr += mmrChange;
            stats.SuccessfulDudo += state.SuccessfulDudoCalls;
            stats.FailedDudo += state.FailedDudoCalls;

            if (playerWon)
            {
                stats.Wins++;
                stats.CurrentWinStreak++;
                stats.BestWinStreak = Math.Max(stats.BestWinStreak, stats.CurrentWinStreak);
            }
            else
            {
                stats.Losses++;
                stats.CurrentWinStreak = 0;
            }

            _db.GameHistories.Add(new GameHistory
            {
                UserId = state.UserId,
                Difficulty = state.Difficulty,
                IsUserWinner = playerWon,
                MmrChange = mmrChange,
                RoundsPlayed = state.Round
            });
        }

        private static int CalculateMmrChange(GameState state, bool won, int winStreakAfter)
        {
            double baseScore = won ? 20 : -25;

            double difficultyMult = state.Difficulty switch
            {
                "Easy" => 0.6,
                "Hard" => 1.5,
                _ => 1.0
            };

            int streakBonus = won ? Math.Min(winStreakAfter * 2, 10) : 0;

            int dudoBonus = state.SuccessfulDudoCalls * 3 - state.FailedDudoCalls * 2;

            int total = (int)Math.Round((baseScore + streakBonus) * difficultyMult + dudoBonus);
            return Math.Clamp(total, -40, 50);
        }

        private Task<GameState?> GetActiveGame() =>
            _db.GameStates.FirstOrDefaultAsync(g => g.UserId == UserId && !g.IsGameEnded);

        private static GameStateDTO ToDto(GameState s) => new()
        {
            Id = s.Id,
            Difficulty = s.Difficulty,
            Round = s.Round,
            PlayerDice = s.PlayerDice,
            AiDiceCount = s.AiDice.Count,
            CurrentBidQuantity = s.CurrentBidQuantity,
            CurrentBidNominal = s.CurrentBidNominal,
            LastBidByPlayer = s.LastBidByPlayer,
            BidHistory = s.BidHistory,
            IsPlayerTurn = s.IsPlayerTurn,
            IsGameEnded = s.IsGameEnded,
            PlayerWon = s.IsGameEnded ? s.PlayerDice.Count > 0 : null
        };
    }
}