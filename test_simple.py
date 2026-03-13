#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""简单测试 QQ音乐 API"""

import asyncio
from qqmusic_api import search


async def test():
    try:
        print("Testing search API...")
        result = await search.search_by_type(keyword="test", num=1)
        print(f"Result: {result}")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False


if __name__ == "__main__":
    success = asyncio.run(test())
    print(f"Test {'PASSED' if success else 'FAILED'}")
