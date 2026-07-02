$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"

Start-Process `
  -FilePath "npm.cmd" `
  -ArgumentList @("run", "dev") `
  -WorkingDirectory $Backend `
  -RedirectStandardOutput (Join-Path $Backend "api.out.log") `
  -RedirectStandardError (Join-Path $Backend "api.err.log") `
  -WindowStyle Hidden

Start-Sleep -Seconds 2

npm.cmd --prefix $Frontend run dev
