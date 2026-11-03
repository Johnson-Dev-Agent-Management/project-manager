using System.Globalization;
using Microsoft.EntityFrameworkCore;

namespace ProjectManager.Api;

public record SelectToday(bool? Selected);
public record ChangeTaskStatus(string? Status);
public record TodayTask(ProjectTask Task, string ProjectName);
public record TodayPlan(List<TodayTask> Selected, List<TodayTask> Due, List<TodayTask> Completed);

public static class TaskPlanning
{
    public static bool IsDate(string? value) => value is { Length: 10 } &&
        DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _);

    public static bool IsStatus(string? value) => value is "To do" or "In progress" or "Done";

    public static Dictionary<string, string[]> Validate(string? priority, string? dueDate)
    {
        var errors = new Dictionary<string, string[]>();
        if (priority is not ("None" or "Low" or "Medium" or "High"))
            errors["priority"] = ["Choose None, Low, Medium, or High."];
        if (dueDate is not null && !IsDate(dueDate))
            errors["dueDate"] = ["Use a valid calendar date (YYYY-MM-DD), or null to clear it."];
        return errors;
    }

    private static IResult InvalidDay() => Results.ValidationProblem(new Dictionary<string, string[]>
    {
        ["day"] = ["Use a valid local calendar day (YYYY-MM-DD)."]
    });

    private static int PriorityRank(TodayTask item) => item.Task.Priority switch
    {
        "High" => 0,
        "Medium" => 1,
        "Low" => 2,
        _ => 3
    };

    public static void MapToday(this WebApplication app)
    {
        app.MapGet("/api/today/{day}", async (string day, ProjectDb db) =>
        {
            if (!IsDate(day)) return InvalidDay();
            var selections = db.TodaySelections.Where(selection => selection.Day == day);
            var tasks = await (from task in db.Tasks
                               join project in db.Projects on task.ProjectId equals project.Id
                               where selections.Any(selection => selection.TaskId == task.Id) ||
                                   (task.Status != "Done" && task.DueDate != null)
                               select new TodayTask(task, project.Name)).ToListAsync();
            var selectedIds = await selections.Select(selection => selection.TaskId).ToListAsync();
            var selected = tasks.Where(item => selectedIds.Contains(item.Task.Id)).ToList();
            var ordered = selected.OrderBy(PriorityRank).ThenBy(item => item.Task.DueDate ?? "9999-99-99", StringComparer.Ordinal)
                .ThenBy(item => item.Task.Id).ToList();
            var due = tasks.Where(item => !selectedIds.Contains(item.Task.Id) && string.Compare(item.Task.DueDate, day, StringComparison.Ordinal) <= 0)
                .OrderBy(item => item.Task.DueDate, StringComparer.Ordinal).ThenBy(PriorityRank).ThenBy(item => item.Task.Id).ToList();
            return Results.Ok(new TodayPlan([.. ordered.Where(item => item.Task.Status != "Done")], due,
                [.. ordered.Where(item => item.Task.Status == "Done")]));
        });
        app.MapPut("/api/today/{day}/tasks/{taskId:int}", async (string day, int taskId, SelectToday input, ProjectDb db) =>
        {
            if (!IsDate(day)) return InvalidDay();
            if (input.Selected is null) return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["selected"] = ["Choose whether the task is selected for this day."]
            });
            var task = await db.Tasks.FindAsync(taskId);
            if (task is null) return Results.NotFound();
            var selection = await db.TodaySelections.FindAsync(taskId, day);
            if (input.Selected == true && selection is null)
            {
                if (task.Status == "Done") return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["task"] = ["Reopen this task before adding it to today."]
                });
                // The unique key makes repeated selections idempotent, including concurrent requests.
                await db.Database.ExecuteSqlInterpolatedAsync($"INSERT OR IGNORE INTO TodaySelections (TaskId, Day) VALUES ({taskId}, {day})");
            }
            else if (input.Selected == false && selection is not null)
            {
                db.TodaySelections.Remove(selection);
                await db.SaveChangesAsync();
            }
            return Results.Ok(new { input.Selected });
        });
        // A narrow status edit avoids overwriting title, notes, priority or due date from a stale Today row.
        app.MapPut("/api/tasks/{taskId:int}/status", async (int taskId, ChangeTaskStatus input, ProjectDb db) =>
        {
            var task = await db.Tasks.FindAsync(taskId);
            if (task is null) return Results.NotFound();
            if (!IsStatus(input.Status)) return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["status"] = ["Choose To do, In progress, or Done."]
            });
            task.Status = input.Status!;
            await db.SaveChangesAsync();
            return Results.Ok(task);
        });
    }
}
