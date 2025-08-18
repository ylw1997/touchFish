/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-05 08:51:35
 * @LastEditTime: 2025-08-18 14:14:32
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\utils\signature.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
import * as path from 'path';
import * as fs from 'fs';
import * as vm from 'vm';
import * as crypto from 'crypto-js';

export function getZhihuSignature(dataToSign: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const zhihuScriptPath = path.join(__dirname, 'zhihu.js');
            const zhihuScriptCode = fs.readFileSync(zhihuScriptPath, 'utf8');

            // 为沙箱环境创建一个'require'函数，只允许加载'crypto-js'
            const sandboxRequire = (moduleName: string) => {
                if (moduleName === 'crypto-js') {
                    return crypto;
                }
                throw new Error(`Sandbox does not allow requiring module: ${moduleName}`);
            };

            // 创建沙箱，并注入必要的模块和变量
            const sandbox = {
                require: sandboxRequire,
                module: { exports: {} },
                console: console, // 脚本可能会使用console
                // zhihu.js 脚本内部会创建一个 window 对象，所以我们不需要在这里预定义
            };

            const context = vm.createContext(sandbox);

            // 在沙箱中执行 zhihu.js
            vm.runInContext(zhihuScriptCode, context);

            // 从沙箱的 module.exports 中获取脚本的导出
            const zhihuModule = context.module.exports as any;

            if (typeof zhihuModule.encrypt !== 'function') {
                return reject(new Error('zhihu.js did not export an "encrypt" function.'));
            }

            // 调用加密函数并返回结果
            const signature = zhihuModule.encrypt(dataToSign);
            resolve(signature);

        } catch (e: any) {
            reject(new Error(`Failed to execute zhihu.js in sandbox: ${e.message}`));
        }
    });
}