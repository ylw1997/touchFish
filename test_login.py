#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Test QQ Music Login"""

import asyncio
from qqmusic_api import login
from qqmusic_api.utils.credential import Credential


async def test_login_methods():
    print("=" * 60)
    print("QQ Music Login Test")
    print("=" * 60)

    # Test 1: Check available login methods
    print("\n[TEST 1] Available Login Methods")
    print("-" * 60)

    try:
        # 检查登录模块有哪些方法
        print("Checking login module...")
        methods = [m for m in dir(login) if not m.startswith("_")]
        print(f"Available methods: {methods}")
    except Exception as e:
        print(f"Error: {e}")

    # Test 2: QR Code Login (check if we can get QR code)
    print("\n[TEST 2] QR Code Login - Get QR Code")
    print("-" * 60)

    try:
        # 尝试获取二维码
        qr_result = await login.get_qrcode()
        if qr_result:
            print(f"[PASS] Got QR code data: {type(qr_result)}")
            print(
                f"  Keys: {qr_result.keys() if isinstance(qr_result, dict) else 'N/A'}"
            )
        else:
            print("[FAIL] Failed to get QR code")
    except Exception as e:
        print(f"[FAIL] QR code error: {e}")
        import traceback

        traceback.print_exc()

    # Test 3: Phone Login (check if we can get verify code)
    print("\n[TEST 3] Phone Login - Check Interface")
    print("-" * 60)

    try:
        # 检查手机号登录接口
        phone_methods = [
            m for m in dir(login) if "phone" in m.lower() or "sms" in m.lower()
        ]
        print(f"Phone-related methods: {phone_methods}")
    except Exception as e:
        print(f"Error: {e}")

    # Test 4: Cookie/Credential Login (most important for webview)
    print("\n[TEST 4] Cookie/Credential Login")
    print("-" * 60)

    print("Credential class available: YES")
    print("Usage: Credential(musicid=..., musickey=...)")
    print("\nNote: To get credential:")
    print("  1. Login in browser")
    print("  2. Get musicid and musickey from cookies")
    print("  3. Create Credential object")

    # Test 5: Check if we can verify credential
    print("\n[TEST 5] Check Credential Interface")
    print("-" * 60)

    try:
        # 创建一个空 Credential 查看结构
        cred = Credential()
        print(f"[PASS] Credential class works")
        print(f"  Fields: {dir(cred)}")
        print(f"  Has musicid: {hasattr(cred, 'musicid')}")
        print(f"  Has musickey: {hasattr(cred, 'musickey')}")
    except Exception as e:
        print(f"[FAIL] Credential error: {e}")


if __name__ == "__main__":
    asyncio.run(test_login_methods())
