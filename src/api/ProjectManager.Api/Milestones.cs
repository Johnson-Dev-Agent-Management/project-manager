using Microsoft.EntityFrameworkCore;

namespace ProjectManager.Api;

public record SaveMilestone(string? Title, string? Description, string? TargetDate);

public class ProjectMilestone
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string? TargetDate { get; set; }
}

public static class MilestoneEndpoints
{
    public static async Task ValidateAssignment(ProjectDb db, int projectId, int? milestoneId, Dictionary<string, string[]> errors)
    {
        if (milestoneId is not null && !await db.Milestones.AnyAsync(milestone => milestone.Id == milestoneId && milestone.ProjectId == projectId))
            errors["milestoneId"] = ["Choose an existing milestone in this project, or no milestone."];
    }

    private static Dictionary<string, string[]> Validate(SaveMilestone input)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(input.Title)) errors["title"] = ["Milestone title is required."];
        if (input.TargetDate is not null && !TaskPlanning.IsDate(input.TargetDate))
            errors["targetDate"] = ["Use a valid target date (YYYY-MM-DD)."];
        return errors;
    }

    public static void MapMilestones(this WebApplication app)
    {
        var milestones = app.MapGroup("/api/projects/{projectId:int}/milestones");
        milestones.MapPost("/", async (int projectId, SaveMilestone input, ProjectDb db) =>
        {
            if (!await db.Projects.AnyAsync(project => project.Id == projectId)) return Results.NotFound();
            var errors = Validate(input);
            if (errors.Count > 0) return Results.ValidationProblem(errors);
            var milestone = new ProjectMilestone { ProjectId = projectId, Title = input.Title!.Trim(), Description = input.Description, TargetDate = input.TargetDate };
            db.Milestones.Add(milestone);
            await db.SaveChangesAsync();
            return Results.Created($"/api/projects/{projectId}/milestones/{milestone.Id}", milestone);
        });
        milestones.MapGet("/{id:int}", async (int projectId, int id, ProjectDb db) =>
        {
            var milestone = await db.Milestones.SingleOrDefaultAsync(item => item.ProjectId == projectId && item.Id == id);
            return milestone is null ? Results.NotFound() : Results.Ok(milestone);
        });
        milestones.MapPut("/{id:int}", async (int projectId, int id, SaveMilestone input, ProjectDb db) =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync();
            var milestone = await db.Milestones.SingleOrDefaultAsync(item => item.ProjectId == projectId && item.Id == id);
            if (milestone is null) return Results.NotFound();
            var errors = Validate(input);
            if (errors.Count > 0) return Results.ValidationProblem(errors);
            milestone.Title = input.Title!.Trim();
            milestone.Description = input.Description;
            milestone.TargetDate = input.TargetDate;
            await db.SaveChangesAsync();
            await transaction.CommitAsync();
            return Results.Ok(milestone);
        });
        milestones.MapDelete("/{id:int}", async (int projectId, int id, ProjectDb db) =>
        {
            // One SQLite statement atomically removes the milestone and clears its
            // associations via ON DELETE SET NULL, preserving tasks and Today rows.
            var removed = await db.Milestones.Where(item => item.ProjectId == projectId && item.Id == id).ExecuteDeleteAsync();
            return removed == 0 ? Results.NotFound() : Results.Ok(new { id });
        });
    }
}
