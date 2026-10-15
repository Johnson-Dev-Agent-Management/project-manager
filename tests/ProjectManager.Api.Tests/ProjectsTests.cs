using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Xunit;
public class ProjectsTests {
    private static WebApplicationFactory<Program> Factory(string path) => new WebApplicationFactory<Program>().WithWebHostBuilder(builder => builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?> { ["ConnectionStrings:Projects"] = $"Data Source={path}" })));
    [Fact] public async Task CreateListAndRestartPreservesTrimmedName() {
        var path = Path.Combine(Path.GetTempPath(), $"projects-{Guid.NewGuid()}.db");
        try {
            using (var app = Factory(path)) {
                using var client = app.CreateClient();
                var response = await client.PostAsJsonAsync("/api/projects", new { name = " Example " });
                Assert.Equal(HttpStatusCode.Created, response.StatusCode);
                Assert.Equal("Example", (await response.Content.ReadFromJsonAsync<Project>())!.Name);
            }
            using (var restarted = Factory(path)) {
                var projects = await restarted.CreateClient().GetFromJsonAsync<Project[]>("/api/projects");
                Assert.Equal("Example", Assert.Single(projects!).Name);
            }
        } finally { Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools(); foreach (var file in Directory.GetFiles(Path.GetDirectoryName(path)!, Path.GetFileName(path) + "*")) File.Delete(file); }
    }
    [Theory] [InlineData("")] [InlineData("   ")] [InlineData(null)]
    public async Task RejectsBlankNames(string? name) {
        var path = Path.Combine(Path.GetTempPath(), $"projects-{Guid.NewGuid()}.db");
        try {
            using var app = Factory(path); using var client = app.CreateClient();
            var response = await client.PostAsJsonAsync("/api/projects", new { name });
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains("Project name is required.", await response.Content.ReadAsStringAsync());
            Assert.Empty((await client.GetFromJsonAsync<Project[]>("/api/projects"))!);
        } finally { Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools(); foreach (var file in Directory.GetFiles(Path.GetDirectoryName(path)!, Path.GetFileName(path) + "*")) File.Delete(file); }
    }
}
