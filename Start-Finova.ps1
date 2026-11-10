param([switch]$SetupOnly)

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot
$backendDir = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"
$backendEnv = Join-Path $backendDir ".env"
$frontendEnv = Join-Path $frontendDir ".env.local"
$logsDir = Join-Path $projectRoot ".logs"

function Get-EnvValue([string]$path, [string]$name) {
    if (-not (Test-Path $path)) { return $null }
    $line = Get-Content $path | Where-Object { $_ -match "^\s*$([regex]::Escape($name))=(.+)$" } | Select-Object -First 1
    if ($line -match "^\s*$([regex]::Escape($name))=(.+)$") {
        $value = $matches[1].Trim()
        if ($value -match "your_|your-project|_here$") { return $null }
        return $value
    }
    return $null
}

function Set-EnvValue([string]$path, [string]$name, [string]$value) {
    $content = Get-Content -Raw $path
    $pattern = "(?m)^\s*$([regex]::Escape($name))=.*$"
    if ($content -match $pattern) {
        $content = [regex]::Replace($content, $pattern, "$name=$value")
    } else {
        $content += "`r`n$name=$value`r`n"
    }
    Set-Content -NoNewline -Path $path -Value $content
}

function Stop-FinpilotProcesses {
    # `Get-NetTCPConnection` is unavailable to some non-admin Windows
    # sessions, so use the built-in netstat output to find our local ports.
    $processIds = netstat -ano |
        Select-String '^\s*TCP\s+.*:(5050|8001)\s+.*LISTENING\s+\d+\s*$' |
        ForEach-Object {
            if ($_.Line -match '\s+(\d+)\s*$') { [int]$matches[1] }
        } |
        Select-Object -Unique
    foreach ($processId in $processIds) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}

# Always restart from a clean, single-server state. This avoids a running
# Next.js process serving references to files from an older `.next` cache.
Stop-FinpilotProcesses
$nextCache = Join-Path $frontendDir ".next"
if (Test-Path $nextCache) {
    Remove-Item -LiteralPath $nextCache -Recurse -Force
}

if (-not (Test-Path $frontendEnv)) {
    throw "Missing frontend/.env.local. Copy frontend/.env.example to frontend/.env.local and enter your Supabase public URL and anon key."
}

$frontendPublicUrl = Get-EnvValue $frontendEnv "NEXT_PUBLIC_SUPABASE_URL"
$frontendAnonKey = Get-EnvValue $frontendEnv "NEXT_PUBLIC_SUPABASE_ANON_KEY"
if (-not $frontendPublicUrl -or -not $frontendAnonKey) {
    throw "frontend/.env.local needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before Finpilot can start."
}

if (-not (Test-Path $backendEnv)) {
    Copy-Item (Join-Path $backendDir ".env.example") $backendEnv -Force
}

if (-not (Get-EnvValue $backendEnv "SUPABASE_URL")) {
    Set-EnvValue $backendEnv "SUPABASE_URL" $frontendPublicUrl
}

if (-not (Get-EnvValue $backendEnv "SUPABASE_SERVICE_KEY")) {
    throw "Created backend/.env. Add your Supabase service_role key to SUPABASE_SERVICE_KEY once, then run start again. Never use the public anon key here."
}

if ($SetupOnly) { exit 0 }

New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

$pythonExe = Join-Path $backendDir ".venv\Scripts\python.exe"
if (-not (Test-Path $pythonExe)) {
    Write-Host "Preparing the backend (first run only)..."
    Push-Location $backendDir
    try {
        # The local Python installation already contains Finova's packages.
        # Reuse them so first launch also works on networks that block pip.
        python -m venv --system-site-packages .venv
        if ($LASTEXITCODE -ne 0) { throw "Unable to create the Python environment." }
    } finally { Pop-Location }
}

$dependencyMarker = Join-Path $backendDir ".venv\.finova-dependencies-installed"
& $pythonExe -c "import fastapi, uvicorn, supabase, prophet, pandas"
if ($LASTEXITCODE -ne 0 -and -not (Test-Path $dependencyMarker)) {
    Write-Host "Installing backend packages (first run only)..."
    & $pythonExe -m pip install -r (Join-Path $backendDir "requirements.txt")
    if ($LASTEXITCODE -ne 0) { throw "Backend packages could not be installed." }
    New-Item -ItemType File -Path $dependencyMarker -Force | Out-Null
}

if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-Host "Installing frontend packages (first run only)..."
    Push-Location $frontendDir
    try {
        npm ci
        if ($LASTEXITCODE -ne 0) { throw "Frontend packages could not be installed." }
    } finally { Pop-Location }
}

$backendLog = Join-Path $logsDir "backend.log"
$backendErrorLog = Join-Path $logsDir "backend-error.log"
$frontendLog = Join-Path $logsDir "frontend.log"
$frontendErrorLog = Join-Path $logsDir "frontend-error.log"
$npmExecutable = (Get-Command npm.cmd -ErrorAction Stop).Source
$basePath = $env:Path
# Some Windows profiles expose both PATH and Path. Start-Process rejects that
# duplicate key, so retain the standard Windows spelling only.
if (Test-Path Env:PATH) { Remove-Item Env:PATH }
# npm needs its local executable folder to resolve `next` after the cleanup.
$env:Path = "$frontendDir\node_modules\.bin;$basePath"
Start-Process -FilePath $pythonExe -WorkingDirectory $backendDir -ArgumentList "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8001" -RedirectStandardOutput $backendLog -RedirectStandardError $backendErrorLog -WindowStyle Hidden
Start-Process -FilePath $npmExecutable -WorkingDirectory $frontendDir -ArgumentList "run", "dev" -RedirectStandardOutput $frontendLog -RedirectStandardError $frontendErrorLog -WindowStyle Hidden

for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try {
        if ((Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8001/health" -TimeoutSec 2).StatusCode -eq 200) { break }
    } catch {}
}

try {
    if ((Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8001/health" -TimeoutSec 2).StatusCode -ne 200) { throw "Backend did not become healthy." }
    Start-Process "http://localhost:5050"
    Write-Host "Finpilot is running at http://localhost:5050"
} catch {
    throw "Finpilot could not start. Check .logs/backend.log and .logs/frontend.log. $($_.Exception.Message)"
}
