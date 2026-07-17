param(
    [Parameter(Mandatory = $true)]
    [string]$Source
)

$ErrorActionPreference = "Stop"
$workspace = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$wasm = Join-Path $workspace "contracts\target\wasm32v1-none\release\skillchain_credential.wasm"

Push-Location $workspace

try {
    npm run contracts:build

    if ($LASTEXITCODE -ne 0) {
        throw "Credential contract build failed."
    }

    $contractId = (& stellar --quiet contract deploy --wasm $wasm --source-account $Source --network testnet --alias skillchain-credential-testnet).Trim()

    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($contractId)) {
        throw "Credential contract deployment failed."
    }

    $issuer = (& stellar keys address $Source).Trim()
    & stellar contract invoke --id $contractId --source-account $Source --network testnet -- initialize --issuer $issuer

    if ($LASTEXITCODE -ne 0) {
        throw "Credential contract initialization failed."
    }

    Write-Output "STELLAR_CONTRACT_ID=$contractId"
    Write-Output "STELLAR_ISSUER_ADDRESS=$issuer"
}
finally {
    Pop-Location
}
