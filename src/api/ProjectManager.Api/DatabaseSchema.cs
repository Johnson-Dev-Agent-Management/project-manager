using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace ProjectManager.Api;

public static class DatabaseSchema
{
    // Bounded, additive upgrades for the synthetic Stage 1–4 development schemas.
    // Never reset data. The transaction makes schema changes atomic on restart.
    public static void Initialize(ProjectDb db)
    {
        db.Database.EnsureCreated();
        using var transaction = db.Database.BeginTransaction();
        using var command = db.Database.GetDbConnection().CreateCommand();
        command.Transaction = transaction.GetDbTransaction();
        command.CommandText = "SELECT name FROM pragma_table_info('Tasks')";
        var columns = new HashSet<string>(StringComparer.Ordinal);
        using (var reader = command.ExecuteReader())
            while (reader.Read()) columns.Add(reader.GetString(0));
        if (!columns.Contains("Priority"))
            db.Database.ExecuteSqlRaw("ALTER TABLE Tasks ADD COLUMN Priority TEXT NOT NULL DEFAULT 'None' CHECK (Priority IN ('None', 'Low', 'Medium', 'High'))");
        if (!columns.Contains("DueDate"))
            db.Database.ExecuteSqlRaw("ALTER TABLE Tasks ADD COLUMN DueDate TEXT NULL");
        db.Database.ExecuteSqlRaw("""
            CREATE TABLE IF NOT EXISTS TodaySelections (
                TaskId INTEGER NOT NULL,
                Day TEXT NOT NULL,
                PRIMARY KEY (TaskId, Day),
                FOREIGN KEY (TaskId) REFERENCES Tasks (Id) ON DELETE CASCADE
            )
            """);
        db.Database.ExecuteSqlRaw("""
            CREATE TABLE IF NOT EXISTS InboxItems (
                Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                Title TEXT NOT NULL,
                Notes TEXT NULL,
                CapturedAt TEXT NOT NULL
            )
            """);
        db.Database.ExecuteSqlRaw("""
            CREATE TABLE IF NOT EXISTS Milestones (
                Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                ProjectId INTEGER NOT NULL,
                Title TEXT NOT NULL,
                Description TEXT NULL,
                TargetDate TEXT NULL,
                FOREIGN KEY (ProjectId) REFERENCES Projects (Id) ON DELETE CASCADE
            )
            """);
        db.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_Milestones_ProjectId ON Milestones (ProjectId)");
        if (!columns.Contains("MilestoneId"))
            db.Database.ExecuteSqlRaw("ALTER TABLE Tasks ADD COLUMN MilestoneId INTEGER NULL REFERENCES Milestones (Id) ON DELETE SET NULL");
        db.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_Tasks_MilestoneId ON Tasks (MilestoneId)");
        transaction.Commit();
    }
}
