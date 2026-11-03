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
        projects.MapGet("/{id:int}", async (int id, ProjectDb db) =>
        {
            var project = await db.Projects.FindAsync(id);
            if (project is null) return Results.NotFound();
            var tasks = await db.Tasks.Where(task => task.ProjectId == id).OrderBy(task => task.Id).ToListAsync();
            return Results.Ok(new { project.Id, project.Name, project.Description, Tasks = tasks });
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
            if (!await db.Projects.AnyAsync(project => project.Id == projectId)) return Results.NotFound();
            if (string.IsNullOrWhiteSpace(input.Title)) return Required("title", "Task title is required.");
            var task = new ProjectTask { ProjectId = projectId, Title = input.Title.Trim(), Notes = input.Notes };
            db.Tasks.Add(task);
            await db.SaveChangesAsync();
            return Results.Created($"/api/projects/{projectId}/tasks/{task.Id}", task);
        });
        projects.MapGet("/{projectId:int}/tasks/{taskId:int}", async (int projectId, int taskId, ProjectDb db) =>
        {
            var task = await db.Tasks.SingleOrDefaultAsync(task => task.ProjectId == projectId && task.Id == taskId);
            return task is null ? Results.NotFound() : Results.Ok(task);
        });
        projects.MapPut("/{projectId:int}/tasks/{taskId:int}", async (int projectId, int taskId, EditTask input, ProjectDb db) =>
        {
            var task = await db.Tasks.SingleOrDefaultAsync(task => task.ProjectId == projectId && task.Id == taskId);
            if (task is null) return Results.NotFound();
            var errors = new Dictionary<string, string[]>();
            if (string.IsNullOrWhiteSpace(input.Title)) errors["title"] = ["Task title is required."];
            if (input.Status is not ("To do" or "In progress" or "Done"))
                errors["status"] = ["Choose To do, In progress, or Done."];
            if (errors.Count > 0) return Results.ValidationProblem(errors);
            task.Title = input.Title!.Trim();
            task.Notes = input.Notes;
            task.Status = input.Status!;
            await db.SaveChangesAsync();
            return Results.Ok(task);
        });
    }

    private static IResult Required(string field, string message) =>
        Results.ValidationProblem(new Dictionary<string, string[]> { [field] = [message] });
}
