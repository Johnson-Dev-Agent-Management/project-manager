using Microsoft.EntityFrameworkCore;

namespace ProjectManager.Api;

public record CreateProject(string? Name);
public record EditProject(string? Name, string? Description);
public record CreateTask(string? Title, string? Notes);
public record EditTask(string? Title, string? Notes, string? Status);

public class Project
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
}

public class ProjectTask
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string Title { get; set; } = "";
    public string? Notes { get; set; }
    public string Status { get; set; } = "To do";
}

public class ProjectDb(DbContextOptions<ProjectDb> options) : DbContext(options)
{
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectTask> Tasks => Set<ProjectTask>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProjectTask>().HasOne<Project>().WithMany().HasForeignKey(task => task.ProjectId);
        modelBuilder.Entity<ProjectTask>().ToTable("Tasks", table =>
            table.HasCheckConstraint("CK_Tasks_Status", "\"Status\" IN ('To do', 'In progress', 'Done')"));
    }
}
