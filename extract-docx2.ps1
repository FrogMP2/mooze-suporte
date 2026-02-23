function Get-DocxText([string]$path) {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($path)
    $entry = $zip.GetEntry('word/document.xml')
    $reader = New-Object System.IO.StreamReader($entry.Open())
    $xml = $reader.ReadToEnd()
    $reader.Close(); $zip.Dispose()
    $xml = $xml -replace '<[^>]+>',''
    $xml = $xml -replace '&amp;','&' -replace '&lt;','<' -replace '&gt;','>' -replace '&apos;',"'" -replace '&quot;','"'
    return $xml.Trim()
}

# Find all docx files recursively using Get-ChildItem to handle encoding properly
$docxFiles = Get-ChildItem -Path "treinamento" -Filter "*.docx" -Recurse
$odtFiles = Get-ChildItem -Path "treinamento" -Filter "*.odt" -Recurse

foreach($f in $docxFiles) {
    Write-Output "=== $($f.FullName) ==="
    try {
        Write-Output (Get-DocxText $f.FullName)
    } catch {
        Write-Output "ERROR: $_"
    }
    Write-Output ''
}

foreach($f in $odtFiles) {
    Write-Output "=== $($f.FullName) === (ODT)"
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $zip = [System.IO.Compression.ZipFile]::OpenRead($f.FullName)
        $entry = $zip.GetEntry('content.xml')
        $reader = New-Object System.IO.StreamReader($entry.Open())
        $xml = $reader.ReadToEnd()
        $reader.Close(); $zip.Dispose()
        $xml = $xml -replace '<[^>]+>',''
        $xml = $xml -replace '&amp;','&' -replace '&lt;','<' -replace '&gt;','>'
        Write-Output $xml.Trim()
    } catch {
        Write-Output "ERROR: $_"
    }
    Write-Output ''
}
