using Microsoft.EntityFrameworkCore;
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<ProjectDb>(options => options.UseSqlite(builder.Configuration.GetConnectionString("Projects") ?? "Data Source=projects.db"));
var app = builder.Build();
using (var scope = app.Services.CreateScope()) scope.ServiceProvider.GetRequiredService<ProjectDb>().Database.EnsureCreated();
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/api/projects", async (ProjectDb db) => await db.Projects.OrderBy(p => p.Id).ToListAsync());
app.MapPost("/api/projects", async (CreateProject input, ProjectDb db) => {
    if (string.IsNullOrWhiteSpace(input.Name)) return Results.ValidationProblem(new Dictionary<string, string[]> { ["name"] = ["Project name is required."] });
    var project = new Project { Name = input.Name.Trim() };
    db.Projects.Add(project);
    await db.SaveChangesAsync();
    return Results.Created($"/api/projects/{project.Id}", project);
});
app.Run();
public record CreateProject(string? Name);
public class Project { public int Id { get; set; } public string Name { get; set; } = ""; }
public class ProjectDb(DbContextOptions<ProjectDb> options) : DbContext(options) { public DbSet<Project> Projects => Set<Project>(); }
public partial class Program { }
