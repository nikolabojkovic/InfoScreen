using FinancialApi.Dtos;
using FinancialApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace financial_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactionService;
    private readonly ICurrentUserService _currentUser;

    public TransactionsController(ITransactionService transactionService, ICurrentUserService currentUser)
    {
        _transactionService = transactionService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<List<TransactionDto>>> GetAll(
        [FromQuery] int? month,
        [FromQuery] int? year,
        [FromQuery] string? type)
    {
        var userId = await _currentUser.GetUserIdAsync();
        if (userId == null) return Unauthorized();

        return Ok(await _transactionService.GetAllAsync(userId.Value, month, year, type));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TransactionDto>> GetById(int id)
    {
        var userId = await _currentUser.GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var transaction = await _transactionService.GetByIdAsync(id, userId.Value);
        return transaction == null ? NotFound() : Ok(transaction);
    }

    [HttpPost]
    public async Task<ActionResult<TransactionDto>> Create([FromBody] CreateTransactionRequest request)
    {
        var userId = await _currentUser.GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var result = await _transactionService.CreateAsync(userId.Value, request);
        if (result.Error != null) return BadRequest(result.Error);

        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TransactionDto>> Update(int id, [FromBody] UpdateTransactionRequest request)
    {
        var userId = await _currentUser.GetUserIdAsync();
        if (userId == null) return Unauthorized();

        var result = await _transactionService.UpdateAsync(id, userId.Value, request);
        if (result.NotFound) return NotFound();
        if (result.Error != null) return BadRequest(result.Error);

        return Ok(result.Value);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = await _currentUser.GetUserIdAsync();
        if (userId == null) return Unauthorized();

        return await _transactionService.DeleteAsync(id, userId.Value) ? NoContent() : NotFound();
    }
}
