using Microsoft.EntityFrameworkCore;
using ProjectManager.Api;
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<ProjectDb>(options => options.UseSqlite(builder.Configuration.GetConnectionString("Projects") ?? "Data Source=projects.db"));
var app = builder.Build();
using (var scope = app.Services.CreateScope()) scope.ServiceProvider.GetRequiredService<ProjectDb>().Database.EnsureCreated();
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.MapProjects();
app.Run();
