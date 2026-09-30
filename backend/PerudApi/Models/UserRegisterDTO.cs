using System.ComponentModel.DataAnnotations;
namespace PerudApi.Models
{
    public class UserRegisterDTO
    {
        [Required, MinLength(3)] public string Name { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, MinLength(6)]
        public string Password { get; set; } = string.Empty;
    }
}