$backend = Start-Process "cmd.exe" `
    -ArgumentList "/k npm run dev" `
    -WorkingDirectory ".\backend" `
    -PassThru

$frontend = Start-Process "cmd.exe" `
    -ArgumentList "/k npm run dev" `
    -WorkingDirectory ".\frontend" `
    -PassThru

Write-Host "SERVER STARTED with Backend PID: $($backend.Id) and Frontend PID: $($frontend.Id)"
Write-Host "Press any key to STOP..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "Force killing ENTIRE process trees..."
taskkill /F /T /PID $backend.Id 2>$null
taskkill /F /T /PID $frontend.Id 2>$null
Start-Sleep -Seconds 2
Write-Host "Everything stopped!"