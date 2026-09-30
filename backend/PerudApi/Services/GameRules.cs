using System.Security.Cryptography;
using PerudApi.Models;

namespace PerudApi.Services
{
    public static class GameRules
    {
        public const int StartDice = 5;

        public static List<int> Roll(int count) =>
            Enumerable.Range(0, count).Select(_ => RandomNumberGenerator.GetInt32(1, 7)).ToList();

        public static int CountFace(IEnumerable<int> dice, int face) =>
            face == 1 ? dice.Count(d => d == 1) : dice.Count(d => d == face || d == 1);

        public static int TotalDice(GameState s) => s.PlayerDice.Count + s.AiDice.Count;

        public static bool IsLegalBid(GameState s, int quantity, int face, out string error)
        {
            error = string.Empty;
            int total = TotalDice(s);

            if (face < 1 || face > 6) { error = "Номінал має бути від 1 до 6"; return false; }
            if (quantity < 1 || quantity > total) { error = $"Кількість має бути від 1 до {total}"; return false; }

            if (s.CurrentBidQuantity > 0)
            {
                bool higher = quantity > s.CurrentBidQuantity
                    || (quantity == s.CurrentBidQuantity && face > s.CurrentBidNominal);
                if (!higher)
                {
                    error = "Ставка має бути вищою: більше кубиків або та сама кількість з вищим номіналом";
                    return false;
                }
            }
            return true;
        }

        public static void ApplyBid(GameState s, int quantity, int face, bool byPlayer)
        {
            s.CurrentBidQuantity = quantity;
            s.CurrentBidNominal = face;
            s.LastBidByPlayer = byPlayer;
            s.BidHistory = s.BidHistory.Append($"{(byPlayer ? "player" : "ai")}:{quantity}x{face}").ToList();
            s.IsPlayerTurn = !byPlayer;
        }

        public static RoundResultDTO ResolveDudo(GameState s, bool callerIsPlayer)
        {
            int actual = CountFace(s.PlayerDice.Concat(s.AiDice), s.CurrentBidNominal);
            bool bidWasTrue = actual >= s.CurrentBidQuantity;
            bool playerLoses = callerIsPlayer ? bidWasTrue : !bidWasTrue;

            if (callerIsPlayer)
            {
                if (playerLoses) s.FailedDudoCalls++; else s.SuccessfulDudoCalls++;
            }

            var result = new RoundResultDTO
            {
                PlayerDice = s.PlayerDice.ToList(),
                AiDice = s.AiDice.ToList(),
                BidQuantity = s.CurrentBidQuantity,
                BidFace = s.CurrentBidNominal,
                ActualCount = actual,
                BidWasTrue = bidWasTrue,
                CallerIsPlayer = callerIsPlayer,
                PlayerLostDie = playerLoses
            };

            bool callerWasRight = callerIsPlayer ? bidWasTrue == false : bidWasTrue == true;
            
            if (playerLoses) s.PlayerDice.RemoveAt(Random.Shared.Next(s.PlayerDice.Count));
            else s.AiDice.RemoveAt(Random.Shared.Next(s.AiDice.Count));
            
            if (s.PlayerDice.Count == 0 || s.AiDice.Count == 0)
            {
                s.IsGameEnded = true;
            }
            else
            {
                s.PlayerDice = Roll(s.PlayerDice.Count);
                s.AiDice = Roll(s.AiDice.Count);
                s.Round++;
                s.CurrentBidQuantity = 0;
                s.CurrentBidNominal = 0;
                s.BidHistory = new List<string>();
                s.IsPlayerTurn = playerLoses; 
            }

            return result;
        }
    }
}