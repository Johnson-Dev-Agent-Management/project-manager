using Microsoft.EntityFrameworkCore;

namespace ProjectManager.Api;

public record CaptureItem(string? Title);
public record EditInboxItem(string? Title, string? Notes);
public record MoveInboxItem(int? ProjectId);

public class InboxItem
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string? Notes { get; set; }
    public DateTime CapturedAt { get; set; }
}

public static class InboxEndpoints
{
    private static IResult Invalid(string field, string message) =>
        Results.ValidationProblem(new Dictionary<string, string[]> { [field] = [message] });

    public static void MapInbox(this WebApplication app)
    {
        var inbox = app.MapGroup("/api/inbox");
        inbox.MapGet("/", async (ProjectDb db) => await db.InboxItems
            .OrderByDescending(item => item.CapturedAt).ThenByDescending(item => item.Id).ToListAsync());
        inbox.MapPost("/", async (CaptureItem input, ProjectDb db) =>
        {
            if (string.IsNullOrWhiteSpace(input.Title)) return Invalid("title", "Item title is required.");
            var item = new InboxItem { Title = input.Title.Trim(), CapturedAt = DateTime.UtcNow };
            db.InboxItems.Add(item);
            await db.SaveChangesAsync();
            return Results.Created($"/api/inbox/{item.Id}", item);
        });
        inbox.MapGet("/{id:int}", async (int id, ProjectDb db) =>
        {
            var item = await db.InboxItems.FindAsync(id);
            return item is null ? Results.NotFound() : Results.Ok(item);
        });
        inbox.MapPut("/{id:int}", async (int id, EditInboxItem input, ProjectDb db) =>
        {
            var item = await db.InboxItems.FindAsync(id);
            if (item is null) return Results.NotFound();
            if (string.IsNullOrWhiteSpace(input.Title)) return Invalid("title", "Item title is required.");
            item.Title = input.Title.Trim();
            item.Notes = input.Notes;
            await db.SaveChangesAsync();
            return Results.Ok(item);
        });
        inbox.MapDelete("/{id:int}", async (int id, ProjectDb db) =>
        {
            var removed = await db.InboxItems.Where(item => item.Id == id).ExecuteDeleteAsync();
            return removed == 0 ? Results.NotFound() : Results.Ok(new { id });
        });
        inbox.MapPost("/{id:int}/move", async (int id, MoveInboxItem input, ProjectDb db) =>
        {
            if (input.ProjectId is null or <= 0) return Invalid("projectId", "Choose an existing destination project.");
            // SQLite begins an immediate write transaction before reading the item.
            // Competing moves serialize: only the first can consume this inbox row.
            await using var transaction = await db.Database.BeginTransactionAsync();
            if (!await db.Projects.AnyAsync(project => project.Id == input.ProjectId))
                return Invalid("projectId", "The destination project no longer exists. Choose another project.");
            var item = await db.InboxItems.FindAsync(id);
            if (item is null) return Results.NotFound();
            var task = new ProjectTask { ProjectId = input.ProjectId.Value, Title = item.Title, Notes = item.Notes };
            db.Tasks.Add(task);
            db.InboxItems.Remove(item);
            await db.SaveChangesAsync();
            await transaction.CommitAsync();
            return Results.Created($"/api/projects/{task.ProjectId}/tasks/{task.Id}", task);
        });
    }
}
