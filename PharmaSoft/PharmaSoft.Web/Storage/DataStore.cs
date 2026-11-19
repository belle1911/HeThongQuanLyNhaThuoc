using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace PharmaSoft.Web.Data;

/// <summary>Một dòng lịch sử thay đổi trước khi lưu.</summary>
public record AuditEntry(string Action, string Collection, string? EntityId, string? Summary, string? OldValue, string? NewValue);

/// <summary>Một dòng nhật ký trả về cho giao diện (/api/audit).</summary>
public class AuditRow
{
    public long Id { get; set; }
    public string At { get; set; } = "";
    public string Actor { get; set; } = "";
    public string Action { get; set; } = "";
    public string Collection { get; set; } = "";
    public string? EntityId { get; set; }
    public string? Summary { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
}

public interface IDataStore
{
    string Name { get; }
    Task InitAsync();
    Task<IReadOnlyDictionary<string, string>> GetAllAsync();
    Task<string?> GetAsync(string name);
    Task SaveAsync(string name, string json, string actor, IReadOnlyList<AuditEntry> audit);
    Task<IReadOnlyList<AuditRow>> GetAuditAsync(int limit, string? collection);
}

/// <summary>Lưu mỗi danh sách thành một file JSON trong thư mục data; nhật ký ở audit.jsonl.</summary>
public class JsonFileStore : IDataStore
{
    private readonly string _dir;
    private readonly string _auditFile;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private long _nextAuditId = 1;
    private static readonly JsonSerializerOptions AuditJson = new(JsonSerializerDefaults.Web);

    public JsonFileStore(string dir)
    {
        _dir = dir;
        _auditFile = Path.Combine(dir, "audit.jsonl");
    }

    public string Name => "File";

    public Task InitAsync()
    {
        Directory.CreateDirectory(_dir);
        if (File.Exists(_auditFile))
        {
            foreach (var line in File.ReadLines(_auditFile))
            {
                if (string.IsNullOrWhiteSpace(line)) continue;
                try
                {
                    var row = JsonSerializer.Deserialize<AuditRow>(line, AuditJson);
                    if (row != null && row.Id >= _nextAuditId) _nextAuditId = row.Id + 1;
                }
                catch (JsonException) { }
            }
        }
        return Task.CompletedTask;
    }

    private string PathOf(string name) => Path.Combine(_dir, name + ".json");

    public async Task<IReadOnlyDictionary<string, string>> GetAllAsync()
    {
        await _lock.WaitAsync();
        try
        {
            var result = new Dictionary<string, string>();
            foreach (var file in Directory.EnumerateFiles(_dir, "*.json"))
                result[Path.GetFileNameWithoutExtension(file)] = await File.ReadAllTextAsync(file, Encoding.UTF8);
            return result;
        }
        finally { _lock.Release(); }
    }

    public async Task<string?> GetAsync(string name)
    {
        await _lock.WaitAsync();
        try
        {
            var p = PathOf(name);
            return File.Exists(p) ? await File.ReadAllTextAsync(p, Encoding.UTF8) : null;
        }
        finally { _lock.Release(); }
    }

    public async Task SaveAsync(string name, string json, string actor, IReadOnlyList<AuditEntry> audit)
    {
        await _lock.WaitAsync();
        try
        {
            var p = PathOf(name);
            var tmp = p + ".tmp";
            await File.WriteAllTextAsync(tmp, json, Encoding.UTF8);
            File.Move(tmp, p, overwrite: true);

            if (audit.Count == 0) return;
            var now = DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ss");
            var sb = new StringBuilder();
            foreach (var a in audit)
            {
                var row = new AuditRow
                {
                    Id = _nextAuditId++, At = now, Actor = actor, Action = a.Action, Collection = a.Collection,
                    EntityId = a.EntityId, Summary = a.Summary, OldValue = a.OldValue, NewValue = a.NewValue,
                };
                sb.AppendLine(JsonSerializer.Serialize(row, AuditJson));
            }
            await File.AppendAllTextAsync(_auditFile, sb.ToString(), Encoding.UTF8);
        }
        finally { _lock.Release(); }
    }

    public async Task<IReadOnlyList<AuditRow>> GetAuditAsync(int limit, string? collection)
    {
        await _lock.WaitAsync();
        try
        {
            if (!File.Exists(_auditFile)) return Array.Empty<AuditRow>();
            var rows = new List<AuditRow>();
            foreach (var line in await File.ReadAllLinesAsync(_auditFile, Encoding.UTF8))
            {
                if (string.IsNullOrWhiteSpace(line)) continue;
                try
                {
                    var row = JsonSerializer.Deserialize<AuditRow>(line, AuditJson);
                    if (row == null) continue;
                    if (collection != null && row.Collection != collection && !row.Collection.StartsWith(collection + ".")) continue;
                    rows.Add(row);
                }
                catch (JsonException) { }
            }
            rows.Reverse();
            return rows.Take(limit).ToList();
        }
        finally { _lock.Release(); }
    }
}

/// <summary>
/// Chỗ giữ cho bản lưu Oracle. File gốc (OracleDataStore) bị thiếu trong bản tải về,
/// nên chế độ Storage:Provider=Oracle hiện chưa dùng được.
/// </summary>
public class OracleDataStore : IDataStore
{
    public OracleDataStore(string connectionString) =>
        throw new NotSupportedException("OracleDataStore bị thiếu trong mã nguồn. Hãy dùng Storage:Provider=File.");

