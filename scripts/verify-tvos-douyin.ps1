$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$checks = @(
    @{ Path = 'ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift'; Pattern = 'preferredForwardBufferDuration\s*=\s*8'; Description = '8-second forward buffer limit' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift'; Pattern = 'automaticallyWaitsToMinimizeStalling\s*=\s*false'; Description = 'short-form startup waiting policy' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift'; Pattern = 'playImmediately\(atRate:\s*1\)'; Description = 'immediate playback call' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift'; Pattern = 'cancelPendingSeeks\(\)'; Description = 'old item seek cancellation' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift'; Pattern = 'asset\.cancelLoading\(\)'; Description = 'old asset loading cancellation' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift'; Pattern = 'instanceID'; Description = 'player instance diagnostics identity' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/PlaybackCoordinator.swift'; Pattern = 'deinit\s*\{'; Description = 'player instance release diagnostics' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/Views/VideoPlayerView.swift'; Pattern = 'playbackToken'; Description = 'sequence-based playback identity' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/DouyinFeedStore.swift'; Pattern = 'retainedPreviousItems\s*=\s*5'; Description = '5-item previous history' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/DouyinFeedStore.swift'; Pattern = 'activeIndex\s*-\s*retainedPreviousItems'; Description = 'played history trimming' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/DouyinFeedStore.swift'; Pattern = 'preloadRemainingItems\s*=\s*2'; Description = 'two-item preload threshold' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/DouyinAPI.swift'; Pattern = 'channel/feed/\?device_platform=webapp&aid=6383&count=10&'; Description = 'ten-item recommendation request upper bound' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/DanmakuOverlayController.swift'; Pattern = 'rateObservation'; Description = 'danmaku rate observation' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/ContentView.swift'; Pattern = 'TabView\(selection:\s*\$selectedTab\)'; Description = 'selected native tab lifecycle' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/ContentView.swift'; Pattern = 'DouyinFeedView\(feedType:\s*\.recommend,\s*isActive:\s*selectedTab\s*==\s*\.recommend\)'; Description = 'recommend feed active state' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/ContentView.swift'; Pattern = 'DouyinFeedView\(feedType:\s*\.following,\s*isActive:\s*selectedTab\s*==\s*\.following\)'; Description = 'following feed active state' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/ContentView.swift'; Pattern = 'FavoritesLibraryView\(isActive:\s*selectedTab\s*==\s*\.favorites\)'; Description = 'favorites active state' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/Views/DouyinFeedView.swift'; Pattern = 'if\s+isActive,\s*let\s+aweme\s*=\s*store\.activeItem'; Description = 'active-only player mounting' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/Views/FavoritesLibraryView.swift'; Pattern = 'get:\s*\{\s*isActive\s*&&\s*selectedIndex\s*!=\s*nil\s*\}'; Description = 'active-only favorites player presentation' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/Views/FavoritesLibraryView.swift'; Pattern = 'onChange\(of:\s*isActive\)[\s\S]*?if\s*!active\s*\{\s*selectedIndex\s*=\s*nil'; Description = 'favorites player dismissal on tab exit' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/Views/FavoritesLibraryView.swift'; Pattern = 'if\s*!isActive\s*\|\|\s*selectedIndex\s*!=\s*nil\s*\{\s*Color\.black\.ignoresSafeArea\(\)'; Description = 'favorite grid unloading while inactive or playing' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/Views/FavoritesLibraryView.swift'; Pattern = 'aspectRatio\(3\.0\s*/\s*4\.0'; Description = '3:4 favorite artwork' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/Views/FavoritesLibraryView.swift'; Pattern = 'buttonStyle\(FavoriteButtonStyle\(\)\)'; Description = 'background-free favorite button style' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/Views/FavoritesLibraryView.swift'; Pattern = 'focusEffectDisabled\(\)'; Description = 'disabled inner focus effect' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/Views/FavoritesLibraryView.swift'; Pattern = 'scaleEffect\(isFocused'; Description = 'whole lockup focus scaling' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/Views/FavoritesLibraryView.swift'; Pattern = 'Color\.clear[\s\S]*?aspectRatio\(3\.0\s*/\s*4\.0[\s\S]*?overlay'; Description = 'fixed portrait overlay artwork' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/Views/FavoritesLibraryView.swift'; Pattern = 'font\(\.subheadline\.weight'; Description = 'smaller favorite title' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/Views/FavoritesLibraryView.swift'; Pattern = 'lineLimit\(2\)'; Description = 'two-line favorite title' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/Views/FavoritesLibraryView.swift'; Pattern = 'avatar_thumb'; Description = 'favorite author avatar' },
    @{ Path = 'ios/TouchFishTV/TouchFishTV/Views/FavoritesLibraryView.swift'; Pattern = 'digg_count'; Description = 'favorite like count' }
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
if ($favorites -match 'buttonStyle\(\.card\)') {
    $failures += 'favorite outer card background remains'
}
if ($favorites -match 'buttonStyle\(\.borderless\)') {
    $failures += 'borderless inner artwork focus effect remains'
}
if ($favorites -match 'buttonStyle\(\.plain\)') {
    $failures += 'plain system focus platter remains'
}
if ($favorites -match 'private struct FavoriteArtwork[\s\S]*?GeometryReader') {
    $failures += 'favorite artwork still uses focus-unsafe GeometryReader sizing'
}
if ($favorites -match 'private struct FavoriteArtwork[\s\S]*?\.background\(Color\.white') {
    $failures += 'favorite artwork background remains'
}

if ($failures.Count -gt 0) {
    Write-Host 'tvOS Douyin regression checks failed:' -ForegroundColor Red
    $failures | ForEach-Object { Write-Host "- $_" -ForegroundColor Red }
    exit 1
}

Write-Host 'tvOS Douyin regression checks passed.' -ForegroundColor Green
