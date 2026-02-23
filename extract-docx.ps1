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

$files = @(
  'treinamento/App não sincroniza/Não sincroniza.docx',
  'treinamento/Entrega de ativos - BASE.docx',
  'treinamento/Envio de transações.docx',
  'treinamento/PIX/Como fazer PIX - Código inválido.docx',
  'treinamento/PIX/Estornos e antifraude.docx',
  'treinamento/PIX/PIX - Atrasado - Pós Sinistro.docx',
  'treinamento/Saque - Bitcoin/Saques - Bitcoin.docx',
  'treinamento/SWAP/Pendente e swap não funciona mais - TX not found.odt',
  'treinamento/SWAP/Saldos não confirmados.docx',
  'treinamento/SWAP/SWAP problemas.docx',
  'treinamento/Taxas de rede/Beta 1.2/Taxas de rede Baixas - BTC SUMIU.docx',
  'treinamento/Taxas de rede/Taxas de rede - Envios.docx',
  'treinamento/Usuário Banido/Banimento.docx',
  'treinamento/Usuário Banido/Prova de legitimidade Businees.docx'
)

foreach($f in $files) {
    Write-Output "=== $f ==="
    try {
        Write-Output (Get-DocxText $f)
    } catch {
        Write-Output "ERROR: $_"
    }
    Write-Output ''
}