    public string Name => "Oracle";
    public Task ResyncAllAsync() => Task.CompletedTask;
    public Task InitAsync() => throw new NotSupportedException();
    public Task<IReadOnlyDictionary<string, string>> GetAllAsync() => throw new NotSupportedException();
    public Task<string?> GetAsync(string name) => throw new NotSupportedException();
    public Task SaveAsync(string name, string json, string actor, IReadOnlyList<AuditEntry> audit) => throw new NotSupportedException();
    public Task<IReadOnlyList<AuditRow>> GetAuditAsync(int limit, string? collection) => throw new NotSupportedException();
}

/// <summary>So sánh dữ liệu cũ/mới để sinh nhật ký: thêm/sửa/xóa theo id.</summary>
public static class AuditDiff
{
    private const int MaxRows = 50;
    private const int MaxValueLength = 2000;

    public static List<AuditEntry> Compute(string name, string? oldJson, string newJson, string actor)
    {
        var result = new List<AuditEntry>();
        JsonNode? newNode = Parse(newJson);
        if (oldJson == null)
        {
            result.Add(new AuditEntry("SEED", name, null, $"Khởi tạo dữ liệu ({CountOf(newNode)} mục)", null, null));
            return result;
        }
        JsonNode? oldNode = Parse(oldJson);
        if (JsonNode.DeepEquals(oldNode, newNode)) return result;

        Diff(name, oldNode, newNode, result);

        if (result.Count > MaxRows)
        {
            var count = result.Count;
            result.Clear();
            result.Add(new AuditEntry("BULK", name, null, $"{count} thay đổi cùng lúc", null, null));
        }
        return result;
    }

    private static void Diff(string collection, JsonNode? oldNode, JsonNode? newNode, List<AuditEntry> result)
    {
        if (oldNode is JsonArray oa && newNode is JsonArray na && HasIds(oa) && HasIds(na))
        {
            var oldById = ById(oa);
            var newById = ById(na);
            foreach (var (id, item) in newById)
            {
                if (!oldById.TryGetValue(id, out var prev))
                    result.Add(new AuditEntry("CREATE", collection, id, $"Thêm {LabelOf(item, id)}", null, Short(item)));
                else if (!JsonNode.DeepEquals(prev, item))
                    result.Add(new AuditEntry("UPDATE", collection, id, $"Sửa {LabelOf(item, id)}{ChangedFields(prev, item)}", Short(prev), Short(item)));
            }
            foreach (var (id, item) in oldById)
                if (!newById.ContainsKey(id))
                    result.Add(new AuditEntry("DELETE", collection, id, $"Xóa {LabelOf(item, id)}", Short(item), null));
            return;
        }

        if (oldNode is JsonObject oo && newNode is JsonObject no)
        {
            var keys = oo.Select(p => p.Key).Union(no.Select(p => p.Key));
            var otherChanged = false;
            foreach (var key in keys)
            {
                var o = oo[key]; var n = no[key];
                if (JsonNode.DeepEquals(o, n)) continue;
                if (o is JsonArray && n is JsonArray) Diff(collection + "." + key, o, n, result);
                else otherChanged = true;
            }
            if (otherChanged) result.Add(new AuditEntry("UPDATE", collection, null, "Cập nhật dữ liệu", Short(oldNode), Short(newNode)));
            return;
        }

        result.Add(new AuditEntry("REPLACE", collection, null, "Thay đổi dữ liệu", Short(oldNode), Short(newNode)));
    }

    private static JsonNode? Parse(string json)
    {
        try { return JsonNode.Parse(json); } catch (JsonException) { return null; }
    }

    private static int CountOf(JsonNode? n) => n switch { JsonArray a => a.Count, JsonObject o => o.Count, _ => 1 };

    private static string? IdOf(JsonNode? item) =>
        item is JsonObject o && o["id"] is JsonValue v ? v.ToString() : null;

    private static bool HasIds(JsonArray a) => a.Count == 0 || a.All(i => IdOf(i) != null);

    private static Dictionary<string, JsonNode?> ById(JsonArray a)
    {
        var d = new Dictionary<string, JsonNode?>();
        foreach (var item in a) { var id = IdOf(item); if (id != null) d[id] = item; }
        return d;
    }

    private static string LabelOf(JsonNode? item, string id)
    {
        if (item is JsonObject o)
            foreach (var k in new[] { "name", "title", "fullName", "code", "username" })
                if (o[k] is JsonValue v) return $"{v} ({id})";
        return id;
    }

    private static string ChangedFields(JsonNode? a, JsonNode? b)
    {
        if (a is not JsonObject oa || b is not JsonObject ob) return "";
        var changed = oa.Select(p => p.Key).Union(ob.Select(p => p.Key))
            .Where(k => !JsonNode.DeepEquals(oa[k], ob[k])).Take(6).ToList();
        return changed.Count == 0 ? "" : ": " + string.Join(", ", changed);
    }

    private static string? Short(JsonNode? n)
    {
        if (n == null) return null;
        var s = n.ToJsonString(new JsonSerializerOptions { Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping });
        return s.Length > MaxValueLength ? s[..MaxValueLength] + "…" : s;
    }
}
