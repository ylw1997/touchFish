#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Debug test for QQ Music API - Check raw response"""

import asyncio
from qqmusic_api.utils.network import ApiRequest
from qqmusic_api.utils.session import get_session
from qqmusic_api.utils.common import get_searchID


async def test_raw():
    print("Testing raw API request...")
    print("=" * 50)

    try:
        session = get_session()

        # 构建请求参数
        params = {
            "searchid": get_searchID(),
            "query": "test",
            "search_type": 0,
            "num_per_page": 5,
            "page_num": 1,
            "highlight": True,
            "grp": True,
        }

        # 发送请求
        resp = await session.post(
            "https://u.y.qq.com/cgi-bin/musicu.fcg",
            json={
                "music.search.SearchCgiService": {
                    "method": "DoSearchForQQMusicMobile",
                    "module": "music.search.SearchCgiService",
                    "param": params,
                }
            },
        )

        data = resp.json()
        print(f"Response code: {data.get('code')}")
        print(f"Response message: {data.get('message', 'N/A')}")
        print(f"Full response keys: {data.keys()}")

        if "music.search.SearchCgiService" in data:
            service_data = data["music.search.SearchCgiService"]
            print(f"Service code: {service_data.get('code')}")
            print(f"Service data keys: {service_data.keys()}")
            print(f"Service data: {service_data.get('data', {})}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_raw())
