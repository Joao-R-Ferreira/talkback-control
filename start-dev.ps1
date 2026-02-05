$backend = Start-Process "cmd.exe" `
    -ArgumentList "/c npm run dev" `
    -WorkingDirectory ".\backend" `
    -PassThru

$frontend = Start-Process "cmd.exe" `
    -ArgumentList "/c npm run dev" `
    -WorkingDirectory ".\frontend" `
    -PassThru

Write-Host "Started Backend (PID: $($backend.Id)) and Frontend (PID: $($frontend.Id))"
Write-Host "Press any key to stop..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Stop-Process -Id $backend.Id -ErrorAction SilentlyContinue
Stop-Process -Id $frontend.Id -ErrorAction SilentlyContinue
Write-Host "Stopped."
