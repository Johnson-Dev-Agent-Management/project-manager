using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Xunit;
using ProjectManager.Api;

namespace ProjectManager.Api.Tests;

public sealed class ProjectsTests
{
    private static readonly string[] OrderedNames = ["Zebra", "Alpha", "Middle"];

    private sealed class Scenario : IDisposable
    {
        private readonly string directory = Path.Combine(Path.GetTempPath(), $"projects-{Guid.NewGuid()}");

        public Scenario() => Directory.CreateDirectory(directory);

        public WebApplicationFactory<Program> Start() => new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => builder.ConfigureAppConfiguration((_, config) =>
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    // No global ClearAllPools: each fixture owns non-pooled connections and storage.
                    ["ConnectionStrings:Projects"] = $"Data Source={Path.Combine(directory, "projects.db")};Pooling=False"
                })));

        public void Dispose() => Directory.Delete(directory, recursive: true);
    }

    [Fact]
    public async Task CreateListAndRestartPreservesTrimmedName()
    {
        using var scenario = new Scenario();
        int id;
        using (var app = scenario.Start())
        using (var client = app.CreateClient())
        using (var response = await client.PostAsJsonAsync("/api/projects", new { name = " \tExample\r\n " }))
        {
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
            var project = await response.Content.ReadFromJsonAsync<Project>();
            Assert.NotNull(project);
            Assert.Equal("Example", project.Name);
            Assert.True(project.Id > 0);
            id = project.Id;
            Assert.Equal($"/api/projects/{id}", response.Headers.Location?.OriginalString);
        }
        using (var restarted = scenario.Start())
        using (var client = restarted.CreateClient())
        {
            var projects = await client.GetFromJsonAsync<Project[]>("/api/projects");
            var project = Assert.Single(Assert.IsType<Project[]>(projects));
            Assert.Equal(id, project.Id);
            Assert.Equal("Example", project.Name);
        }
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\t\r\n")]
    [InlineData(null)]
    public async Task RejectsBlankNamesWithoutWriting(string? name)
    {
        using var scenario = new Scenario();
        using var app = scenario.Start();
        using var client = app.CreateClient();
        using var existing = await client.PostAsJsonAsync("/api/projects", new { name = "Existing" });
        existing.EnsureSuccessStatusCode();
        using var response = await client.PostAsJsonAsync("/api/projects", new { name });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        using var problem = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(400, problem.RootElement.GetProperty("status").GetInt32());
        Assert.Equal("Project name is required.",
            Assert.Single(problem.RootElement.GetProperty("errors").GetProperty("name").EnumerateArray()).GetString());
        var projects = await client.GetFromJsonAsync<Project[]>("/api/projects");
        Assert.Equal("Existing", Assert.Single(Assert.IsType<Project[]>(projects)).Name);
    }

    [Theory]
    [InlineData("{}")]
    [InlineData("{\"name\":42}")]
    [InlineData("{")]
    [InlineData("null")]
    public async Task RejectsInvalidBodiesWithoutWriting(string body)
    {
        using var scenario = new Scenario();
        using var app = scenario.Start();
        using var client = app.CreateClient();
        using var content = new StringContent(body, Encoding.UTF8, "application/json");
        using var response = await client.PostAsync("/api/projects", content);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(Assert.IsType<Project[]>(await client.GetFromJsonAsync<Project[]>("/api/projects")));
    }

    [Fact]
    public async Task EmptyStoreHealthAndInsertionOrderHaveStableContracts()
    {
        using var scenario = new Scenario();
        using var app = scenario.Start();
        using var client = app.CreateClient();
        using var health = await client.GetAsync("/api/health");
        Assert.Equal(HttpStatusCode.OK, health.StatusCode);
        Assert.Equal("application/json", health.Content.Headers.ContentType?.MediaType);
        using var payload = JsonDocument.Parse(await health.Content.ReadAsStringAsync());
        Assert.Equal("ok", payload.RootElement.GetProperty("status").GetString());
        Assert.Empty(Assert.IsType<Project[]>(await client.GetFromJsonAsync<Project[]>("/api/projects")));
        var ids = new List<int>();
        foreach (var name in OrderedNames)
        {
            using var response = await client.PostAsJsonAsync("/api/projects", new { name });
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var project = await response.Content.ReadFromJsonAsync<Project>();
            Assert.NotNull(project);
            ids.Add(project.Id);
        }
        var projects = Assert.IsType<Project[]>(await client.GetFromJsonAsync<Project[]>("/api/projects"));
        Assert.Equal(OrderedNames, projects.Select(project => project.Name));
        Assert.Equal(ids, projects.Select(project => project.Id));
        Assert.Equal(ids.Order(), ids);
    }
}
