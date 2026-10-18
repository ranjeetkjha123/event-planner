$ErrorActionPreference = 'Stop'

# Codex runs this helper to get the API key from the ignored local env file.
# Never write the key to logs or diagnostics; stdout must contain only headers JSON.
$envFile = Join-Path (Split-Path -Parent $PSScriptRoot) '.env.local'
$keyLine = Get-Content -LiteralPath $envFile -ErrorAction Stop |
    Where-Object { $_ -match '^\s*STITCH_API_KEY\s*=' } |
    Select-Object -Last 1

if (-not $keyLine) {
    [Console]::Error.WriteLine('STITCH_API_KEY is missing from the project .env.local file.')
    exit 1
}

$key = ($keyLine -replace '^\s*STITCH_API_KEY\s*=\s*', '').Trim()
if ($key.Length -ge 2 -and (($key.StartsWith('"') -and $key.EndsWith('"')) -or ($key.StartsWith("'") -and $key.EndsWith("'")))) {
    $key = $key.Substring(1, $key.Length - 2)
}

if ([string]::IsNullOrWhiteSpace($key)) {
    [Console]::Error.WriteLine('STITCH_API_KEY is empty in the project .env.local file.')
    exit 1
}

@{ 'X-Goog-Api-Key' = $key } | ConvertTo-Json -Compress
