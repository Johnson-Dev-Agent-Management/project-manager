using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace ProjectManager.Api.Tests;

public sealed class ProjectTasksTests
{
    private sealed class Scenario : IDisposable
    {
        private readonly string directory = Path.Combine(Path.GetTempPath(), $"project-tasks-{Guid.NewGuid()}");
        public Scenario() => Directory.CreateDirectory(directory);
        public WebApplicationFactory<Program> Start() => new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => builder.ConfigureAppConfiguration((_, config) =>
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:Projects"] = $"Data Source={Path.Combine(directory, "projects.db")};Pooling=False"
                })));
        public void Dispose() => Directory.Delete(directory, recursive: true);
    }

    private sealed record Detail(int Id, string Name, string? Description, ProjectTask[] Tasks);

    private static async Task<Project> CreateProject(HttpClient client, string name)
    {
        using var response = await client.PostAsJsonAsync("/api/projects", new { name });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return Assert.IsType<Project>(await response.Content.ReadFromJsonAsync<Project>());
    }

    private static async Task AssertValidation(HttpResponseMessage response, string field, string message)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        using var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(400, body.RootElement.GetProperty("status").GetInt32());
        Assert.Equal(message, body.RootElement.GetProperty("errors").GetProperty(field)[0].GetString());
    }

    [Fact]
    public async Task ProjectEditsTasksAndStatusesSurviveRestartWithProjectIsolation()
    {
        using var scenario = new Scenario();
        int projectId, otherId, taskId;
        using (var app = scenario.Start())
        using (var client = app.CreateClient())
        {
            projectId = (await CreateProject(client, "Original")).Id;
            otherId = (await CreateProject(client, "Other")).Id;
            var empty = Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>($"/api/projects/{projectId}"));
            Assert.Empty(empty.Tasks);
            Assert.Null(empty.Description);
            using var edit = await client.PutAsJsonAsync($"/api/projects/{projectId}", new { name = "  Renamed  ", description = "First line\nSecond line" });
            Assert.Equal(HttpStatusCode.OK, edit.StatusCode);
            Assert.Equal("Renamed", (await edit.Content.ReadFromJsonAsync<Project>())?.Name);
            using var created = await client.PostAsJsonAsync($"/api/projects/{projectId}/tasks", new { title = " \tFirst task\n ", notes = "Remember this\nAnd this" });
            Assert.Equal(HttpStatusCode.Created, created.StatusCode);
            Assert.Equal("application/json", created.Content.Headers.ContentType?.MediaType);
            var task = Assert.IsType<ProjectTask>(await created.Content.ReadFromJsonAsync<ProjectTask>());
            taskId = task.Id;
            Assert.Equal(projectId, task.ProjectId);
            Assert.Equal("First task", task.Title);
            Assert.Equal("To do", task.Status);
            Assert.Equal($"/api/projects/{projectId}/tasks/{taskId}", created.Headers.Location?.OriginalString);
            Assert.Equal("Remember this\nAnd this", (await client.GetFromJsonAsync<ProjectTask>(created.Headers.Location))?.Notes);
            using var second = await client.PostAsJsonAsync($"/api/projects/{projectId}/tasks", new { title = "Second task" });
            var secondTask = Assert.IsType<ProjectTask>(await second.Content.ReadFromJsonAsync<ProjectTask>());
            Assert.Null(secondTask.Notes);
            // Every ordered pair of statuses is allowed, including reopening Done tasks.
            foreach (var from in new[] { "To do", "In progress", "Done" })
            {
                foreach (var to in new[] { "To do", "In progress", "Done" })
                {
                    using var start = await client.PutAsJsonAsync($"/api/projects/{projectId}/tasks/{taskId}", new { title = "Edited", notes = "Saved notes", status = from });
                    start.EnsureSuccessStatusCode();
                    using var finish = await client.PutAsJsonAsync($"/api/projects/{projectId}/tasks/{taskId}", new { title = "  Edited  ", notes = "Saved notes", status = to });
                    Assert.Equal(HttpStatusCode.OK, finish.StatusCode);
                    var saved = Assert.IsType<ProjectTask>(await finish.Content.ReadFromJsonAsync<ProjectTask>());
                    Assert.Equal(to, saved.Status);
                    Assert.Equal("Edited", saved.Title);
                }
            }
            var detail = Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>($"/api/projects/{projectId}"));
            Assert.Equal([taskId, secondTask.Id], detail.Tasks.Select(item => item.Id));
            Assert.Single(detail.Tasks, item => item.Status == "Done");
            Assert.Empty(Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>($"/api/projects/{otherId}")).Tasks);
        }
        using (var app = scenario.Start())
        using (var client = app.CreateClient())
        {
            var detail = Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>($"/api/projects/{projectId}"));
            Assert.Equal("Renamed", detail.Name);
            Assert.Equal("First line\nSecond line", detail.Description);
            Assert.Equal(2, detail.Tasks.Length);
            var task = detail.Tasks[0];
            Assert.Equal(taskId, task.Id);
            Assert.Equal(projectId, task.ProjectId);
            Assert.Equal("Edited", task.Title);
            Assert.Equal("Saved notes", task.Notes);
            Assert.Equal("Done", task.Status);
            Assert.Empty(Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>($"/api/projects/{otherId}")).Tasks);
            using var clearProject = await client.PutAsJsonAsync($"/api/projects/{projectId}", new { name = "Renamed", description = (string?)null });
            clearProject.EnsureSuccessStatusCode();
            using var clearTask = await client.PutAsJsonAsync($"/api/projects/{projectId}/tasks/{taskId}", new { title = "Edited", notes = (string?)null, status = "To do" });
            clearTask.EnsureSuccessStatusCode();
            var cleared = Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>($"/api/projects/{projectId}"));
            Assert.Null(cleared.Description);
            Assert.Null(cleared.Tasks[0].Notes);
            Assert.DoesNotContain(cleared.Tasks, item => item.Status == "Done");
        }
    }

    [Theory]
    [InlineData("")]
    [InlineData(" \t\r\n ")]
    [InlineData(null)]
    public async Task BlankProjectAndTaskEditsAreRejectedWithoutChangingSavedData(string? blank)
    {
        using var scenario = new Scenario();
        using var app = scenario.Start();
        using var client = app.CreateClient();
        var id = (await CreateProject(client, "Original")).Id;
        using var created = await client.PostAsJsonAsync($"/api/projects/{id}/tasks", new { title = "Keep", notes = "Keep notes" });
        var task = Assert.IsType<ProjectTask>(await created.Content.ReadFromJsonAsync<ProjectTask>());
        using var projectEdit = await client.PutAsJsonAsync($"/api/projects/{id}", new { name = blank, description = "Rejected" });
        await AssertValidation(projectEdit, "name", "Project name is required.");
        using var taskCreate = await client.PostAsJsonAsync($"/api/projects/{id}/tasks", new { title = blank });
        await AssertValidation(taskCreate, "title", "Task title is required.");
        using var taskEdit = await client.PutAsJsonAsync($"/api/projects/{id}/tasks/{task.Id}", new { title = blank, notes = "Rejected", status = "Done" });
        await AssertValidation(taskEdit, "title", "Task title is required.");
        var detail = Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>($"/api/projects/{id}"));
        Assert.Equal("Original", detail.Name);
        Assert.Null(detail.Description);
        var unchanged = Assert.Single(detail.Tasks);
        Assert.Equal("Keep", unchanged.Title);
        Assert.Equal("Keep notes", unchanged.Notes);
        Assert.Equal("To do", unchanged.Status);
    }

    [Theory]
    [InlineData("done")]
    [InlineData("Blocked")]
    [InlineData("")]
    [InlineData(null)]
    public async Task InvalidStatusCannotWriteOtherTaskFields(string? status)
    {
        using var scenario = new Scenario();
        using var app = scenario.Start();
        using var client = app.CreateClient();
        var id = (await CreateProject(client, "Project")).Id;
        using var created = await client.PostAsJsonAsync($"/api/projects/{id}/tasks", new { title = "Keep" });
        var task = Assert.IsType<ProjectTask>(await created.Content.ReadFromJsonAsync<ProjectTask>());
        using var response = await client.PutAsJsonAsync($"/api/projects/{id}/tasks/{task.Id}", new { title = "Rejected", notes = "Rejected", status });
        await AssertValidation(response, "status", "Choose To do, In progress, or Done.");
        var saved = Assert.IsType<ProjectTask>(await client.GetFromJsonAsync<ProjectTask>(created.Headers.Location));
        Assert.Equal("Keep", saved.Title);
        Assert.Null(saved.Notes);
        Assert.Equal("To do", saved.Status);
    }

    [Fact]
    public async Task MissingAndCrossProjectResourcesReturnNotFoundWithoutWriting()
    {
        using var scenario = new Scenario();
        using var app = scenario.Start();
        using var client = app.CreateClient();
        var first = (await CreateProject(client, "First")).Id;
        var second = (await CreateProject(client, "Second")).Id;
        using var created = await client.PostAsJsonAsync($"/api/projects/{first}/tasks", new { title = "Keep" });
        var task = Assert.IsType<ProjectTask>(await created.Content.ReadFromJsonAsync<ProjectTask>());
        using var missingProject = await client.GetAsync("/api/projects/99999");
        Assert.Equal(HttpStatusCode.NotFound, missingProject.StatusCode);
        using var missingEdit = await client.PutAsJsonAsync("/api/projects/99999", new { name = "Missing" });
        Assert.Equal(HttpStatusCode.NotFound, missingEdit.StatusCode);
        using var missingCreate = await client.PostAsJsonAsync("/api/projects/99999/tasks", new { title = "Missing" });
        Assert.Equal(HttpStatusCode.NotFound, missingCreate.StatusCode);
        foreach (var path in new[] { $"/api/projects/{second}/tasks/{task.Id}", $"/api/projects/{first}/tasks/99999" })
        {
            using var get = await client.GetAsync(path);
            Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
            using var put = await client.PutAsJsonAsync(path, new { title = "Rejected", status = "Done" });
            Assert.Equal(HttpStatusCode.NotFound, put.StatusCode);
        }
        Assert.Empty(Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>($"/api/projects/{second}")).Tasks);
        Assert.Equal("Keep", (await client.GetFromJsonAsync<ProjectTask>(created.Headers.Location))?.Title);
    }

    [Theory]
    [InlineData("{}")]
    [InlineData("null")]
    [InlineData("{")]
    [InlineData("{\"name\":42,\"title\":42,\"status\":42}")]
    public async Task InvalidRequestBodiesCannotModifyProjectsOrTasks(string body)
    {
        using var scenario = new Scenario();
        using var app = scenario.Start();
        using var client = app.CreateClient();
        var id = (await CreateProject(client, "Original")).Id;
        using var created = await client.PostAsJsonAsync($"/api/projects/{id}/tasks", new { title = "Keep" });
        var task = Assert.IsType<ProjectTask>(await created.Content.ReadFromJsonAsync<ProjectTask>());
        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        using var projectEdit = await client.PutAsync($"/api/projects/{id}", content);
        Assert.Equal(HttpStatusCode.BadRequest, projectEdit.StatusCode);
        using var taskCreate = await client.PostAsync($"/api/projects/{id}/tasks", content);
        Assert.Equal(HttpStatusCode.BadRequest, taskCreate.StatusCode);
        using var taskEdit = await client.PutAsync($"/api/projects/{id}/tasks/{task.Id}", content);
        Assert.Equal(HttpStatusCode.BadRequest, taskEdit.StatusCode);
        var detail = Assert.IsType<Detail>(await client.GetFromJsonAsync<Detail>($"/api/projects/{id}"));
        Assert.Equal("Original", detail.Name);
        Assert.Equal("Keep", Assert.Single(detail.Tasks).Title);
    }
}
