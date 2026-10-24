# Serveur HTTP Local et Lanceur pour GAB-SANTE
# Conçu avec les composants natifs de Windows PowerShell (.NET HttpListener)
$port = 8080
$prefix = "http://localhost:$port/"
$directory = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "       GAB-SANTE - Interconnexion Hospitalière du Gabon   " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Dmarrage du serveur local sur: $prefix" -ForegroundColor Cyan
Write-Host "Rpertoire source: $directory" -ForegroundColor Gray

# Lancement du navigateur par dfaut
Start-Process "$prefix"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "Le serveur est actif ! Appuyez sur Ctrl+C pour arrter." -ForegroundColor Green
} catch {
    Write-Host "Erreur lors du dmarrage sur le port $port. Ouverture directe du fichier dans le navigateur..." -ForegroundColor Yellow
    Start-Process "$directory\index.html"
    exit
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($urlPath)) {
            $urlPath = "index.html"
        }

        $filePath = Join-Path $directory $urlPath

        if (Test-Path $filePath -PathType Leaf) {
            $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
            switch ($extension) {
                ".html" { $response.ContentType = "text/html; charset=utf-8" }
                ".css"  { $response.ContentType = "text/css; charset=utf-8" }
                ".js"   { $response.ContentType = "application/javascript; charset=utf-8" }
                ".json" { $response.ContentType = "application/json; charset=utf-8" }
                ".svg"  { $response.ContentType = "image/svg+xml" }
                default { $response.ContentType = "application/octet-stream" }
            }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 - Fichier non trouv")
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }

        $response.OutputStream.Close()
    } catch {
        # Arrt propre
        break
    }
}
$listener.Stop()
