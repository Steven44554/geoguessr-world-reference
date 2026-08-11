$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$projectFile = Join-Path $PSScriptRoot "GeoGuessrAiHelper\GeoGuessrAiHelper.csproj"
$outputDirectory = Join-Path $projectRoot "downloads"
$publishDirectory = Join-Path $PSScriptRoot ".publish"
$helperRootFull = [IO.Path]::GetFullPath($PSScriptRoot).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$publishFull = [IO.Path]::GetFullPath($publishDirectory)

if (-not $publishFull.StartsWith($helperRootFull, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Ungültiges temporäres Veröffentlichungsverzeichnis."
}

if (Test-Path -LiteralPath $publishDirectory) {
  Remove-Item -LiteralPath $publishDirectory -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
New-Item -ItemType Directory -Force -Path $publishDirectory | Out-Null

dotnet restore $projectFile `
  --runtime win-x64 `
  --ignore-failed-sources `
  -p:PublishSingleFile=true `
  -p:SelfContained=false `
  -p:NuGetAudit=false
if ($LASTEXITCODE -ne 0) {
  throw "Die Wiederherstellung der .NET-Abhängigkeiten ist fehlgeschlagen."
}

dotnet publish $projectFile `
  --configuration Release `
  --runtime win-x64 `
  --no-restore `
  --output $publishDirectory `
  -p:PublishSingleFile=true `
  -p:SelfContained=false `
  -p:DebugType=None `
  -p:DebugSymbols=false
if ($LASTEXITCODE -ne 0) {
  throw "Die Veröffentlichung der EXE ist fehlgeschlagen."
}

$publishedExe = Join-Path $publishDirectory "GeoGuessr-KI-Helfer.exe"
if (-not (Test-Path -LiteralPath $publishedExe)) {
  throw "Die erwartete EXE wurde nicht erzeugt."
}

Copy-Item -LiteralPath $publishedExe -Destination (Join-Path $outputDirectory "GeoGuessr-KI-Helfer.exe") -Force
Remove-Item -LiteralPath $publishDirectory -Recurse -Force

Write-Host "Fertig: $outputDirectory\GeoGuessr-KI-Helfer.exe"
