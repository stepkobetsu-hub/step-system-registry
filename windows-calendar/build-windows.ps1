$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$publishDir = Join-Path $projectDir 'publish'
$iconBase64 = Get-Content (Join-Path $projectDir 'calendar.ico.b64') -Raw
[IO.File]::WriteAllBytes((Join-Path $projectDir 'calendar.ico'), [Convert]::FromBase64String($iconBase64))

dotnet restore (Join-Path $projectDir 'DigitalCalendar.csproj')
dotnet publish (Join-Path $projectDir 'DigitalCalendar.csproj') `
  -c Release `
  -r win-x64 `
  --self-contained true `
  -o $publishDir `
  -p:PublishReadyToRun=true

$iscc = Join-Path ${env:ProgramFiles(x86)} 'Inno Setup 6\ISCC.exe'
if (-not (Test-Path $iscc)) {
  choco install innosetup --no-progress -y
}
& $iscc (Join-Path $projectDir 'installer.iss')
