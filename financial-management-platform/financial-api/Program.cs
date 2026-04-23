
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FinancialApi.Data;
using FinancialApi.Models;
using FinancialApi.Services;
using FinancialApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// Add CORS policy
builder.Services.AddCors(options =>
{
	options.AddPolicy("AllowMultipleOrigins",
		policy => policy
			.WithOrigins(
				"http://localhost:4200",
				"https://developer-tool.com",
        "https://financial.developer-tool.com"
			)
			.AllowAnyMethod()
			.AllowAnyHeader()
			.AllowCredentials());
});



var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
	?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");

// JWT configuration
var jwtSettings = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSettings.GetValue<string>("Key")
	?? throw new InvalidOperationException("JWT Key is not configured.");
var jwtIssuer = jwtSettings.GetValue<string>("Issuer");
var jwtAudience = jwtSettings.GetValue<string>("Audience");

builder.Services.AddAuthentication(options =>
{
	options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
	options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
	options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
	options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
	options.SaveToken = true;
	options.TokenValidationParameters = new TokenValidationParameters
	{
		ValidateIssuer = true,
		ValidateAudience = true,
		ValidateLifetime = true,
		ValidateIssuerSigningKey = true,
		ValidIssuer = jwtIssuer,
		ValidAudience = jwtAudience,
		IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
	};
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddAuthorization();
builder.Services.AddSwaggerGen(options =>
{
	options.SwaggerDoc("v1", new OpenApiInfo { Title = "Financial API", Version = "v1" });
	options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
	{
		Name = "Authorization",
		Type = SecuritySchemeType.Http,
		Scheme = "bearer",
		BearerFormat = "JWT",
		In = ParameterLocation.Header,
		Description = "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'"
	});
    options.AddSecurityRequirement(document =>
      new OpenApiSecurityRequirement
      {
          [new OpenApiSecuritySchemeReference("Bearer", document)] = []
      });
});


builder.Services.AddControllers();
builder.Services.AddDbContext<FinancialDbContext>(options =>
	options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 36))));

// Application services
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IIncomeService, IncomeService>();
builder.Services.AddScoped<ISettingsService, SettingsService>();


var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
	var db = scope.ServiceProvider.GetRequiredService<FinancialDbContext>();
	await db.Database.MigrateAsync();

	if (!await db.Users.AnyAsync(user => user.Username == "admin"))
	{
		db.Users.Add(new User
		{
			Username = "admin",
			Password = "Admin123!",
			FullName = "Administrator",
		});

		await db.SaveChangesAsync();
	}
}

app.UseSwagger();
app.UseSwaggerUI();

// Enable CORS before authentication and authorization
app.UseCors("AllowMultipleOrigins");

app.UseAuthentication();
app.UseAuthorization();

// Enable attribute routing for controllers
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
	.WithName("HealthCheck");

app.MapGet("/db", (FinancialDbContext db) => Results.Ok(new { provider = db.Database.ProviderName }))
	.WithName("DatabaseInfo");

app.Run();
