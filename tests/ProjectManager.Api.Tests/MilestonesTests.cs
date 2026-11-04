using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace ProjectManager.Api.Tests;

public sealed class MilestonesTests
{
    private sealed class Scenario : IDisposable
    {
        private readonly string directory = Path.Combine(Path.GetTempPath(), $"milestones-{Guid.NewGuid()}");
        private string DatabasePath => Path.Combine(directory, "projects.db");
        public Scenario() => Directory.CreateDirectory(directory);
        public WebApplicationFactory<Program> Start() => new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => builder.ConfigureAppConfiguration((_, config) =>
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:Projects"] = $"Data Source={DatabasePath};Pooling=False"
                })));
        public void Sql(string sql)
        {
            using var connection = new SqliteConnection($"Data Source={DatabasePath};Pooling=False");
            connection.Open();
            using var command = connection.CreateCommand();
            command.CommandText = sql;
            command.ExecuteNonQuery();
        }
        public void CopyStageThreeDatabase()
        {
            Sql("""
                CREATE TABLE Projects (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, Name TEXT NOT NULL, Description TEXT NULL);
                CREATE TABLE Tasks (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ProjectId INTEGER NOT NULL,
                    Title TEXT NOT NULL, Notes TEXT NULL, Status TEXT NOT NULL, Priority TEXT NOT NULL DEFAULT 'None', DueDate TEXT NULL,
                    CONSTRAINT CK_Tasks_Status CHECK (Status IN ('To do', 'In progress', 'Done')),
                    CONSTRAINT CK_Tasks_Priority CHECK (Priority IN ('None', 'Low', 'Medium', 'High')),
                    FOREIGN KEY (ProjectId) REFERENCES Projects (Id) ON DELETE CASCADE);
                CREATE INDEX IX_Tasks_ProjectId ON Tasks (ProjectId);
                CREATE TABLE TodaySelections (TaskId INTEGER NOT NULL, Day TEXT NOT NULL, PRIMARY KEY (TaskId, Day),
                    FOREIGN KEY (TaskId) REFERENCES Tasks (Id) ON DELETE CASCADE);
                CREATE TABLE InboxItems (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, Title TEXT NOT NULL, Notes TEXT NULL, CapturedAt TEXT NOT NULL);
                INSERT INTO Projects VALUES (7, 'Retained project', 'Keep description');
                INSERT INTO Tasks VALUES (12, 7, 'Retained task', 'Keep notes', 'In progress', 'High', '2026-11-03');
                INSERT INTO TodaySelections VALUES (12, '2026-11-03');
                INSERT INTO InboxItems VALUES (5, 'Quick thought', 'Inbox notes', '2026-11-03 12:00:00');
                """);
            var original = Path.Combine(directory, "stage-three.db");
            File.Copy(DatabasePath, original);
            File.Copy(original, DatabasePath, overwrite: true);
        }
        public void Dispose() => Directory.Delete(directory, recursive: true);
    }

    private sealed record Detail(string Name, string? Description, ProjectTask[] Tasks, int[] SelectedTaskIds, ProjectMilestone[] Milestones);
    private static async Task<Detail> Read(HttpClient client, int id) =>
        Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>($"/api/projects/{id}?day=2026-11-03"));
    private static async Task<int> Project(HttpClient client)
    {
        using var response = await client.PostAsJsonAsync("/api/projects", new { name = "Project" });
        response.EnsureSuccessStatusCode();
        return Assert.IsType<Project>(await response.Content.ReadFromJsonAsync<Project>()).Id;
    }
    private static async Task<ProjectMilestone> Milestone(HttpClient client, int projectId, string title = "  First usable version  ")
    {
        using var response = await client.PostAsJsonAsync($"/api/projects/{projectId}/milestones", new { title, description = "An outcome\nwith context", targetDate = "2028-02-29" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var milestone = Assert.IsType<ProjectMilestone>(await response.Content.ReadFromJsonAsync<ProjectMilestone>());
        Assert.Equal($"/api/projects/{projectId}/milestones/{milestone.Id}", response.Headers.Location?.ToString());
        Assert.Equal(title.Trim(), milestone.Title);
        Assert.Equal(projectId, milestone.ProjectId);
        var fetched = await client.GetFromJsonAsync<ProjectMilestone>(response.Headers.Location);
        Assert.Equal(JsonSerializer.Serialize(milestone), JsonSerializer.Serialize(fetched));
        return milestone;
    }
    private static async Task<ProjectTask> Task(HttpClient client, int projectId, int? milestoneId)
    {
        using var response = await client.PostAsJsonAsync($"/api/projects/{projectId}/tasks", new { title = "Work", notes = "Keep notes", priority = "High", dueDate = "2026-11-03", milestoneId });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return Assert.IsType<ProjectTask>(await response.Content.ReadFromJsonAsync<ProjectTask>());
    }
    private static async Task Assign(HttpClient client, ProjectTask task, int? milestoneId)
    {
        using var response = await client.PutAsJsonAsync($"/api/projects/{task.ProjectId}/tasks/{task.Id}", new { task.Title, task.Notes, task.Status, task.Priority, task.DueDate, milestoneId });
        response.EnsureSuccessStatusCode();
    }
    private static async Task Invalid(HttpResponseMessage response, string field)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.NotEmpty(body.RootElement.GetProperty("errors").GetProperty(field)[0].GetString()!);
    }
    private static void Unchanged(ProjectTask before, ProjectTask after, int? milestoneId)
    {
        Assert.Equal(before.Id, after.Id);
        Assert.Equal(before.ProjectId, after.ProjectId);
        Assert.Equal(before.Title, after.Title);
        Assert.Equal(before.Notes, after.Notes);
        Assert.Equal(before.Status, after.Status);
        Assert.Equal(before.Priority, after.Priority);
        Assert.Equal(before.DueDate, after.DueDate);
        Assert.Equal(milestoneId, after.MilestoneId);
    }

    [Theory]
    [InlineData(null, null, "title")]
    [InlineData(" \t\r\n ", null, "title")]
    [InlineData("", null, "title")]
    [InlineData("Valid", "2026-02-29", "targetDate")]
    [InlineData("Valid", "2026-1-03", "targetDate")]
    [InlineData("Valid", "2026-11-03T12:00:00Z", "targetDate")]
    [InlineData("Valid", "0000-01-01", "targetDate")]
    [InlineData("Valid", "", "targetDate")]
    public async Task ValidationRejectsCreateAndEditWithoutWrites(string? title, string? targetDate, string field)
    {
        using var scenario = new Scenario();
        using var app = scenario.Start();
        using var client = app.CreateClient();
        var projectId = await Project(client);
        var milestone = await Milestone(client, projectId);
        using var create = await client.PostAsJsonAsync($"/api/projects/{projectId}/milestones", new { title, targetDate });
        await Invalid(create, field);
        using var edit = await client.PutAsJsonAsync($"/api/projects/{projectId}/milestones/{milestone.Id}", new { title, description = "Rejected", targetDate });
        await Invalid(edit, field);
        var retained = Assert.Single((await Read(client, projectId)).Milestones);
        Assert.Equal(JsonSerializer.Serialize(milestone), JsonSerializer.Serialize(retained));
    }

    [Theory]
    [InlineData("{")]
    [InlineData("null")]
    [InlineData("{}")]
    [InlineData("{\"title\":42}")]
    [InlineData("{\"title\":\"Valid\",\"targetDate\":42}")]
    public async Task MalformedBodiesCannotWrite(string body)
    {
        using var scenario = new Scenario();
        using var app = scenario.Start();
        using var client = app.CreateClient();
        var projectId = await Project(client);
        var milestone = await Milestone(client, projectId);
        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        using var create = await client.PostAsync($"/api/projects/{projectId}/milestones", content);
        using var edit = await client.PutAsync($"/api/projects/{projectId}/milestones/{milestone.Id}", content);
        Assert.Equal(HttpStatusCode.BadRequest, create.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, edit.StatusCode);
        Assert.Equal(milestone.Title, Assert.Single((await Read(client, projectId)).Milestones).Title);
    }

    [Fact]
    public async Task MissingAndCrossProjectMilestonesAndAssignmentsAreRejected()
    {
        using var scenario = new Scenario();
        using var app = scenario.Start();
        using var client = app.CreateClient();
        var first = await Project(client);
        var second = await Project(client);
        var milestone = await Milestone(client, first);
        var task = await Task(client, second, null);
        using var missingProject = await client.PostAsJsonAsync("/api/projects/99999/milestones", new { title = "Missing" });
        Assert.Equal(HttpStatusCode.NotFound, missingProject.StatusCode);
        foreach (var path in new[] { $"/api/projects/{second}/milestones/{milestone.Id}", $"/api/projects/{first}/milestones/99999" })
        {
            using var get = await client.GetAsync(path);
            using var put = await client.PutAsJsonAsync(path, new { title = "Rejected" });
            using var delete = await client.DeleteAsync(path);
            Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, put.StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, delete.StatusCode);
        }
        foreach (var milestoneId in new[] { milestone.Id, 99999, 0, -1 })
        {
            using var create = await client.PostAsJsonAsync($"/api/projects/{second}/tasks", new { title = "Rejected", milestoneId });
            using var edit = await client.PutAsJsonAsync($"/api/projects/{second}/tasks/{task.Id}", new { title = "Rejected", status = "Done", notes = "Rejected", milestoneId });
            await Invalid(create, "milestoneId");
            await Invalid(edit, "milestoneId");
            Unchanged(task, Assert.Single((await Read(client, second)).Tasks), null);
        }
        using var wrongType = await client.PostAsync($"/api/projects/{second}/tasks", new StringContent("{\"title\":\"Rejected\",\"milestoneId\":\"one\"}", Encoding.UTF8, "application/json"));
        Assert.Equal(HttpStatusCode.BadRequest, wrongType.StatusCode);
        Assert.Empty((await Read(client, second)).Milestones);
        Assert.Single((await Read(client, first)).Milestones);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task MembershipProgressInputsAndSafeRemovalSurviveRestartsAndSchemaUpgrade(bool upgrade)
    {
        using var scenario = new Scenario();
        if (upgrade) scenario.CopyStageThreeDatabase();
        int projectId, milestoneId, secondMilestoneId;
        ProjectTask retained;
        using (var app = scenario.Start())
        using (var client = app.CreateClient())
        {
            projectId = upgrade ? 7 : await Project(client);
            var initial = await Read(client, projectId);
            Assert.Empty(initial.Milestones);
            if (upgrade)
            {
                Assert.Equal("Retained project", initial.Name);
                Assert.Equal("Keep description", initial.Description);
                Assert.Equal([12], initial.SelectedTaskIds);
                retained = Assert.Single(initial.Tasks);
                Assert.Null(retained.MilestoneId);
                Assert.Equal("Keep notes", retained.Notes);
                Assert.Equal("High", retained.Priority);
                Assert.Equal("2026-11-03", retained.DueDate);
                Assert.Equal("In progress", retained.Status);
                var inbox = Assert.Single((await client.GetFromJsonAsync<InboxItem[]>("/api/inbox"))!);
                Assert.Equal("Quick thought", inbox.Title);
                Assert.Equal("Inbox notes", inbox.Notes);
            }
            else retained = await Task(client, projectId, null);
            var milestone = await Milestone(client, projectId);
            milestoneId = milestone.Id;
            var second = await Milestone(client, projectId, "Second outcome");
            secondMilestoneId = second.Id;
            Assert.Equal([milestoneId, second.Id], (await Read(client, projectId)).Milestones.Select(item => item.Id));
            await Assign(client, retained, milestoneId);
            using var selection = await client.PutAsJsonAsync($"/api/today/2026-11-03/tasks/{retained.Id}", new { selected = true });
            selection.EnsureSuccessStatusCode();
            using var complete = await client.PutAsJsonAsync($"/api/tasks/{retained.Id}/status", new { status = "Done" });
            complete.EnsureSuccessStatusCode();
            retained.Status = "Done";
            var snapshot = await Read(client, projectId);
            Unchanged(retained, Assert.Single(snapshot.Tasks, task => task.MilestoneId == milestoneId), milestoneId);
            Assert.Single(snapshot.Tasks, task => task.MilestoneId == milestoneId && task.Status == "Done");
            Assert.Equal([retained.Id], snapshot.SelectedTaskIds);
            var extra = await Task(client, projectId, milestoneId);
            snapshot = await Read(client, projectId);
            Assert.Equal(2, snapshot.Tasks.Count(task => task.MilestoneId == milestoneId));
            Assert.Single(snapshot.Tasks, task => task.MilestoneId == milestoneId && task.Status == "Done");
            await Assign(client, extra, second.Id);
            await Assign(client, extra, null);
            Unchanged(extra, (await Read(client, projectId)).Tasks.Single(task => task.Id == extra.Id), null);
            using var reopen = await client.PutAsJsonAsync($"/api/tasks/{retained.Id}/status", new { status = "In progress" });
            reopen.EnsureSuccessStatusCode();
            retained.Status = "In progress";
            Assert.DoesNotContain((await Read(client, projectId)).Tasks, task => task.MilestoneId == milestoneId && task.Status == "Done");
            using var edit = await client.PutAsJsonAsync($"/api/projects/{projectId}/milestones/{milestoneId}", new { title = "  Usable release  ", targetDate = "0001-01-01", description = "Saved description" });
            edit.EnsureSuccessStatusCode();
        }
        using (var app = scenario.Start())
        using (var client = app.CreateClient())
        {
            var snapshot = await Read(client, projectId);
            var milestone = snapshot.Milestones[0];
            Assert.Equal("Usable release", milestone.Title);
            Assert.Equal("Saved description", milestone.Description);
            Assert.Equal("0001-01-01", milestone.TargetDate);
            Unchanged(retained, snapshot.Tasks.Single(task => task.Id == retained.Id), milestoneId);
            Assert.Equal([retained.Id], snapshot.SelectedTaskIds);
            using var clear = await client.PutAsJsonAsync($"/api/projects/{projectId}/milestones/{milestoneId}", new { title = milestone.Title });
            clear.EnsureSuccessStatusCode();
            var cleared = Assert.IsType<ProjectMilestone>(await clear.Content.ReadFromJsonAsync<ProjectMilestone>());
            Assert.Null(cleared.Description);
            Assert.Null(cleared.TargetDate);
            // Fail after foreign-key actions have run: the whole statement must roll back.
            scenario.Sql("CREATE TRIGGER RejectRemoval AFTER DELETE ON Milestones BEGIN SELECT RAISE(ABORT, 'Synthetic removal failure'); END;");
            using var failed = await client.DeleteAsync($"/api/projects/{projectId}/milestones/{milestoneId}");
            Assert.Equal(HttpStatusCode.InternalServerError, failed.StatusCode);
            snapshot = await Read(client, projectId);
            Assert.Equal(2, snapshot.Milestones.Length);
            Unchanged(retained, snapshot.Tasks.Single(task => task.Id == retained.Id), milestoneId);
            scenario.Sql("DROP TRIGGER RejectRemoval");
            using var remove = await client.DeleteAsync($"/api/projects/{projectId}/milestones/{milestoneId}");
            Assert.Equal(HttpStatusCode.OK, remove.StatusCode);
            snapshot = await Read(client, projectId);
            Assert.Equal(secondMilestoneId, Assert.Single(snapshot.Milestones).Id);
            Assert.Equal(2, snapshot.Tasks.Length);
            Unchanged(retained, snapshot.Tasks.Single(task => task.Id == retained.Id), null);
            Assert.Equal([retained.Id], snapshot.SelectedTaskIds);
            using var staleAssignment = await client.PostAsJsonAsync($"/api/projects/{projectId}/tasks", new { title = "Stale", milestoneId });
            await Invalid(staleAssignment, "milestoneId");
        }
        using (var app = scenario.Start())
        using (var client = app.CreateClient())
        {
            var snapshot = await Read(client, projectId);
            Assert.Equal(secondMilestoneId, Assert.Single(snapshot.Milestones).Id);
            Assert.Equal(2, snapshot.Tasks.Length);
            Unchanged(retained, snapshot.Tasks.Single(task => task.Id == retained.Id), null);
            var today = Assert.IsType<TodayPlan>(await client.GetFromJsonAsync<TodayPlan>("/api/today/2026-11-03"));
            Unchanged(retained, Assert.Single(today.Selected).Task, null);
        }
    }
}
