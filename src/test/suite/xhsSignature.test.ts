/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-22 10:59:51
 * @LastEditTime: 2025-10-22 11:56:18
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\test\suite\xhsSignature.test.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
import * as assert from 'assert';
import { getXhsSignature } from '../../utils/signature';

suite('XHS Signature Generation', () => {
    test('should produce xs and xt', async () => {
        const res = await getXhsSignature('/api/sns/web/v1/homefeed', {});
        assert.ok(typeof res['xs'] === 'string' && res['xs'].length > 0, 'xs should be non-empty string');
        assert.ok(typeof res['xt'] === 'number' || typeof res['xt'] === 'string', 'xt should exist');
    });
});
