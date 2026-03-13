#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""完整测试 QQ音乐 API"""

import asyncio
import sys
from qqmusic_api import search, song
from qqmusic_api.search import SearchType


async def test_search():
    """测试搜索"""
    print("=" * 50)
    print("TEST 1: Search songs")
    print("=" * 50)

    try:
        result = await search.search_by_type(
            keyword="周杰伦", search_type=SearchType.SONG, num=5
        )

        if result and len(result) > 0:
            print(f"[OK] Found {len(result)} songs")
            first_song = result[0]
            print(
                f"  First: {first_song.get('name', 'N/A')} - {first_song.get('singer', 'N/A')}"
            )
            print(f"  MID: {first_song.get('mid', 'N/A')}")
            return first_song.get("mid")
        else:
            print("[FAIL] No songs found")
            return None

    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return None


async def test_get_url(song_mid):
    """测试获取URL"""
    print("\n" + "=" * 50)
    print("TEST 2: Get song URL")
    print("=" * 50)

    try:
        urls = await song.get_song_urls(mid=[song_mid])

        if urls and song_mid in urls:
            url = urls[song_mid]
            if url:
                print(f"[OK] Got URL: {url[:60]}...")
                return url
            else:
                print("[FAIL] URL is empty (may need login)")
                return None
        else:
            print("[FAIL] URL not found in response")
            return None

    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return None


async def main():
    print("QQ Music API Test")
    print("=" * 50)

    # Test 1
    song_mid = await test_search()
    if not song_mid:
        print("\n[STOP] Search failed")
        return False

    # Test 2
    url = await test_get_url(song_mid)
    if not url:
        print("\n[STOP] Get URL failed")
        return False

    print("\n" + "=" * 50)
    print("RESULT: All tests PASSED")
    print("=" * 50)
    return True


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
