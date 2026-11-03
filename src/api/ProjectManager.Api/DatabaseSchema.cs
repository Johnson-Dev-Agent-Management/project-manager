using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace ProjectManager.Api;

public static class DatabaseSchema
{
    // A bounded, additive upgrade for the synthetic Stage 1 development schema.
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
        transaction.Commit();
    }
}
