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

// Swagger: tài liệu + thử API tại /api-docs
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "PHARMASOFT API",
        Version = "v1",
        Description = "API lưu trữ dữ liệu của hệ thống quản lý nhà thuốc PHARMASOFT.\n\n" +
                      "Các collection hiện có: users, categories, commerce, invoices, returns, promotions, notices, live-chat, " +
                      "pos-products, pos-customers, partners-customer, partners-employee, partners-supplier, " +
                      "inventory-stock, inventory-receipts, inventory-issues, inventory-transfers, inventory-stocktakes."
    });
});

var app = builder.Build();
await store.InitAsync();
if (store is OracleDataStore oracleStore)
    _ = Task.Run(async () => { try { await oracleStore.ResyncAllAsync(); } catch (Exception ex) { Console.WriteLine("[resync] " + ex.Message); } });

// Tài liệu API: giao diện tại /api-docs, file OpenAPI tại /api-docs/v1/swagger.json
app.UseSwagger(c => c.RouteTemplate = "api-docs/{documentName}/swagger.json");
app.UseSwaggerUI(c =>
{
    c.RoutePrefix = "api-docs";
    c.SwaggerEndpoint("/api-docs/v1/swagger.json", "PHARMASOFT API v1");
    c.DocumentTitle = "PHARMASOFT API";
});

app.UseDefaultFiles();
app.UseStaticFiles();

var nameRule = new Regex("^[a-z0-9][a-z0-9._-]{0,79}$", RegexOptions.Compiled);
static string ActorOf(HttpRequest req)
{
    var raw = req.Headers["X-Actor"].ToString();
    return string.IsNullOrWhiteSpace(raw) ? "Không rõ" : Uri.UnescapeDataString(raw);
}

var api = app.MapGroup("/api");

api.MapGet("/health", () => Results.Ok(new { status = "ok", service = "PHARMASOFT", storage = store.Name }))
    .WithTags("Hệ thống")
    .WithSummary("Kiểm tra trạng thái server")
    .WithDescription("Trả về trạng thái và nơi lưu dữ liệu đang dùng (File hoặc Oracle).");

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
})
    .WithTags("Dữ liệu")
    .WithSummary("Lấy toàn bộ dữ liệu")
    .WithDescription("Trả về một object JSON, mỗi key là tên collection (vd: users, invoices) và value là dữ liệu của collection đó.")
    .Produces<JsonElement>(StatusCodes.Status200OK, "application/json");

api.MapGet("/data/{name}", async (string name) =>
{
    if (!nameRule.IsMatch(name)) return Results.BadRequest(new { error = "Tên không hợp lệ" });
    var json = await store.GetAsync(name);
    return json is null ? Results.NotFound() : Results.Content(json, "application/json");
})
    .WithTags("Dữ liệu")
    .WithSummary("Lấy dữ liệu của một collection")
    .WithDescription("`name` là tên collection, chỉ gồm chữ thường, số, dấu chấm, gạch ngang, gạch dưới (vd: `users`, `pos-products`).")
    .Produces<JsonElement>(StatusCodes.Status200OK, "application/json")
    .Produces(StatusCodes.Status400BadRequest)
    .Produces(StatusCodes.Status404NotFound);

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
})
    .WithTags("Dữ liệu")
    .WithSummary("Lưu (ghi đè) dữ liệu của một collection")
    .WithDescription("Body là JSON mới của cả collection, sẽ thay thế dữ liệu cũ. Server tự so sánh và ghi lịch sử thay đổi vào nhật ký. " +
                     "Header tùy chọn `X-Actor`: tên người thao tác (ghi vào nhật ký).")
    .Accepts<JsonElement>("application/json")
    .Produces(StatusCodes.Status200OK)
    .Produces(StatusCodes.Status400BadRequest);

// Nhật ký hoạt động
api.MapGet("/audit", async (int? limit, string? collection) =>
{
    var rows = await store.GetAuditAsync(Math.Clamp(limit ?? 200, 1, 1000), string.IsNullOrWhiteSpace(collection) ? null : collection);
    return Results.Ok(rows);
})
    .WithTags("Nhật ký")
    .WithSummary("Xem nhật ký hoạt động")
    .WithDescription("`limit`: số dòng (1–1000, mặc định 200). `collection`: lọc theo tên collection (để trống = tất cả).");

app.MapFallbackToFile("index.html");
app.Run();
