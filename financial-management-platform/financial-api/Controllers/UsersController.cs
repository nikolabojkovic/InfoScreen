using FinancialApi.Data;
using FinancialApi.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace financial_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly FinancialDbContext _context;

    public UsersController(FinancialDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
        var users = await _context.Users
            .Select(u => new UserDto(u.Id, u.Username, u.FullName, u.CreatedAt))
            .ToListAsync();
        return Ok(users);
    }
}