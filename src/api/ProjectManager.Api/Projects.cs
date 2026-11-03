using Microsoft.EntityFrameworkCore;

namespace ProjectManager.Api;

public record CreateProject(string? Name);
public record EditProject(string? Name, string? Description);
public record CreateTask(string? Title, string? Notes, string? Priority = "None", string? DueDate = null);
public record EditTask(string? Title, string? Notes, string? Status, string? Priority = "None", string? DueDate = null);

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
    public string Priority { get; set; } = "None";
    public string? DueDate { get; set; }
}

public class TodaySelection
{
    public int TaskId { get; set; }
    public string Day { get; set; } = "";
}

public class ProjectDb(DbContextOptions<ProjectDb> options) : DbContext(options)
{
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectTask> Tasks => Set<ProjectTask>();
    public DbSet<TodaySelection> TodaySelections => Set<TodaySelection>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProjectTask>().HasOne<Project>().WithMany().HasForeignKey(task => task.ProjectId);
        modelBuilder.Entity<TodaySelection>().HasKey(selection => new { selection.TaskId, selection.Day });
        modelBuilder.Entity<TodaySelection>().HasOne<ProjectTask>().WithMany().HasForeignKey(selection => selection.TaskId);
        modelBuilder.Entity<ProjectTask>().Property(task => task.Priority).HasDefaultValue("None");
        modelBuilder.Entity<ProjectTask>().ToTable("Tasks", table =>
            table.HasCheckConstraint("CK_Tasks_Priority", "\"Priority\" IN ('None', 'Low', 'Medium', 'High')"));
        modelBuilder.Entity<ProjectTask>().ToTable("Tasks", table =>
            table.HasCheckConstraint("CK_Tasks_Status", "\"Status\" IN ('To do', 'In progress', 'Done')"));
    }
}
