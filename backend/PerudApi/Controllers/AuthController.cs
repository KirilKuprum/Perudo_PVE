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
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly JwtService _jwt;

        public AuthController(AppDbContext db, JwtService jwt)
        {
            _db = db;
            _jwt = jwt;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDTO>> Register(UserRegisterDTO dto)
        {
            var name = dto.Name.Trim();
            var email = dto.Email.Trim().ToLowerInvariant();

            if (await _db.Users.AnyAsync(u => u.Email == email))
                return Conflict(new { message = "Цей email уже зареєстрований" });

            if (await _db.Users.AnyAsync(u => u.Name.ToLower() == name.ToLower()))
                return Conflict(new { message = "Цей нікнейм уже зайнятий" });

            var user = new User
            {
                Name = name,
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Stats = new PlayerStats()   
            };

            _db.Users.Add(user);

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return Conflict(new { message = "Email або нікнейм уже зайняті" });
            }

            return Ok(BuildResponse(user));
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDTO>> Login(UserLoginDTO dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null || !VerifyPassword(dto.Password, user.PasswordHash))
                return Unauthorized(new { message = "Неправильний email або пароль" });

            return Ok(BuildResponse(user));
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<UserDTO>> Me()
        {
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(idClaim, out var userId)) return Unauthorized();

            var user = await _db.Users.FindAsync(userId);
            if (user == null) return Unauthorized();

            return Ok(ToDto(user));
        }

        private AuthResponseDTO BuildResponse(User user) => new()
        {
            Token = _jwt.CreateToken(user),
            User = ToDto(user)
        };

        private static UserDTO ToDto(User u) => new()
        {
            Id = u.Id,
            Name = u.Name,
            Email = u.Email,
            Role = u.Role
        };

        private static bool VerifyPassword(string password, string hash)
        {
            try { return BCrypt.Net.BCrypt.Verify(password, hash); }
            catch { return false; }   
        }
    }
}