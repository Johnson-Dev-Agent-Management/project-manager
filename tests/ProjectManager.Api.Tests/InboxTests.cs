using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace ProjectManager.Api.Tests;

public sealed class InboxTests
{
    private sealed class Scenario : IDisposable
    {
        private readonly string directory = Path.Combine(Path.GetTempPath(), $"inbox-{Guid.NewGuid()}");
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
        public void CopyStageTwoDatabase()
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
                INSERT INTO Projects VALUES (7, 'Retained project', 'Keep description');
                INSERT INTO Tasks VALUES (12, 7, 'Retained task', 'Keep notes', 'In progress', 'High', '2026-11-03');
                INSERT INTO TodaySelections VALUES (12, '2026-11-03');
                """);
            var original = Path.Combine(directory, "stage-two.db");
            File.Copy(DatabasePath, original);
            File.Copy(original, DatabasePath, overwrite: true);
        }
        public void Dispose() => Directory.Delete(directory, recursive: true);
    }

    private sealed record Detail(string Name, string? Description, ProjectTask[] Tasks, int[] SelectedTaskIds);
    private static async Task<InboxItem> Capture(HttpClient client, string title = "  A thought  ")
    {
        using var response = await client.PostAsJsonAsync("/api/inbox", new { title });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var item = Assert.IsType<InboxItem>(await response.Content.ReadFromJsonAsync<InboxItem>());
        Assert.Equal($"/api/inbox/{item.Id}", response.Headers.Location?.ToString());
        return item;
    }
    private static async Task<int> Project(HttpClient client)
    {
        using var response = await client.PostAsJsonAsync("/api/projects", new { name = "Destination" });
        response.EnsureSuccessStatusCode();
        return Assert.IsType<Project>(await response.Content.ReadFromJsonAsync<Project>()).Id;
    }
    private static async Task<InboxItem[]> Items(HttpClient client) =>
        Assert.IsType<InboxItem[]>(await client.GetFromJsonAsync<InboxItem[]>("/api/inbox"));

    [Fact]
    public async Task CaptureEditAndDiscardPersistAcrossRestartsWithDeterministicOrdering()
    {
        using var scenario = new Scenario();
        int retainedId;
        DateTime capturedAt;
        using (var app = scenario.Start())
        using (var client = app.CreateClient())
        {
            Assert.Empty(await Items(client));
            var first = await Capture(client);
            Assert.Equal("A thought", first.Title);
            Assert.Null(first.Notes);
            Assert.Equal(DateTimeKind.Utc, first.CapturedAt.Kind);
            Assert.InRange(first.CapturedAt, DateTime.UtcNow.AddMinutes(-1), DateTime.UtcNow);
            var second = await Capture(client, "Second");
            retainedId = second.Id;
            capturedAt = second.CapturedAt;
            Assert.Equal([second.Id, first.Id], (await Items(client)).Select(item => item.Id));
            using var edit = await client.PutAsJsonAsync($"/api/inbox/{second.Id}", new { title = "  Edited  ", notes = "Line one\nLine two" });
            edit.EnsureSuccessStatusCode();
            var saved = Assert.IsType<InboxItem>(await edit.Content.ReadFromJsonAsync<InboxItem>());
            Assert.Equal("Edited", saved.Title);
            Assert.Equal(capturedAt, saved.CapturedAt);
            using var discard = await client.DeleteAsync($"/api/inbox/{first.Id}");
            Assert.Equal(HttpStatusCode.OK, discard.StatusCode);
            using var missing = await client.GetAsync($"/api/inbox/{first.Id}");
            Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
        }
        using (var app = scenario.Start())
        using (var client = app.CreateClient())
        {
            var saved = Assert.Single(await Items(client));
            Assert.Equal(retainedId, saved.Id);
            Assert.Equal("Edited", saved.Title);
            Assert.Equal("Line one\nLine two", saved.Notes);
            Assert.Equal(capturedAt, saved.CapturedAt);
            var third = await Capture(client, "Third");
            scenario.Sql("UPDATE InboxItems SET CapturedAt = '2026-11-03 12:00:00'");
            Assert.Equal([third.Id, saved.Id], (await Items(client)).Select(item => item.Id));
            using var clear = await client.PutAsJsonAsync($"/api/inbox/{saved.Id}", new { title = saved.Title, notes = (string?)null });
            Assert.Null((await clear.Content.ReadFromJsonAsync<InboxItem>())?.Notes);
        }
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" \t\n ")]
    public async Task BlankCaptureAndEditReturnUsefulValidationWithoutWrites(string? title)
    {
        using var scenario = new Scenario();
        using var app = scenario.Start();
        using var client = app.CreateClient();
        var item = await Capture(client);
        using var capture = await client.PostAsJsonAsync("/api/inbox", new { title });
        using var edit = await client.PutAsJsonAsync($"/api/inbox/{item.Id}", new { title, notes = "Must not save" });
        foreach (var response in new[] { capture, edit })
        {
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
            using var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            Assert.Equal("Item title is required.", problem.RootElement.GetProperty("errors").GetProperty("title")[0].GetString());
        }
        var saved = Assert.Single(await Items(client));
        Assert.Equal(item.Title, saved.Title);
        Assert.Null(saved.Notes);
    }

    [Theory]
    [InlineData("{}")]
    [InlineData("null")]
    [InlineData("{")]
    [InlineData("{\"title\":42}")]
    public async Task MalformedCaptureAndEditCannotWrite(string body)
    {
        using var scenario = new Scenario();
        using var app = scenario.Start();
        using var client = app.CreateClient();
        var item = await Capture(client);
        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        using var capture = await client.PostAsync("/api/inbox", content);
        using var edit = await client.PutAsync($"/api/inbox/{item.Id}", content);
        Assert.Equal(HttpStatusCode.BadRequest, capture.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, edit.StatusCode);
        Assert.Equal(item.Title, Assert.Single(await Items(client)).Title);
    }

    [Theory]
    [InlineData("{}")]
    [InlineData("{\"projectId\":null}")]
    [InlineData("{\"projectId\":0}")]
    [InlineData("{\"projectId\":-1}")]
    [InlineData("{\"projectId\":999999}")]
    [InlineData("{\"projectId\":\"wrong\"}")]
    [InlineData("null")]
    [InlineData("{")]
    public async Task InvalidDestinationsLeaveInboxIntactAndCreateNoTasks(string body)
    {
        using var scenario = new Scenario();
        using var app = scenario.Start();
        using var client = app.CreateClient();
        var projectId = await Project(client);
        var item = await Capture(client);
        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        using var move = await client.PostAsync($"/api/inbox/{item.Id}/move", content);
        Assert.Equal(HttpStatusCode.BadRequest, move.StatusCode);
        if (body is "{}" or "{\"projectId\":999999}")
        {
            using var problem = JsonDocument.Parse(await move.Content.ReadAsStringAsync());
            Assert.False(string.IsNullOrWhiteSpace(problem.RootElement.GetProperty("errors").GetProperty("projectId")[0].GetString()));
        }
        Assert.Equal(item.Id, Assert.Single(await Items(client)).Id);
        Assert.Empty(Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>($"/api/projects/{projectId}")).Tasks);
    }

    [Fact]
    public async Task ConcurrentAndRepeatedMovesCreateExactlyOneTaskAndMissingItemsCannotBeChanged()
    {
        using var scenario = new Scenario();
        using var app = scenario.Start();
        using var client = app.CreateClient();
        var projectId = await Project(client);
        var secondProject = await Project(client);
        var item = await Capture(client);
        var responses = await Task.WhenAll(
            client.PostAsJsonAsync($"/api/inbox/{item.Id}/move", new { projectId }),
            client.PostAsJsonAsync($"/api/inbox/{item.Id}/move", new { projectId = secondProject }));
        try
        {
            Assert.Single(responses, response => response.StatusCode == HttpStatusCode.Created);
            Assert.Single(responses, response => response.StatusCode == HttpStatusCode.NotFound);
        }
        finally { foreach (var response in responses) response.Dispose(); }
        using var retry = await client.PostAsJsonAsync($"/api/inbox/{item.Id}/move", new { projectId });
        using var edit = await client.PutAsJsonAsync($"/api/inbox/{item.Id}", new { title = "Gone" });
        using var discard = await client.DeleteAsync($"/api/inbox/{item.Id}");
        Assert.Equal(HttpStatusCode.NotFound, retry.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, edit.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, discard.StatusCode);
        Assert.Empty(await Items(client));
        var first = Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>($"/api/projects/{projectId}"));
        var second = Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>($"/api/projects/{secondProject}"));
        Assert.Single(first.Tasks.Concat(second.Tasks));
    }

    [Fact]
    public async Task FailedTaskInsertRollsBackMoveAndAllowsRetry()
    {
        using var scenario = new Scenario();
        using var app = scenario.Start();
        using var client = app.CreateClient();
        var projectId = await Project(client);
        var item = await Capture(client);
        scenario.Sql("CREATE TRIGGER RejectTask BEFORE INSERT ON Tasks BEGIN SELECT RAISE(ABORT, 'Synthetic write failure'); END;");
        using var failed = await client.PostAsJsonAsync($"/api/inbox/{item.Id}/move", new { projectId });
        Assert.Equal(HttpStatusCode.InternalServerError, failed.StatusCode);
        Assert.Equal(item.Title, Assert.Single(await Items(client)).Title);
        Assert.Empty(Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>($"/api/projects/{projectId}")).Tasks);
        scenario.Sql("DROP TRIGGER RejectTask");
        using var retry = await client.PostAsJsonAsync($"/api/inbox/{item.Id}/move", new { projectId });
        Assert.Equal(HttpStatusCode.Created, retry.StatusCode);
        Assert.Empty(await Items(client));
    }

    [Fact]
    public async Task StageTwoUpgradeRetainsPlanningAndFiledContentSupportsAllTaskFeaturesAcrossRestarts()
    {
        using var scenario = new Scenario();
        scenario.CopyStageTwoDatabase();
        int taskId;
        using (var app = scenario.Start())
        using (var client = app.CreateClient())
        {
            var detail = Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>("/api/projects/7?day=2026-11-03"));
            Assert.Equal("Retained project", detail.Name);
            Assert.Equal("Keep description", detail.Description);
            Assert.Equal([12], detail.SelectedTaskIds);
            var retained = Assert.Single(detail.Tasks);
            Assert.Equal("Keep notes", retained.Notes);
            Assert.Equal("High", retained.Priority);
            Assert.Equal("In progress", retained.Status);
            Assert.Equal("2026-11-03", retained.DueDate);
            var item = await Capture(client);
            using var edit = await client.PutAsJsonAsync($"/api/inbox/{item.Id}", new { title = "  Filed idea  ", notes = "Preserve\nall notes" });
            edit.EnsureSuccessStatusCode();
            var before = Assert.IsType<TodayPlan>(await client.GetFromJsonAsync<TodayPlan>("/api/today/2026-11-03"));
            Assert.Single(before.Selected);
            Assert.Empty(before.Due);
            using var move = await client.PostAsJsonAsync($"/api/inbox/{item.Id}/move", new { projectId = 7 });
            Assert.Equal(HttpStatusCode.Created, move.StatusCode);
            var task = Assert.IsType<ProjectTask>(await move.Content.ReadFromJsonAsync<ProjectTask>());
            taskId = task.Id;
            Assert.True(taskId > 12);
            Assert.Equal($"/api/projects/7/tasks/{taskId}", move.Headers.Location?.ToString());
            Assert.Equal("Filed idea", task.Title);
            Assert.Equal("Preserve\nall notes", task.Notes);
            Assert.Equal("To do", task.Status);
            Assert.Equal("None", task.Priority);
            Assert.Null(task.DueDate);
            using var planEdit = await client.PutAsJsonAsync($"/api/projects/7/tasks/{taskId}", new { task.Title, task.Notes, status = "In progress", priority = "Medium", dueDate = "2026-11-03" });
            planEdit.EnsureSuccessStatusCode();
            using var select = await client.PutAsJsonAsync($"/api/today/2026-11-03/tasks/{taskId}", new { selected = true });
            select.EnsureSuccessStatusCode();
            using var complete = await client.PutAsJsonAsync($"/api/tasks/{taskId}/status", new { status = "Done" });
            complete.EnsureSuccessStatusCode();
        }
        for (var restart = 0; restart < 2; restart++)
        {
            using var app = scenario.Start();
            using var client = app.CreateClient();
            Assert.Empty(await Items(client));
            var detail = Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>("/api/projects/7?day=2026-11-03"));
            Assert.Equal(2, detail.Tasks.Length);
            var task = Assert.Single(detail.Tasks, task => task.Status == "Done");
            Assert.Equal(taskId, task.Id);
            Assert.Equal("Filed idea", task.Title);
            Assert.Equal("Preserve\nall notes", task.Notes);
            Assert.Equal("Medium", task.Priority);
            Assert.Equal("2026-11-03", task.DueDate);
            var plan = Assert.IsType<TodayPlan>(await client.GetFromJsonAsync<TodayPlan>("/api/today/2026-11-03"));
            Assert.Equal(taskId, Assert.Single(plan.Completed).Task.Id);
        }
    }
}
