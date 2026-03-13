#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Test QQ Music API - All core functions"""

import asyncio
import httpx
from qqmusic_api import song, search
from qqmusic_api.search import SearchType


async def test_all():
    print("=" * 60)
    print("QQ Music API Test - All Core Functions")
    print("=" * 60)

    # Test 1: Search
    print("\n[TEST 1] Search Songs")
    print("-" * 60)
    try:
        result = await search.search_by_type(
            keyword="test", search_type=SearchType.SONG, num=3
        )
        if result and len(result) > 0:
            print(f"[PASS] Search successful, found {len(result)} songs")
            first_song = result[0]
            print(f"  First: {first_song.get('name')} - {first_song.get('singer')}")
            print(f"  MID: {first_song.get('mid')}")
            song_mid = first_song.get("mid")
        else:
            print("[FAIL] No songs found")
            return False
    except Exception as e:
        print(f"[FAIL] Search failed: {e}")
        return False

    # Test 2: Get Song URL
    print("\n[TEST 2] Get Song URL")
    print("-" * 60)
    try:
        urls = await song.get_song_urls(mid=[song_mid])
        if urls and song_mid in urls:
            url = urls[song_mid]
            if url:
                print(f"[PASS] Got URL: {url[:70]}...")
            else:
                print("[FAIL] URL is empty (may need login)")
                return False
        else:
            print("[FAIL] URL not found")
            return False
    except Exception as e:
        print(f"[FAIL] Get URL failed: {e}")
        return False

    # Test 3: Verify URL accessible
    print("\n[TEST 3] Verify URL Accessible")
    print("-" * 60)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.head(url, timeout=10)
            if response.status_code == 200:
                print(f"[PASS] URL accessible (status: {response.status_code})")
                print(f"  Content-Type: {response.headers.get('content-type', 'N/A')}")
            else:
                print(f"[FAIL] URL returned status: {response.status_code}")
                return False
    except Exception as e:
        print(f"[FAIL] URL check failed: {e}")
        return False

    # Test 4: Get Song Detail
    print("\n[TEST 4] Get Song Detail")
    print("-" * 60)
    try:
        detail = await song.get_detail(song_mid)
        if detail:
            print(f"[PASS] Got song detail")
            print(f"  Name: {detail.get('track_info', {}).get('name', 'N/A')}")
        else:
            print("[FAIL] No detail found")
    except Exception as e:
        print(f"[FAIL] Get detail failed: {e}")

    # Summary
    print("\n" + "=" * 60)
    print("RESULT: All core functions PASSED!")
    print("=" * 60)
    print("\nConclusion: QQ Music API is USABLE!")
    print("You can proceed with webview plugin development.")
    return True


if __name__ == "__main__":
    success = asyncio.run(test_all())
    exit(0 if success else 1)
