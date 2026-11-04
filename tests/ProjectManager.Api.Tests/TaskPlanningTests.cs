using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace ProjectManager.Api.Tests;

public sealed class TaskPlanningTests
{
    private sealed class Scenario : IDisposable
    {
        private readonly string directory = Path.Combine(Path.GetTempPath(), $"task-planning-{Guid.NewGuid()}");
        private string DatabasePath => Path.Combine(directory, "projects.db");
        public Scenario() => Directory.CreateDirectory(directory);
        public WebApplicationFactory<Program> Start() => new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => builder.ConfigureAppConfiguration((_, config) =>
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:Projects"] = $"Data Source={DatabasePath};Pooling=False"
                })));
        public void CopyStageOneDatabase()
        {
            var original = Path.Combine(directory, "stage-one.db");
            using (var connection = new SqliteConnection($"Data Source={original};Pooling=False"))
            {
                connection.Open();
                using var command = connection.CreateCommand();
                command.CommandText = """
                    CREATE TABLE Projects (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, Name TEXT NOT NULL, Description TEXT NULL);
                    CREATE TABLE Tasks (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ProjectId INTEGER NOT NULL,
                        Title TEXT NOT NULL, Notes TEXT NULL, Status TEXT NOT NULL,
                        CONSTRAINT CK_Tasks_Status CHECK (Status IN ('To do', 'In progress', 'Done')),
                        FOREIGN KEY (ProjectId) REFERENCES Projects (Id) ON DELETE CASCADE);
                    CREATE INDEX IX_Tasks_ProjectId ON Tasks (ProjectId);
                    INSERT INTO Projects VALUES (7, 'Retained project', 'Keep description');
                    INSERT INTO Tasks VALUES (12, 7, 'Retained task', 'Keep notes', 'In progress');
                    INSERT INTO Tasks VALUES (13, 7, 'Finished task', NULL, 'Done');
                    """;
                command.ExecuteNonQuery();
            }
            File.Copy(original, DatabasePath);
        }
        public void Dispose() => Directory.Delete(directory, recursive: true);
    }

    private sealed record Detail(int Id, string Name, string? Description, ProjectTask[] Tasks, int[] SelectedTaskIds);

    private static async Task<int> CreateProject(HttpClient client, string name)
    {
        using var response = await client.PostAsJsonAsync("/api/projects", new { name });
        response.EnsureSuccessStatusCode();
        return Assert.IsType<Project>(await response.Content.ReadFromJsonAsync<Project>()).Id;
    }

    private static async Task<ProjectTask> CreateTask(HttpClient client, int projectId, string title, string priority = "None", string? dueDate = null)
    {
        using var response = await client.PostAsJsonAsync($"/api/projects/{projectId}/tasks", new { title, priority, dueDate });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return Assert.IsType<ProjectTask>(await response.Content.ReadFromJsonAsync<ProjectTask>());
    }

    private static async Task Select(HttpClient client, int taskId, string day, bool selected = true)
    {
        using var response = await client.PutAsJsonAsync($"/api/today/{day}/tasks/{taskId}", new { selected });
        response.EnsureSuccessStatusCode();
    }

    private static async Task Status(HttpClient client, int taskId, string status)
    {
        using var response = await client.PutAsJsonAsync($"/api/tasks/{taskId}/status", new { status });
        response.EnsureSuccessStatusCode();
    }

    private static async Task<TodayPlan> Plan(HttpClient client, string day) =>
        Assert.IsType<TodayPlan>(await client.GetFromJsonAsync<TodayPlan>($"/api/today/{day}"));

    [Fact]
    public async Task UpgradePreservesStageOneRowsAndPlanningSurvivesRepeatedRestarts()
    {
        using var scenario = new Scenario();
        scenario.CopyStageOneDatabase();
        using (var app = scenario.Start())
        using (var client = app.CreateClient())
        {
            var detail = Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>("/api/projects/7?day=2028-02-29"));
            Assert.Equal("Retained project", detail.Name);
            Assert.Equal("Keep description", detail.Description);
            Assert.Equal(2, detail.Tasks.Length);
            Assert.All(detail.Tasks, task => { Assert.Equal("None", task.Priority); Assert.Null(task.DueDate); });
            Assert.Equal("Keep notes", detail.Tasks[0].Notes);
            Assert.Equal("In progress", detail.Tasks[0].Status);
            Assert.Single(detail.Tasks, task => task.Status == "Done");
            using var edit = await client.PutAsJsonAsync("/api/projects/7/tasks/12", new { title = "Retained task", notes = "Keep notes", status = "In progress", priority = "High", dueDate = "2028-02-29" });
            edit.EnsureSuccessStatusCode();
            await Select(client, 12, "2028-02-29");
            var added = await CreateTask(client, 7, "New after upgrade");
            Assert.True(added.Id > 13);
        }
        for (var restart = 0; restart < 2; restart++)
        {
            using var app = scenario.Start();
            using var client = app.CreateClient();
            var detail = Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>("/api/projects/7?day=2028-02-29"));
            Assert.Equal([12], detail.SelectedTaskIds);
            var selected = Assert.Single((await Plan(client, "2028-02-29")).Selected);
            Assert.Equal("High", selected.Task.Priority);
            Assert.Equal("2028-02-29", selected.Task.DueDate);
            Assert.Equal("Retained project", selected.ProjectName);
            Assert.Equal("Keep notes", selected.Task.Notes);
        }
    }

    [Fact]
    public async Task AllPrioritiesOptionalDatesAndClearingArePersisted()
    {
        using var scenario = new Scenario();
        using var app = scenario.Start();
        using var client = app.CreateClient();
        var projectId = await CreateProject(client, "Project");
        using var defaultResponse = await client.PostAsJsonAsync($"/api/projects/{projectId}/tasks", new { title = "Default" });
        var defaultTask = Assert.IsType<ProjectTask>(await defaultResponse.Content.ReadFromJsonAsync<ProjectTask>());
        Assert.Equal("None", defaultTask.Priority);
        Assert.Null(defaultTask.DueDate);
        foreach (var priority in new[] { "Low", "Medium", "High", "None" })
        {
            var task = await CreateTask(client, projectId, "Task", priority, "2028-02-29");
            Assert.Equal(priority, task.Priority);
            Assert.Equal("2028-02-29", task.DueDate);
            using var edit = await client.PutAsJsonAsync($"/api/projects/{projectId}/tasks/{defaultTask.Id}", new { title = "Default", status = "To do", priority, dueDate = "9999-12-31" });
            edit.EnsureSuccessStatusCode();
            Assert.Equal(priority, (await edit.Content.ReadFromJsonAsync<ProjectTask>())?.Priority);
        }
        using var clear = await client.PutAsJsonAsync($"/api/projects/{projectId}/tasks/{defaultTask.Id}", new { title = "Default", status = "To do", priority = "None", dueDate = (string?)null });
        clear.EnsureSuccessStatusCode();
        var saved = Assert.IsType<ProjectTask>(await client.GetFromJsonAsync<ProjectTask>($"/api/projects/{projectId}/tasks/{defaultTask.Id}"));
        Assert.Null(saved.DueDate);
        Assert.Equal("None", saved.Priority);
    }

    [Theory]
    [InlineData("urgent", "2028-02-29", "priority")]
    [InlineData("high", null, "priority")]
    [InlineData("", null, "priority")]
    [InlineData(null, null, "priority")]
    [InlineData("None", "2027-02-29", "dueDate")]
    [InlineData("None", "2028-04-31", "dueDate")]
    [InlineData("None", "2028-13-01", "dueDate")]
    [InlineData("None", "0000-01-01", "dueDate")]
    [InlineData("None", "2028-2-09", "dueDate")]
    [InlineData("None", "2028-02-29T00:00:00Z", "dueDate")]
    [InlineData("None", " 2028-02-29", "dueDate")]
    [InlineData("None", "", "dueDate")]
    public async Task InvalidPlanningInputRejectsCreateAndWholeEditWithoutWrites(string? priority, string? dueDate, string field)
    {
        using var scenario = new Scenario();
        using var app = scenario.Start();
        using var client = app.CreateClient();
        var id = await CreateProject(client, "Project");
        var task = await CreateTask(client, id, "Keep", "High", "2028-02-29");
        var input = new { title = "Rejected", notes = "Rejected", status = "Done", priority, dueDate };
        using var create = await client.PostAsJsonAsync($"/api/projects/{id}/tasks", input);
        using var edit = await client.PutAsJsonAsync($"/api/projects/{id}/tasks/{task.Id}", input);
        foreach (var response in new[] { create, edit })
        {
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
            using var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            Assert.True(problem.RootElement.GetProperty("errors").TryGetProperty(field, out _));
        }
        var detail = Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>($"/api/projects/{id}"));
        var saved = Assert.Single(detail.Tasks);
        Assert.Equal("Keep", saved.Title);
        Assert.Equal("To do", saved.Status);
        Assert.Null(saved.Notes);
        Assert.Equal("High", saved.Priority);
        Assert.Equal("2028-02-29", saved.DueDate);
    }

    [Fact]
    public async Task DailyCrossProjectSelectionOrderingCompletionAndRemovalAreIndependentOfTaskFields()
    {
        using var scenario = new Scenario();
        int firstId, secondId;
        using (var app = scenario.Start())
        using (var client = app.CreateClient())
        {
            var empty = await Plan(client, "2026-12-31");
            Assert.Empty(empty.Selected); Assert.Empty(empty.Due); Assert.Empty(empty.Completed);
            var firstProject = await CreateProject(client, "First");
            var secondProject = await CreateProject(client, "Second");
            var overdue = await CreateTask(client, firstProject, "Overdue", "Low", "2026-12-30");
            var due = await CreateTask(client, secondProject, "Due", "High", "2026-12-31");
            firstId = overdue.Id; secondId = due.Id;
            var future = await CreateTask(client, firstProject, "Future", "Medium", "2027-01-01");
            var undated = await CreateTask(client, secondProject, "Undated");
            var tie = await CreateTask(client, firstProject, "Tie", "High", "2026-12-31");
            await Status(client, tie.Id, "Done");
            Assert.Equal([overdue.Id, due.Id], (await Plan(client, "2026-12-31")).Due.Select(item => item.Task.Id));
            foreach (var task in new[] { overdue, due, future, undated }) await Select(client, task.Id, "2026-12-31");
            await Select(client, due.Id, "2026-12-31");
            var plan = await Plan(client, "2026-12-31");
            Assert.Equal([due.Id, future.Id, overdue.Id, undated.Id], plan.Selected.Select(item => item.Task.Id));
            Assert.Empty(plan.Due);
            Assert.Equal("Second", plan.Selected[0].ProjectName);
            await Status(client, due.Id, "Done");
            plan = await Plan(client, "2026-12-31");
            Assert.Equal(due.Id, Assert.Single(plan.Completed).Task.Id);
            Assert.DoesNotContain(plan.Selected, item => item.Task.Id == due.Id);
            await Status(client, due.Id, "In progress");
            Assert.Empty((await Plan(client, "2026-12-31")).Completed);
            await Select(client, overdue.Id, "2026-12-31", false);
            await Select(client, overdue.Id, "2026-12-31", false);
            Assert.Equal(overdue.Id, Assert.Single((await Plan(client, "2026-12-31")).Due).Task.Id);
            var saved = Assert.IsType<ProjectTask>(await client.GetFromJsonAsync<ProjectTask>($"/api/projects/{secondProject}/tasks/{due.Id}"));
            Assert.Equal("High", saved.Priority); Assert.Equal("2026-12-31", saved.DueDate); Assert.Equal("Due", saved.Title);
            var tomorrow = await Plan(client, "2027-01-01");
            Assert.Empty(tomorrow.Selected); Assert.Empty(tomorrow.Completed);
            Assert.Equal([overdue.Id, due.Id, future.Id], tomorrow.Due.Select(item => item.Task.Id));
            await Select(client, overdue.Id, "2027-01-01");
        }
        using (var app = scenario.Start())
        using (var client = app.CreateClient())
        {
            Assert.Equal(firstId, Assert.Single((await Plan(client, "2027-01-01")).Selected).Task.Id);
            Assert.Contains((await Plan(client, "2026-12-31")).Selected, item => item.Task.Id == secondId);
        }
    }

    [Fact]
    public async Task BoardStatusTransitionsPreserveAllFieldsAndSelectionsAcrossRestartsAndRejectedWrites()
    {
        using var scenario = new Scenario();
        int projectId, taskId;
        const string day = "2028-02-29";
        using (var app = scenario.Start())
        using (var client = app.CreateClient())
        {
            projectId = await CreateProject(client, "Board");
            using var create = await client.PostAsJsonAsync($"/api/projects/{projectId}/tasks",
                new { title = "Keep title", notes = "Keep notes\nSecond line", priority = "High", dueDate = day });
            create.EnsureSuccessStatusCode();
            taskId = Assert.IsType<ProjectTask>(await create.Content.ReadFromJsonAsync<ProjectTask>()).Id;
            await Select(client, taskId, day);
        }
        // Every directed transition, including both ways of reopening Done, crosses a real restart.
        foreach (var status in new[] { "In progress", "To do", "Done", "In progress", "Done", "To do" })
        {
            using (var app = scenario.Start())
            using (var client = app.CreateClient())
            {
                using var move = await client.PutAsJsonAsync($"/api/tasks/{taskId}/status", new { status });
                Assert.Equal(HttpStatusCode.OK, move.StatusCode);
                Assert.Equal(status, (await move.Content.ReadFromJsonAsync<ProjectTask>())?.Status);
                foreach (var body in new[] { "{\"status\":\"invalid\"}", "{\"status\":null}", "{\"status\":42}", "{}", "{" })
                {
                    using var content = new StringContent(body, Encoding.UTF8, "application/json");
                    using var rejected = await client.PutAsync($"/api/tasks/{taskId}/status", content);
                    Assert.Equal(HttpStatusCode.BadRequest, rejected.StatusCode);
                }
            }
            using (var app = scenario.Start())
            using (var client = app.CreateClient())
            {
                var detail = Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>($"/api/projects/{projectId}?day={day}"));
                var saved = Assert.Single(detail.Tasks);
                Assert.Equal(taskId, saved.Id);
                Assert.Equal(projectId, saved.ProjectId);
                Assert.Equal("Keep title", saved.Title);
                Assert.Equal("Keep notes\nSecond line", saved.Notes);
                Assert.Equal("High", saved.Priority);
                Assert.Equal(day, saved.DueDate);
                Assert.Equal(status, saved.Status);
                Assert.Equal([taskId], detail.SelectedTaskIds);
                var plan = await Plan(client, day);
                Assert.Empty(plan.Due);
                Assert.Equal(status, Assert.Single(status == "Done" ? plan.Completed : plan.Selected).Task.Status);
                Assert.Empty(status == "Done" ? plan.Selected : plan.Completed);
            }
        }
    }

    [Theory]
    [InlineData("2026-02-29")]
    [InlineData("2026-11-03T00:00:00Z")]
    [InlineData("invalid")]
    public async Task InvalidDaysRejectReadsAndSelections(string day)
    {
        using var scenario = new Scenario();
        using var app = scenario.Start();
        using var client = app.CreateClient();
        var id = await CreateProject(client, "Project");
        var task = await CreateTask(client, id, "Task");
        using var get = await client.GetAsync($"/api/today/{day}");
        using var put = await client.PutAsJsonAsync($"/api/today/{day}/tasks/{task.Id}", new { selected = true });
        using var project = await client.GetAsync($"/api/projects/{id}?day={day}");
        Assert.Equal(HttpStatusCode.BadRequest, get.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, put.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, project.StatusCode);
        Assert.Empty((await Plan(client, "2026-11-03")).Selected);
    }

    [Fact]
    public async Task MissingTasksCompletedTasksAndMalformedEditsCannotChangeThePlan()
    {
        using var scenario = new Scenario();
        using var app = scenario.Start();
        using var client = app.CreateClient();
        var id = await CreateProject(client, "Project");
        var task = await CreateTask(client, id, "Task");
        using var missing = await client.PutAsJsonAsync("/api/today/2026-11-03/tasks/99999", new { selected = true });
        using var missingStatus = await client.PutAsJsonAsync("/api/tasks/99999/status", new { status = "Done" });
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, missingStatus.StatusCode);
        using var invalid = await client.PutAsJsonAsync($"/api/tasks/{task.Id}/status", new { status = "done" });
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        foreach (var body in new[] { "{\"priority\":42}", "{\"dueDate\":42}" })
        {
            using var content = new StringContent(body, Encoding.UTF8, "application/json");
            using var response = await client.PostAsync($"/api/projects/{id}/tasks", content);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
        await Status(client, task.Id, "Done");
        using var done = await client.PutAsJsonAsync($"/api/today/2026-11-03/tasks/{task.Id}", new { selected = true });
        Assert.Equal(HttpStatusCode.BadRequest, done.StatusCode);
        Assert.Empty((await Plan(client, "2026-11-03")).Selected);
        await Status(client, task.Id, "To do");
        await Select(client, task.Id, "2026-11-03");
        foreach (var body in new[] { "{}", "{\"selected\":null}", "{\"selected\":\"yes\"}", "null", "{" })
        {
            using var content = new StringContent(body, Encoding.UTF8, "application/json");
            using var malformed = await client.PutAsync($"/api/today/2026-11-03/tasks/{task.Id}", content);
            Assert.Equal(HttpStatusCode.BadRequest, malformed.StatusCode);
            Assert.Single((await Plan(client, "2026-11-03")).Selected);
        }
        await Status(client, task.Id, "Done");
        await Select(client, task.Id, "2026-11-03");
        Assert.Single((await Plan(client, "2026-11-03")).Completed);
        await Select(client, task.Id, "2026-11-03", false);
        Assert.Empty((await Plan(client, "2026-11-03")).Completed);
    }
}
