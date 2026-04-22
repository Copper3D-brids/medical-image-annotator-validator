$host.UI.RawUI.WindowTitle = "Medical Image Annotator Validator"
Set-Location $PSScriptRoot

Write-Host "============================================"
Write-Host " Medical Image Annotator Validator"
Write-Host "============================================"
Write-Host ""

# Check if Docker is running
& docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker is not running. Starting Docker Desktop..."
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Write-Host "Waiting for Docker to start..."
    do {
        Start-Sleep 3
        Write-Host "  Still waiting..."
        & docker info 2>&1 | Out-Null
    } while ($LASTEXITCODE -ne 0)
    Write-Host "Docker is ready!"
    Write-Host ""
}

# Open browser in background once frontend responds on port 80
$browserJob = Start-Job -ScriptBlock {
    $timestamp = [int][double]::Parse((Get-Date -UFormat %s))
    $url = "http://localhost:80/?t=$timestamp"
    $timeout = 120  # seconds
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        try {
            $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($resp.StatusCode -lt 500) {
                Start-Process $url
                break
            }
        } catch {}
        Start-Sleep 2
        $elapsed += 2
    }
}

Write-Host "Building and starting services (closing this window will stop all containers)..."
Write-Host ""
Write-Host "============================================"
Write-Host " Frontend:      http://localhost:80"
Write-Host " (Browser will open automatically with a cache-buster query parameter)"
Write-Host " MinIO Console: http://localhost:9001"
Write-Host "============================================"
Write-Host ""

# Run in FOREGROUND — when this window is closed, docker compose receives
# CTRL_CLOSE_EVENT and stops all containers automatically
& docker compose up --build --force-recreate

# Cleanup browser job if still running
Remove-Job $browserJob -Force 2>$null
