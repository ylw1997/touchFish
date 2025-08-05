
import { execFile } from 'child_process';
import * as path from 'path';

// 定义一个函数，用于通过安全的子进程调用 zhihu.js 加密逻辑
export function getZhihuSignature(dataToSign: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // 定义包装器脚本的路径
        const wrapperPath = path.join(__dirname, 'zhihu-wrapper.js');

        // 定义要传递给脚本的参数
        const args = [dataToSign];

        // 使用 execFile 安全地执行脚本
        // execFile 比 exec 更安全，因为它不会启动一个 shell
        execFile('node', [wrapperPath, ...args], (error, stdout, stderr) => {
            if (error) {
                // 如果子进程出错，拒绝 Promise
                return reject(new Error(`执行签名脚本失败: ${error.message}`));
            }
            if (stderr) {
                // 如果有标准错误输出，也拒绝 Promise
                return reject(new Error(`签名脚本错误输出: ${stderr}`));
            }
            // 成功时，解析标准输出并返回结果
            resolve(stdout.trim());
        });
    });
}
