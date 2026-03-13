#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Debug test for QQ Music API"""

import asyncio
import traceback
from qqmusic_api import search
from qqmusic_api.search import SearchType


async def test():
    print("Testing search API...")
    print("=" * 50)

    try:
        result = await search.search_by_type(
            keyword="周杰伦", search_type=SearchType.SONG, num=5
        )
        print(f"Success! Found {len(result)} results")
        print(f"First result: {result[0]}")

    except Exception as e:
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {e}")
        print("\nFull traceback:")
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test())
