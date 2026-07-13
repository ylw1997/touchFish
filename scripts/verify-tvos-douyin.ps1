$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$checks = @(
    @{ Path = 'ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift'; Pattern = 'preferredForwardBufferDuration\s*=\s*8'; Description = '8-second forward buffer limit' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift'; Pattern = 'automaticallyWaitsToMinimizeStalling\s*=\s*false'; Description = 'short-form startup waiting policy' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift'; Pattern = 'playImmediately\(atRate:\s*1\)'; Description = 'immediate playback call' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift'; Pattern = 'cancelPendingSeeks\(\)'; Description = 'old item seek cancellation' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift'; Pattern = 'asset\.cancelLoading\(\)'; Description = 'old asset loading cancellation' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift'; Pattern = 'playbackToken'; Description = 'sequence-based playback identity' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/DouyinFeedStore.swift'; Pattern = 'maximumRetainedItems\s*=\s*40'; Description = '40-item feed limit' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/DouyinFeedStore.swift'; Pattern = 'retainedPreviousItems\s*=\s*12'; Description = '12-item previous history' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/DanmakuOverlayController.swift'; Pattern = 'rateObservation'; Description = 'danmaku rate observation' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/Views/FavoritesLibraryView.swift'; Pattern = 'aspectRatio\(3\.0\s*/\s*4\.0'; Description = '3:4 favorite artwork' }
)

$failures = @()
foreach ($check in $checks) {
    $path = Join-Path $root $check.Path
    $content = Get-Content -Raw -LiteralPath $path
    if ($content -notmatch $check.Pattern) {
        $failures += $check.Description
    }
}

$favoritesPath = Join-Path $root 'ios/TouchFishTV/TouchFishTV/Views/FavoritesLibraryView.swift'
$favorites = Get-Content -Raw -LiteralPath $favoritesPath
$playbackPath = Join-Path $root 'ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift'
$playback = Get-Content -Raw -LiteralPath $playbackPath
if ($playback -match 'load\(\.commonMetadata\)') {
    $failures += 'common metadata still blocks startup'
}
if ($favorites -match 'Text\("\\\(store\.items\.count') {
    $failures += 'favorite count label remains'
}
if ($favorites -match '\.blur\(') {
    $failures += 'favorite artwork blur remains'
}

if ($failures.Count -gt 0) {
    Write-Host 'tvOS Douyin regression checks failed:' -ForegroundColor Red
    $failures | ForEach-Object { Write-Host "- $_" -ForegroundColor Red }
    exit 1
}

Write-Host 'tvOS Douyin regression checks passed.' -ForegroundColor Green
