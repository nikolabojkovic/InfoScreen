namespace FinancialApi.Dtos;

public record SettingsDto(
    string Theme,
    bool SidebarExpanded,
    decimal EurRate,
    string DataSource
);
