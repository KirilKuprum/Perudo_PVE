using PerudApi.Models;

namespace PerudApi.Services
{
    public enum AiAction { Bid, Dudo }
    public record AiMove(AiAction Action, int Quantity, int Face, string Message);

    public interface IAiPlayer
    {
        Task<AiMove> DecideAsync(GameState state);
    }

}