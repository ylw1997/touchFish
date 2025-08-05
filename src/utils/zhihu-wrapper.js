
// 该脚本是一个安全的包装器，用于在隔离的进程中执行 zhihu.js。
// 它接收一个命令行参数，并将其传递给加密函数。

// zhihu.js 具有污染性，会删除 'require'，因此我们必须先获取依赖。

// 检查命令行参数
if (process.argv.length < 3) {
    console.error('用法: node zhihu-wrapper.js <要加密的字符串>');
    process.exit(1);
}

const input = process.argv[2];
// console.log(`输入的字符串为：${input}`);

try {
    // 关键：我们在这里 require 修改后的 zhihu.js
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const zhihuModule = require('./zhihu.js');

    // 验证导出的函数是否存在
    if (typeof zhihuModule.encrypt !== 'function') {
        throw new Error('zhihu.js 未导出名为 "encrypt" 的函数。');
    }

    // 调用加密函数并打印结果到标准输出
    const signature = zhihuModule.encrypt(input);
    console.log(signature);

} catch (e) {
    // 捕获并报告任何错误
    console.error('执行 zhihu.js 时出错:', e.message);
    process.exit(1);
}
