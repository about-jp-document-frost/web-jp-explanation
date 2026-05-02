param(
  [string]$RootPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [switch]$Watch
)

# Override display titles for folder keys that don't title-case cleanly
$GroupTitleOverrides = @{
  "jp-learning" = "JP Learning"
}

function Get-GroupTitle {
  param([string]$Key)
  if ($GroupTitleOverrides.ContainsKey($Key)) { return $GroupTitleOverrides[$Key] }
  return ($Key -split '-' | ForEach-Object { $_.Substring(0,1).ToUpper() + $_.Substring(1) }) -join ' '
}

function Decode-HtmlEntities {
  param([string]$Text)
  return $Text `
    -replace '&amp;',  '&' `
    -replace '&quot;', '"' `
    -replace '&#39;',  "'" `
    -replace '&lt;',   '<' `
    -replace '&gt;',   '>'
}

function Get-SidebarLabel {
  param([string]$FilePath)
  try {
    $content = Get-Content $FilePath -Raw -ErrorAction Stop
    if ($content -match 'data-sidebar-label="([^"]+)"') {
      return Decode-HtmlEntities $Matches[1]
    }
  } catch {}
  # Fallback: title-case from filename
  $name = [IO.Path]::GetFileNameWithoutExtension($FilePath)
  return ($name -split '-' | ForEach-Object { $_.Substring(0,1).ToUpper() + $_.Substring(1) }) -join ' '
}

function New-SidebarData {
  param([string]$Root)

  $docDir = Join-Path $Root "document"
  $outFile = Join-Path $Root "js/sidebar-data.js"

  $groups = @(
    Get-ChildItem $docDir -Directory | Sort-Object Name | ForEach-Object {
      $key   = $_.Name
      $dir   = $_.FullName
      $title = Get-GroupTitle $key
      $links = [System.Collections.Generic.List[hashtable]]::new()

      # index.html is always listed first with a fixed "Index" label
      if (Test-Path (Join-Path $dir "index.html")) {
        $links.Add(@{ path = "document/$key/index.html"; label = "Index" })
      }

      # Remaining HTML files, sorted alphabetically, non-empty only
      Get-ChildItem $dir -Filter "*.html" |
        Where-Object { $_.Name -ne "index.html" -and $_.Length -gt 0 } |
        Sort-Object Name |
        ForEach-Object {
          $links.Add(@{ path = "document/$key/$($_.Name)"; label = (Get-SidebarLabel $_.FullName) })
        }

      if ($links.Count -gt 0) {
        @{ key = $key; title = $title; links = $links }
      }
    } | Where-Object { $_ -ne $null }
  )

  # Build JS content
  $sb = [Text.StringBuilder]::new()
  [void]$sb.AppendLine("window.SIDEBAR_CONFIG = {")
  [void]$sb.AppendLine("  topLinks: [")
  [void]$sb.AppendLine('    ["index.html", "Home"]')
  [void]$sb.AppendLine("  ],")
  [void]$sb.AppendLine("  groups: [")

  for ($i = 0; $i -lt $groups.Count; $i++) {
    $g  = $groups[$i]
    $gc = if ($i -lt $groups.Count - 1) { "," } else { "" }
    [void]$sb.AppendLine("    {")
    [void]$sb.AppendLine("      key: `"$($g.key)`",")
    [void]$sb.AppendLine("      title: `"$($g.title)`",")
    [void]$sb.AppendLine("      links: [")

    $links = @($g.links)
    for ($j = 0; $j -lt $links.Count; $j++) {
      $lc = if ($j -lt $links.Count - 1) { "," } else { "" }
      [void]$sb.AppendLine("        [`"$($links[$j].path)`", `"$($links[$j].label)`"]$lc")
    }

    [void]$sb.AppendLine("      ]")
    [void]$sb.AppendLine("    }$gc")
  }

  [void]$sb.AppendLine("  ]")
  [void]$sb.Append("};")

  [IO.File]::WriteAllText($outFile, $sb.ToString(), [Text.Encoding]::UTF8)

  $totalLinks = ($groups | ForEach-Object { $_.links.Count } | Measure-Object -Sum).Sum
  Write-Host "[$(Get-Date -Format 'HH:mm:ss')] sidebar-data.js updated — $($groups.Count) groups, $totalLinks links"
}

# Always run once on startup
New-SidebarData -Root $RootPath

if ($Watch) {
  $docPath = Join-Path $RootPath "document"
  Write-Host "Watching $docPath ... (Ctrl+C to stop)"

  $watcher = [IO.FileSystemWatcher]::new($docPath)
  $watcher.Filter = "*.html"
  $watcher.IncludeSubdirectories = $true
  $watcher.EnableRaisingEvents = $true
  $watcher.NotifyFilter = [IO.NotifyFilters]::FileName -bor [IO.NotifyFilters]::LastWrite

  try {
    while ($true) {
      $result = $watcher.WaitForChanged([IO.WatcherChangeTypes]::All, 1000)
      if (-not $result.TimedOut) {
        Write-Host "  [$($result.ChangeType)] $($result.Name)"
        New-SidebarData -Root $RootPath
      }
    }
  } finally {
    $watcher.Dispose()
    Write-Host "Watcher stopped."
  }
}
