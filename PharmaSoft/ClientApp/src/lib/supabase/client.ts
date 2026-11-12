// Bản chạy trong ASP.NET Core dùng chế độ DEMO (dữ liệu mẫu), không dùng Supabase.
export function getSupabaseBrowserClient(): never {
  throw new Error('Supabase đã được tắt trong bản ASP.NET Core. Hãy kết nối backend ASP.NET Core.')
}
