"""QQ音乐 API 测试脚本 - 验证核心功能"""

import asyncio
import httpx
from qqmusic_api import song, search


async def test_search():
    """测试搜索功能"""
    print("\n" + "="*50)
    print("测试 1: 搜索歌曲")
    print("="*50)
    
    try:
        result = await search.search_by_type(keyword="周杰伦", num=5)
        if result and len(result) > 0:
            print(f"[OK] 搜索成功，找到 {len(result)} 首歌曲")
            print(f"   第一首: {result[0].get('name')} - {result[0].get('singer')}")
            print(f"   MID: {result[0].get('mid')}")
            return result[0]
        else:
            print("[FAIL] 搜索返回空结果")
            return None
    except Exception as e:
        print(f"[FAIL] 搜索失败: {e}")
        return None


async def test_get_song_url(song_mid):
    """测试获取歌曲 URL"""
    print("\n" + "="*50)
    print("测试 2: 获取歌曲播放 URL")
    print("="*50)
    
    try:
        urls = await song.get_song_urls(mid=[song_mid])
        if urls and song_mid in urls:
            url = urls[song_mid]
            if url:
                print(f"[OK] 成功获取 URL")
                print(f"   URL: {url[:80]}...")
                return url
            else:
                print("[FAIL] URL 为空（可能需要登录或歌曲无版权）")
                return None
        else:
            print("[FAIL] 未找到歌曲 URL")
            return None
    except Exception as e:
        print(f"[FAIL] 获取 URL 失败: {e}")
        return None


async def test_url_accessible(url):
    """测试 URL 是否可访问"""
    print("\n" + "="*50)
    print("测试 3: 验证 URL 可访问性")
    print("="*50)
    
    try:
        async with httpx.AsyncClient() as client:
            # 只请求前几个字节验证可用性
            response = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }, timeout=10)
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                print(f"[OK] URL 可访问 (状态码: {response.status_code})")
                print(f"   Content-Type: {content_type}")
                print(f"   内容长度: {len(response.content)} bytes")
                return True
            else:
                print(f"[FAIL] URL 返回错误状态码: {response.status_code}")
                return False
    except Exception as e:
        print(f"[FAIL] 访问 URL 失败: {e}")
        return False


async def main():
    print("QQ音乐 API 功能测试")
    print("="*50)
    
    # 测试 1: 搜索
    song_info = await test_search()
    if not song_info:
        print("\n[STOP] 搜索测试失败，停止后续测试")
        return
    
    song_mid = song_info.get('mid')
    
    # 测试 2: 获取 URL
    url = await test_get_song_url(song_mid)
    if not url:
        print("\n[STOP] 获取 URL 测试失败，停止后续测试")
        return
    
    # 测试 3: 验证 URL
    accessible = await test_url_accessible(url)
    
    # 总结
    print("\n" + "="*50)
    print("测试结果总结")
    print("="*50)
    print(f"搜索功能: {'[PASS]' if song_info else '[FAIL]'}")
    print(f"获取 URL: {'[PASS]' if url else '[FAIL]'}")
    print(f"URL 可访问: {'[PASS]' if accessible else '[FAIL]'}")
    
    if song_info and url and accessible:
        print("\n[SUCCESS] 核心功能验证通过！可以继续开发 webview 插件。")
    else:
        print("\n[WARNING] 部分功能验证失败，需要进一步调查。")


if __name__ == "__main__":
    asyncio.run(main())
