using FinancialApi.Dtos;
using FinancialApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace financial_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;
    private readonly ICurrentUserService _currentUser;

    public CategoriesController(ICategoryService categoryService, ICurrentUserService currentUser)
    {
        _categoryService = categoryService;
        _currentUser = currentUser;
    }

    // ── Endpoints ─────────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll([FromQuery] int? month, [FromQuery] int? year)
    {
        var userId = await _currentUser.GetUserIdAsync();
        if (userId == null) return Unauthorized();

        return Ok(await _categoryService.GetAllAsync(userId.Value, month, year));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoryDto>> GetById(int id)
    {
        var userId = await _currentUser.GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var category = await _categoryService.GetByIdAsync(id, userId.Value);
        return category == null ? NotFound() : Ok(category);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryRequest request)
    {
        var userId = await _currentUser.GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var created = await _categoryService.CreateAsync(userId.Value, request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CategoryDto>> Update(int id, [FromBody] UpdateCategoryRequest request)
    {
        var userId = await _currentUser.GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var result = await _categoryService.UpdateAsync(id, userId.Value, request);
        if (result.NotFound) return NotFound();
        return Ok(result.Value);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = await _currentUser.GetUserIdAsync();
        if (userId == null) return Unauthorized();

        return await _categoryService.DeleteAsync(id, userId.Value) ? NoContent() : NotFound();
    }
}
