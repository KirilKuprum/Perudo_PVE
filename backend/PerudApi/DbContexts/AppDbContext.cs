using Microsoft.EntityFrameworkCore;
using PerudApi.Models;

namespace PerudApi.DbContexts
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<PlayerStats> PlayerStats { get; set; }
        public DbSet<GameHistory> GameHistories { get; set; }
        public DbSet<GameState> GameStates { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasOne(u => u.Stats)
                .WithOne(s => s.User)
                .HasForeignKey<PlayerStats>(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}