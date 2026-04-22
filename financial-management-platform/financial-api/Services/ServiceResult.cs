namespace FinancialApi.Services;

/// <summary>Wraps a service operation result: success value, validation error, or not-found.</summary>
public class ServiceResult<T>
{
    public T? Value { get; init; }
    public string? Error { get; init; }
    public bool NotFound { get; init; }

    public static ServiceResult<T> Ok(T value) => new() { Value = value };
    public static ServiceResult<T> Fail(string error) => new() { Error = error };
    public static ServiceResult<T> Miss() => new() { NotFound = true };
}
