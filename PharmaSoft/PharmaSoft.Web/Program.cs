using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using PharmaSoft.Web.Data;

var builder = WebApplication.CreateBuilder(args);

// Chọn nơi lưu dữ liệu: "File" (mặc định, chạy ngay) hoặc "Oracle" (khi Docker/Oracle đã sẵn sàng)
var provider = builder.Configuration["Storage:Provider"] ?? "File";
IDataStore store = provider.Equals("Oracle", StringComparison.OrdinalIgnoreCase)
    ? new OracleDataStore(builder.Configuration.GetConnectionString("Oracle")
        ?? throw new InvalidOperationException("Thiếu ConnectionStrings:Oracle trong appsettings."))
    : new JsonFileStore(Path.Combine(builder.Environment.ContentRootPath, builder.Configuration["Storage:DataDir"] ?? "data"));
builder.Services.AddSingleton(store);

var app = builder.Build();
await store.InitAsync();
if (store is OracleDataStore oracleStore)
    _ = Task.Run(async () => { try { await oracleStore.ResyncAllAsync(); } catch (Exception ex) { Console.WriteLine("[resync] " + ex.Message); } });

app.UseDefaultFiles();
app.UseStaticFiles();

var nameRule = new Regex("^[a-z0-9][a-z0-9._-]{0,79}$", RegexOptions.Compiled);
static string ActorOf(HttpRequest req)
{
    var raw = req.Headers["X-Actor"].ToString();
    return string.IsNullOrWhiteSpace(raw) ? "Không rõ" : Uri.UnescapeDataString(raw);
}

var api = app.MapGroup("/api");

api.MapGet("/health", () => Results.Ok(new { status = "ok", service = "PHARMASOFT", storage = store.Name }));

// Tải toàn bộ dữ liệu khi mở web
api.MapGet("/data", async () =>
{
    var all = await store.GetAllAsync();
    var sb = new StringBuilder("{");
    var first = true;
    foreach (var (k, v) in all)
    {
        if (!first) sb.Append(',');
        first = false;
        sb.Append(JsonSerializer.Serialize(k)).Append(':').Append(v);
    }
    return Results.Content(sb.Append('}').ToString(), "application/json");
});

api.MapGet("/data/{name}", async (string name) =>
{
    if (!nameRule.IsMatch(name)) return Results.BadRequest(new { error = "Tên không hợp lệ" });
    var json = await store.GetAsync(name);
    return json is null ? Results.NotFound() : Results.Content(json, "application/json");
});

// Lưu một danh sách/tài liệu + tự ghi lịch sử thay đổi
api.MapPut("/data/{name}", async (string name, HttpRequest req) =>
{
    if (!nameRule.IsMatch(name)) return Results.BadRequest(new { error = "Tên không hợp lệ" });
    using var reader = new StreamReader(req.Body, Encoding.UTF8);
    var body = await reader.ReadToEndAsync();
    try { using var _ = JsonDocument.Parse(body); }
    catch (JsonException) { return Results.BadRequest(new { error = "Dữ liệu không phải JSON hợp lệ" }); }

    var actor = ActorOf(req);
    var old = await store.GetAsync(name);
    var audit = AuditDiff.Compute(name, old, body, actor);
    await store.SaveAsync(name, body, actor, audit);
    return Results.Ok(new { saved = true, changes = audit.Count });
});

// Nhật ký hoạt động
api.MapGet("/audit", async (int? limit, string? collection) =>
{
    var rows = await store.GetAuditAsync(Math.Clamp(limit ?? 200, 1, 1000), string.IsNullOrWhiteSpace(collection) ? null : collection);
    return Results.Ok(rows);
});

app.MapFallbackToFile("index.html");
app.Run();
