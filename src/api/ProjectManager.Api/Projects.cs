using Microsoft.EntityFrameworkCore;

namespace ProjectManager.Api;

public record CreateProject(string? Name);
public class Project { public int Id { get; set; } public string Name { get; set; } = ""; }
public class ProjectDb(DbContextOptions<ProjectDb> options) : DbContext(options) { public DbSet<Project> Projects => Set<Project>(); }
