# PHARMASOFT - chay 1 lenh: Docker Oracle 23ai + tao 28 bang + chay web noi vao Oracle
# Cach chay (trong VS Code Terminal, dang o thu muc PharmaSoft):
#   powershell -ExecutionPolicy Bypass -File .\run-oracle.ps1
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$envFile = Join-Path $root 'Database\.env'
$compose = Join-Path $root 'Database\docker-compose.oracle.yml'

function Fail($m) { Write-Host ""; Write-Host "LOI: $m" -ForegroundColor Red; exit 1 }

docker version --format '{{.Server.Version}}' 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { Fail "Docker Desktop chua chay. Mo Docker Desktop, doi no bao Running, roi chay lai." }
if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) { Fail "Chua cai .NET SDK 8. Tai o https://dotnet.microsoft.com/download" }

if (-not (Test-Path $envFile)) { Copy-Item (Join-Path $root 'Database\.env.example') $envFile }
$cfg = @{}
Get-Content $envFile | ForEach-Object { if ($_ -match '^\s*([^#=]+)=(.*)$') { $cfg[$matches[1].Trim()] = $matches[2].Trim() } }
$sysPw = $cfg['ORACLE_PASSWORD']; $appPw = $cfg['APP_USER_PASSWORD']
if (-not $sysPw -or -not $appPw) { Fail "File Database\.env thieu ORACLE_PASSWORD hoac APP_USER_PASSWORD." }

Write-Host "[1/5] Bat Oracle 23ai trong Docker (lan dau tai image ~ 1-2 GB, hay doi)..." -ForegroundColor Cyan
docker compose --env-file $envFile -f $compose up -d
if ($LASTEXITCODE -ne 0) { Fail "Khong bat duoc container. Neu bao 'TLS handshake timeout' la mang chan Docker Hub: doi mang/hotspot/tat VPN roi chay lai." }

Write-Host "[2/5] Cho Oracle khoi dong xong (lan dau 2-5 phut)..." -ForegroundColor Cyan
$ok = $false
for ($i = 0; $i -lt 90; $i++) {
  $st = docker inspect -f '{{.State.Health.Status}}' pharmasoft-oracle 2>$null
  if ($st -eq 'healthy') { $ok = $true; break }
  Start-Sleep -Seconds 10
  Write-Host "   ...dang cho ($st)"
}
if (-not $ok) { Fail "Oracle chua san sang sau 15 phut. Xem log: docker logs pharmasoft-oracle" }

Write-Host "[3/5] Cap quyen cho user pharmasoft..." -ForegroundColor Cyan
$grant = "GRANT DB_DEVELOPER_ROLE TO pharmasoft;`nALTER USER pharmasoft QUOTA UNLIMITED ON users;`nEXIT;`n"
$grant | docker exec -i pharmasoft-oracle sqlplus -s "system/$sysPw@//localhost:1521/FREEPDB1"

Write-Host "[4/5] Tao 28 bang + Duality View (log: Database\schema-log.txt)..." -ForegroundColor Cyan
docker cp (Join-Path $root 'Database\PHARMASOFT_oracle23ai_schema.sql') pharmasoft-oracle:/tmp/PHARMASOFT_oracle23ai_schema.sql | Out-Null
docker cp (Join-Path $root 'Database\run-schema.sql') pharmasoft-oracle:/tmp/run-schema.sql | Out-Null
$log = Join-Path $root 'Database\schema-log.txt'
docker exec -e NLS_LANG=.AL32UTF8 pharmasoft-oracle sqlplus -s "pharmasoft/$appPw@//localhost:1521/FREEPDB1" "@/tmp/run-schema.sql" 2>&1 | Tee-Object -FilePath $log | Out-Null
$errs = (Select-String -Path $log -Pattern 'ORA-|SP2-' -ErrorAction SilentlyContinue | Measure-Object).Count
if ($errs -gt 0) { Write-Host "   Co $errs dong loi trong schema-log.txt (app van chay duoc; hay gui file do cho minh de sua)." -ForegroundColor Yellow }
else { Write-Host "   Schema chay khong loi." -ForegroundColor Green }

Write-Host "[5/5] Chay web (lan dau tai goi Oracle.ManagedDataAccess can Internet)..." -ForegroundColor Cyan
$env:Storage__Provider = 'Oracle'
$env:ConnectionStrings__Oracle = "User Id=pharmasoft;Password=$appPw;Data Source=localhost:1521/FREEPDB1"
Write-Host ""
Write-Host "Mo http://localhost:5080  (admin / Admin@123)" -ForegroundColor Green
Write-Host "DBeaver: Host localhost, Port 1521, Service name FREEPDB1, User pharmasoft, Password trong Database\.env" -ForegroundColor Green
Set-Location (Join-Path $root 'PharmaSoft.Web')
dotnet run -p:UseOracle=true
