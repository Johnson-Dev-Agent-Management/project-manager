using Microsoft.EntityFrameworkCore;

namespace ProjectManager.Api;

public static class ProjectEndpoints
{
    public static void MapProjects(this WebApplication app)
    {
        var projects = app.MapGroup("/api/projects");
        projects.MapGet("/", async (ProjectDb db) => await db.Projects.OrderBy(p => p.Id)
            .Select(p => new { p.Id, p.Name }).ToListAsync());
        projects.MapPost("/", async (CreateProject input, ProjectDb db) =>
        {
            if (string.IsNullOrWhiteSpace(input.Name)) return Required("name", "Project name is required.");
            var project = new Project { Name = input.Name.Trim() };
            db.Projects.Add(project);
            await db.SaveChangesAsync();
            return Results.Created($"/api/projects/{project.Id}", new { project.Id, project.Name });
        });
        projects.MapGet("/{id:int}", async (int id, string? day, ProjectDb db) =>
        {
            var project = await db.Projects.FindAsync(id);
            if (project is null) return Results.NotFound();
            if (day is not null && !TaskPlanning.IsDate(day)) return Required("day", "Use a valid local calendar day (YYYY-MM-DD).");
            var selectedTaskIds = await db.TodaySelections.Where(selection => selection.Day == day)
                .Where(selection => db.Tasks.Any(task => task.Id == selection.TaskId && task.ProjectId == id))
                .Select(selection => selection.TaskId).ToListAsync();
            var tasks = await db.Tasks.Where(task => task.ProjectId == id).OrderBy(task => task.Id).ToListAsync();
            var milestones = await db.Milestones.Where(milestone => milestone.ProjectId == id).OrderBy(milestone => milestone.Id).ToListAsync();
            return Results.Ok(new { project.Id, project.Name, project.Description, Tasks = tasks, SelectedTaskIds = selectedTaskIds, Milestones = milestones });
        });
        projects.MapPut("/{id:int}", async (int id, EditProject input, ProjectDb db) =>
        {
            var project = await db.Projects.FindAsync(id);
            if (project is null) return Results.NotFound();
            if (string.IsNullOrWhiteSpace(input.Name)) return Required("name", "Project name is required.");
            project.Name = input.Name.Trim();
            project.Description = input.Description;
            await db.SaveChangesAsync();
            return Results.Ok(project);
        });
        projects.MapPost("/{projectId:int}/tasks", async (int projectId, CreateTask input, ProjectDb db) =>
        {
            // Serialize validation and assignment with milestone removal.
            await using var transaction = await db.Database.BeginTransactionAsync();
            if (!await db.Projects.AnyAsync(project => project.Id == projectId)) return Results.NotFound();
            if (string.IsNullOrWhiteSpace(input.Title)) return Required("title", "Task title is required.");
            var errors = TaskPlanning.Validate(input.Priority, input.DueDate);
            await MilestoneEndpoints.ValidateAssignment(db, projectId, input.MilestoneId, errors);
            if (errors.Count > 0) return Results.ValidationProblem(errors);
            var task = new ProjectTask { ProjectId = projectId, Title = input.Title.Trim(), Notes = input.Notes, Priority = input.Priority!, DueDate = input.DueDate, MilestoneId = input.MilestoneId };
            db.Tasks.Add(task);
            await db.SaveChangesAsync();
            await transaction.CommitAsync();
            return Results.Created($"/api/projects/{projectId}/tasks/{task.Id}", task);
        });
        projects.MapGet("/{projectId:int}/tasks/{taskId:int}", async (int projectId, int taskId, ProjectDb db) =>
        {
            var task = await db.Tasks.SingleOrDefaultAsync(task => task.ProjectId == projectId && task.Id == taskId);
            return task is null ? Results.NotFound() : Results.Ok(task);
        });
        projects.MapPut("/{projectId:int}/tasks/{taskId:int}", async (int projectId, int taskId, EditTask input, ProjectDb db) =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync();
            var task = await db.Tasks.SingleOrDefaultAsync(task => task.ProjectId == projectId && task.Id == taskId);
            if (task is null) return Results.NotFound();
            var errors = TaskPlanning.Validate(input.Priority, input.DueDate);
            await MilestoneEndpoints.ValidateAssignment(db, projectId, input.MilestoneId, errors);
            if (string.IsNullOrWhiteSpace(input.Title)) errors["title"] = ["Task title is required."];
            if (!TaskPlanning.IsStatus(input.Status))
                errors["status"] = ["Choose To do, In progress, or Done."];
            if (errors.Count > 0) return Results.ValidationProblem(errors);
            task.Title = input.Title!.Trim();
            task.Notes = input.Notes;
            task.Status = input.Status!;
            task.Priority = input.Priority!;
            task.DueDate = input.DueDate;
            task.MilestoneId = input.MilestoneId;
            await db.SaveChangesAsync();
            await transaction.CommitAsync();
            return Results.Ok(task);
        });
    }

    private static IResult Required(string field, string message) =>
        Results.ValidationProblem(new Dictionary<string, string[]> { [field] = [message] });
}
