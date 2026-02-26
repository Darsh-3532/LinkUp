# LinkUp Network Explorer Launcher
$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "============================================================"
Write-Host "         LinkUp - Network Explorer"
Write-Host "============================================================"
Write-Host ""

$PORT = 5000
$URL = "http://localhost:$PORT/pages/network_explorer.html"
$API_HEALTH = "http://localhost:$PORT/api/health"

# Function to check if server is running
function Test-ServerRunning {
    try {
        $response = Invoke-WebRequest -Uri $API_HEALTH -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# Function to kill existing processes
function Stop-ExistingServer {
    Write-Host "Stopping existing processes..."
    Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Check if server already running
if (Test-ServerRunning) {
    Write-Host "✓ Server already running`n"
} else {
    Stop-ExistingServer
    
    Write-Host "Starting backend server...`n"
    
    # Start server in background
    $serverProcess = Start-Process npm -ArgumentList "run server" -WindowStyle Hidden -PassThru -WorkingDirectory $PSScriptRoot
    
    # Wait for server to be ready
    $attempts = 0
    while (-not (Test-ServerRunning) -and $attempts -lt 30) {
        Start-Sleep -Milliseconds 500
        $attempts++
    }
    
    if (Test-ServerRunning) {
        Write-Host "✓ Server started successfully`n"
    } else {
        Write-Host "✗ Server failed to start" -ForegroundColor Red
        exit 1
    }
}

Write-Host "============================================================"
Write-Host "Server running on: http://localhost:$PORT"
Write-Host "Network Explorer: $URL"
Write-Host "============================================================`n"

Write-Host "Opening LinkUp Network Explorer...`n"

# Open browser
Start-Process $URL -ErrorAction SilentlyContinue

Write-Host "✓ Launched successfully!"
Write-Host ""
Write-Host "Press Ctrl+C to stop the server`n"

# Keep PowerShell open
Read-Host "Press Enter to exit"
